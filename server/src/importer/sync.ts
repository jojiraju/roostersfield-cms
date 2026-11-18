/**
 * "Update from Excel": brings the database up to date with a newer copy of the workbook WITHOUT wiping anything.
 *  - entries already in the database are left alone (their ids, bill numbers and any edits stay);
 *  - entries that are new in the workbook are added to the right farm/batch;
 *  - entries whose amounts were corrected in the workbook replace the earlier imported version;
 *  - entries typed in the software, and entries that are no longer in the workbook, are never touched.
 */
import { all, backupLocal, deferWrites, get } from '../db.ts';
import { sysAccountId } from '../seed.ts';
import { daysBetween } from '../util.ts';
import { deleteVoucher } from '../services/posting.ts';
import { cleanRows, farmResolver, groupRows, importJournal } from './core.ts';
import type { ImportReport, JournalRow } from './core.ts';

export interface SyncReport {
  workbookEntries: number; unchanged: number; added: number; corrected: number; removed: number; keptNotInWorkbook: number;
  newBatches: number; importReport: ImportReport | null; backup: string | null; warnings: string[];
  details: { added: string[]; corrected: string[]; notInWorkbook: string[] }; check: WorkbookCheck; removedTyped: string[];
}

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, ' ').trim();
const rowKey = (date: string, desc: string, acct: string, dr: number, cr: number) => `${date}|${desc}|${acct}|${dr.toFixed(2)}|${cr.toFixed(2)}`;

export async function syncJournal(allRows: JournalRow[], tb: Record<string, string>, opts: { userId: number | null; prune?: boolean; removeTypedDuplicates?: boolean }): Promise<SyncReport> {
  const warnings: string[] = [];
  const warn = (m: string) => { if (warnings.length < 60) warnings.push(m); };
  const rows = cleanRows(allRows, warn);
  const { isFarmAccount } = farmResolver(rows, tb);
  const wip = await sysAccountId('wip'), suspense = await sysAccountId('suspense');

  // workbook side: voucher (as the importer will group it) → rows. Every row takes its voucher's date, exactly like the stored entries do.
  const wb = new Map<string, { rows: JournalRow[]; keys: string[] }>();
  for (const grp of groupRows(rows)) {
    const date = grp.rows[0].date!;
    for (const r of grp.rows) {
      const desc = norm(r.description.slice(0, 200));
      const g = `${date}|${desc}`;
      const e = wb.get(g) ?? { rows: [], keys: [] };
      e.rows.push(r);
      e.keys.push(rowKey(date, desc, isFarmAccount(r.account) ? '@FARM' : norm(r.account), r.debit, r.credit));
      wb.set(g, e);
    }
  }

  // database side: imported entries only
  const dbRows = await all<{ vid: number; date: string; narration: string | null; description: string; account_id: number; name: string; debit: number; credit: number }>(
    `SELECT v.id vid, v.date, e.narration, v.description, e.account_id, a.name, e.debit, e.credit
       FROM entries e JOIN vouchers v ON v.id=e.voucher_id JOIN accounts a ON a.id=e.account_id WHERE v.source='import' ORDER BY v.id, e.id`);
  const db = new Map<string, { vouchers: Set<number>; keys: string[] }>();
  for (const r of dbRows) {
    if (r.account_id === suspense && (r.narration ?? '').startsWith('Import difference')) continue;
    const desc = norm((r.narration ?? r.description).slice(0, 200));
    const g = `${r.date}|${desc}`;
    const e = db.get(g) ?? { vouchers: new Set<number>(), keys: [] };
    e.vouchers.add(r.vid);
    e.keys.push(rowKey(r.date, desc, r.account_id === wip ? '@FARM' : r.name, r.debit, r.credit));
    db.set(g, e);
  }
  const sameMultiset = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join('\n') === [...b].sort().join('\n');

  let unchanged = 0, added = 0, corrected = 0;
  const changedKeys = new Set<string>();
  const supersede = new Set<number>();
  const detailsCorrected: string[] = [];
  const detailsAdded: string[] = [];
  for (const [g, w] of wb) {
    const d = db.get(g);
    if (!d) { changedKeys.add(g); added += 1; if (detailsAdded.length < 100) detailsAdded.push(`${w.rows[0].date} · ${w.rows[0].description.trim()}`); continue; }
    if (sameMultiset(w.keys, d.keys)) { unchanged += 1; continue; }
    changedKeys.add(g); corrected += 1;
    for (const v of d.vouchers) supersede.add(v);
    if (detailsCorrected.length < 100) detailsCorrected.push(`${w.rows[0].date} · ${w.rows[0].description.trim()}`);
  }
  const notInWorkbook = [...db.keys()].filter((g) => !wb.has(g));
  // "Remove deleted entries": imported entries whose date + description are no longer in the workbook (deleted there, or their
  // date/description was edited — the edited version is added as new, so keeping the old one would count it twice).
  const remove = new Set<number>();
  if (opts.prune) for (const g of notInWorkbook) for (const v of db.get(g)!.vouchers) remove.add(v);

  const deltaRows: JournalRow[] = [];
  for (const grp of groupRows(rows)) {
    const date = grp.rows[0].date!;
    for (const r of grp.rows) if (changedKeys.has(`${date}|${norm(r.description.slice(0, 200))}`)) deltaRows.push(r);
  }
  const details = { added: detailsAdded, corrected: detailsCorrected, notInWorkbook: notInWorkbook.slice(0, 100) };
  if (!deltaRows.length && !remove.size) {
    return { workbookEntries: wb.size, unchanged, added: 0, corrected: 0, removed: 0, keptNotInWorkbook: notInWorkbook.length, newBatches: 0, importReport: null, backup: null, warnings,
      details, ...(await finish(rows, tb, opts)) };
  }

  const backup = await backupLocal('before-sync');
  const batchesBefore = (await all<{ n: number }>('SELECT COUNT(*) n FROM batches'))[0].n;
  // All writes go to the database as one atomic batch at the end — on the hosted database a statement-by-statement
  // transaction took far longer than the request is allowed to run, so the update was rolled back and nothing was added.
  const gone = [...supersede, ...remove];
  const importReport = await deferWrites(async () => {
    for (const id of gone) await deleteVoucher(id);
    return deltaRows.length ? importJournal(deltaRows, tb, { replace: false, userId: opts.userId, prepared: true, context: rows, append: true, ignoreVouchers: gone }) : null;
  });
  if (importReport) {
    // the report's totals were read before the batch was written: refresh them
    const st = (await get<{ a: string | null; b: string | null }>('SELECT MIN(date) a, MAX(date) b FROM vouchers'))!;
    importReport.firstDate = st.a; importReport.lastDate = st.b;
    importReport.farms = (await get<{ n: number }>('SELECT COUNT(*) n FROM farms'))!.n;
    importReport.runningBatches = (await get<{ n: number }>(`SELECT COUNT(*) n FROM batches WHERE status='running'`))!.n;
  }
  const batchesAfter = (await all<{ n: number }>('SELECT COUNT(*) n FROM batches'))[0].n;
  return {
    workbookEntries: wb.size, unchanged, added, corrected, removed: opts.prune ? notInWorkbook.length : 0, keptNotInWorkbook: opts.prune ? 0 : notInWorkbook.length,
    newBatches: batchesAfter - batchesBefore, importReport, backup, warnings: [...warnings, ...(importReport?.warnings ?? [])].slice(0, 60),
    details, ...(await finish(rows, tb, opts)),
  };
}

/** Optionally removes software entries that duplicate a workbook entry, then checks the result against the workbook. */
async function finish(rows: JournalRow[], tb: Record<string, string>, opts: { removeTypedDuplicates?: boolean }) {
  let removedTyped: string[] = [];
  if (opts.removeTypedDuplicates) {
    const dups = (await typedEntries()).filter((t) => t.duplicateOf);
    if (dups.length) await deferWrites(async () => { for (const d of dups) await deleteVoucher(d.id); });
    removedTyped = dups.map((d) => `${d.date} · ${d.description} · ₹${d.amount}`);
  }
  return { removedTyped, check: await checkAgainstWorkbook(rows, tb) };
}

export interface TypedEntry { id: number; date: string; description: string; amount: number; duplicateOf: string | null }

/**
 * Entries typed in the software, each matched (where possible) to the workbook entry it duplicates: an imported entry within
 * 3 days that has exactly the same lines (same accounts, same farm for farm costs, same amounts). When the same bill is typed
 * in the software AND in Excel, it is counted twice once the workbook is uploaded.
 */
async function typedEntries(): Promise<TypedEntry[]> {
  const wip = await sysAccountId('wip'), suspense = await sysAccountId('suspense');
  const lines = await all<{ vid: number; source: string; date: string; description: string; account_id: number; farm_id: number | null; debit: number; credit: number; narration: string | null }>(
    `SELECT v.id vid, v.source, v.date, v.description, e.account_id, e.farm_id, e.debit, e.credit, e.narration FROM entries e JOIN vouchers v ON v.id=e.voucher_id ORDER BY v.id, e.id`);
  const vs = new Map<number, { source: string; date: string; description: string; sig: string[]; amount: number }>();
  for (const l of lines) {
    if (l.account_id === suspense && (l.narration ?? '').startsWith('Import difference')) continue;
    const v = vs.get(l.vid) ?? { source: l.source, date: l.date, description: l.description, sig: [], amount: 0 };
    v.sig.push(`${l.account_id}|${l.account_id === wip ? l.farm_id ?? '' : ''}|${Number(l.debit).toFixed(2)}|${Number(l.credit).toFixed(2)}`);
    v.amount += Number(l.debit);
    vs.set(l.vid, v);
  }
  const imported = new Map<string, { id: number; date: string; description: string }[]>();
  for (const [id, v] of vs) if (v.source === 'import') {
    const k = v.sig.sort().join(';');
    if (!imported.has(k)) imported.set(k, []);
    imported.get(k)!.push({ id, date: v.date, description: v.description });
  }
  const claimed = new Set<number>();
  const out: TypedEntry[] = [];
  for (const [id, v] of vs) {
    if (v.source === 'import') continue;
    const cands = (imported.get(v.sig.sort().join(';')) ?? []).filter((c) => !claimed.has(c.id) && Math.abs(daysBetween(c.date, v.date)) <= 3)
      .sort((a, b) => Math.abs(daysBetween(a.date, v.date)) - Math.abs(daysBetween(b.date, v.date)));
    const m = cands[0];
    if (m) claimed.add(m.id);
    out.push({ id, date: v.date, description: v.description, amount: Math.round(v.amount * 100) / 100, duplicateOf: m ? `${m.date} · ${m.description}` : null });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface WorkbookCheck {
  accounts: number;
  /** accounts whose balance from the imported entries differs from the workbook */
  mismatches: { account: string; workbook: number; software: number }[];
  /** entries typed in the software (not from Excel) — these are on top of the workbook's figures */
  typedInSoftware: number;
  typed: TypedEntry[];
}

/** Balance of every account (each farm separately) from the imported entries, against the same balance worked out from the workbook. */
async function checkAgainstWorkbook(rows: JournalRow[], tb: Record<string, string>): Promise<WorkbookCheck> {
  const { isFarmAccount, resolveFarmKey, farmNames } = farmResolver(rows, tb);
  const xl = new Map<string, number>();
  for (const r of rows) {
    const k = isFarmAccount(r.account) ? `${farmNames.get(resolveFarmKey(r.account)!)}` : norm(r.account);
    xl.set(k, (xl.get(k) ?? 0) + r.debit - r.credit);
  }
  const suspense = await sysAccountId('suspense');
  const app = new Map<string, number>();
  for (const r of await all<{ name: string; sys_key: string | null; farm: string | null; bal: number }>(
    `SELECT a.name, a.sys_key, f.name farm, SUM(e.debit-e.credit) bal
       FROM entries e JOIN vouchers v ON v.id=e.voucher_id JOIN accounts a ON a.id=e.account_id LEFT JOIN farms f ON f.id=e.farm_id
      WHERE v.source='import' AND NOT (e.account_id=? AND COALESCE(e.narration,'') LIKE 'Import difference%')
      GROUP BY a.id, CASE WHEN a.sys_key='wip' THEN e.farm_id END`, suspense)) {
    const k = r.sys_key === 'wip' ? `${r.farm ?? 'FARM (none)'}` : norm(r.name);
    app.set(k, (app.get(k) ?? 0) + r.bal);
  }
  const keys = new Set([...xl.keys(), ...app.keys()]);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const mismatches = [...keys].map((k) => ({ account: k, workbook: r2(xl.get(k) ?? 0), software: r2(app.get(k) ?? 0) }))
    .filter((d) => Math.abs(d.workbook - d.software) >= 1)
    .sort((a, b) => Math.abs(b.workbook - b.software) - Math.abs(a.workbook - a.software));
  const typed = await typedEntries();
  return { accounts: keys.size, mismatches: mismatches.slice(0, 50), typedInSoftware: typed.length, typed: typed.slice(0, 200) };
}
