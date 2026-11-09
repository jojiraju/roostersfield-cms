/**
 * "Update from Excel": brings the database up to date with a newer copy of the workbook WITHOUT wiping anything.
 *  - entries already in the database are left alone (their ids, bill numbers and any edits stay);
 *  - entries that are new in the workbook are added to the right farm/batch;
 *  - entries whose amounts were corrected in the workbook replace the earlier imported version;
 *  - entries typed in the software, and entries that are no longer in the workbook, are never touched.
 */
import { all, backupLocal, tx } from '../db.ts';
import { sysAccountId } from '../seed.ts';
import { deleteVoucher } from '../services/posting.ts';
import { cleanRows, farmResolver, groupRows, importJournal } from './core.ts';
import type { ImportReport, JournalRow } from './core.ts';

export interface SyncReport {
  workbookEntries: number; unchanged: number; added: number; corrected: number; keptNotInWorkbook: number;
  newBatches: number; importReport: ImportReport | null; backup: string | null; warnings: string[];
  details: { added: string[]; corrected: string[]; notInWorkbook: string[] };
}

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, ' ').trim();
const rowKey = (date: string, desc: string, acct: string, dr: number, cr: number) => `${date}|${desc}|${acct}|${dr.toFixed(2)}|${cr.toFixed(2)}`;

export async function syncJournal(allRows: JournalRow[], tb: Record<string, string>, opts: { userId: number | null }): Promise<SyncReport> {
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

  const deltaRows: JournalRow[] = [];
  for (const grp of groupRows(rows)) {
    const date = grp.rows[0].date!;
    for (const r of grp.rows) if (changedKeys.has(`${date}|${norm(r.description.slice(0, 200))}`)) deltaRows.push(r);
  }
  if (!deltaRows.length) {
    return { workbookEntries: wb.size, unchanged, added: 0, corrected: 0, keptNotInWorkbook: notInWorkbook.length, newBatches: 0, importReport: null, backup: null, warnings,
      details: { added: [], corrected: [], notInWorkbook: notInWorkbook.slice(0, 100) } };
  }

  const backup = await backupLocal('before-sync');
  const batchesBefore = (await all<{ n: number }>('SELECT COUNT(*) n FROM batches'))[0].n;
  const importReport = await tx(async () => {
    for (const id of supersede) await deleteVoucher(id);
    return importJournal(deltaRows, tb, { replace: false, userId: opts.userId, prepared: true, context: rows, append: true });
  });
  const batchesAfter = (await all<{ n: number }>('SELECT COUNT(*) n FROM batches'))[0].n;
  return {
    workbookEntries: wb.size, unchanged, added, corrected, keptNotInWorkbook: notInWorkbook.length, newBatches: batchesAfter - batchesBefore,
    importReport, backup, warnings: [...warnings, ...importReport.warnings].slice(0, 60),
    details: { added: detailsAdded, corrected: detailsCorrected, notInWorkbook: notInWorkbook.slice(0, 100) },
  };
}
