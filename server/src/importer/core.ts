/**
 * Excel → database migration.
 *
 * The client's workbook is a flat double-entry journal (sheet JOURNALS): every business event is two or more
 * rows (debit row + credit row). Farms are separate "accounts" in Excel; here they become real Farms with
 * Batches, and their cost is tracked in one Work-in-Progress account with a farm/batch dimension.
 * Batches are inferred from the data: a batch starts at the first chick purchase and ends with the
 * "COGS applied" entry that clears the farm's account.
 */
import { all, backupLocal, get, run, tx } from '../db.ts';
import { config } from '../config.ts';
import { addAccount, sysAccountId } from '../seed.ts';
import { CATEGORY_TYPE, addDays, daysBetween, round2, today } from '../util.ts';
import type { Category } from '../util.ts';
import { postVoucher } from '../services/posting.ts';
import type { EntryInput } from '../services/posting.ts';
import fs from 'node:fs';
import path from 'node:path';

export interface JournalRow {
  row: number; date: string | null; description: string; account: string; item: string; item2: string;
  qty: number | null; weight: number | null; price: number | null; debit: number; credit: number;
}
export interface ImportReport {
  rows: number; vouchers: number; entries: number; accounts: number; farms: number; batches: number;
  runningBatches: number; adjustedVouchers: number; suspenseNet: number; warnings: string[]; backup: string | null;
  firstDate: string | null; lastDate: string | null;
}

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, ' ').trim();
const key = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

const BANKS = new Set(['SIB EDAKKARA', 'ICICI JIMSON', 'CANARA JIMSON']);
const TRADERS = new Set(['NOUSHAD BROAST', 'CK CHICKEN', 'TPA CHICKEN', 'ABBAS EDAKKARA', 'FATHIMA CHICKEN', 'NAROKKAV CHICKEN STALL', 'NOUFAL EDAKKARA', 'MAJEED', 'SUGU', 'REHAN CHICKEN', 'KAREEM AKAMPADAM', 'ABI AGENCIES']);
const FEED_SUPPLIERS = new Set(['REHAN FEEDS', 'CK ENTERPRISES', 'FATHIMA ENTERPRISES', 'TPA FEEDS', 'VTM AGENCIES']);
const MED_SUPPLIERS = new Set(['JV MED', 'LIFE MEDICALS', 'FATHIMA VACCINE', 'TS VETINARY WNDR', 'DR SURESH']);
const CHICK_SUPPLIERS = new Set(['NATIONAL HATCHERIES', 'ALTHAF CHICKS', 'REHAN CHICKS', 'MOHANS HATCHRIES TIRUR']);
const LOANS = new Set(['GOLD LOAN', 'OD JIMSON', 'OD BINU', 'KSMDFC', 'MASHOOD', 'JOMOAN', 'SHATHI AYALKOOTAM', 'BINU AGRI LOAN', 'BAJAJFINANCE']);
const EQUITY = new Set(['EQUITY-JIMSON', 'EQUITY-BINU', 'DRAWINGS']);
const FIXED = new Set(['REAL ESTATE', 'EDAKKARA SHED', 'OFFICE EQUIPMENTS', 'FURNITURE', 'GLASS AND SEALING', 'POULTRY SHED']);
const FARMERS = new Set(['LALU', 'JITHU', 'MADHU', 'MATHAI', 'SHAREEFA', 'RAHIYANATH', 'MANTHONI KUNJAPPU', 'NAVAJITH', 'USMAN', 'THONIKAI', 'RAFEEK', 'SHAMSEER']);
const FARM_RE = /\bFARM\s*\d*$/;

function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

function inferCategory(name: string, tb: string | undefined, netDebit: number): { category: Category; subtype?: string } {
  if (BANKS.has(name)) return { category: 'bank' };
  if (name === 'CASH') return { category: 'cash' };
  if (TRADERS.has(name)) return { category: 'trader' };
  if (FEED_SUPPLIERS.has(name)) return { category: 'supplier', subtype: 'feed' };
  if (MED_SUPPLIERS.has(name)) return { category: 'supplier', subtype: 'medicine' };
  if (CHICK_SUPPLIERS.has(name)) return { category: 'supplier', subtype: 'chicks' };
  if (LOANS.has(name)) return { category: 'loan' };
  if (EQUITY.has(name)) return { category: 'equity' };
  if (FIXED.has(name)) return { category: 'fixed_asset' };
  if (FARMERS.has(name)) return { category: 'farmer' };
  const t = (tb ?? '').toUpperCase();
  if (t.includes('ESPENSES') || t.includes('EXPENSE')) return { category: 'expense' };
  if (t.includes('FIXED')) return { category: 'fixed_asset' };
  if (t.includes('LIABILITY')) return { category: 'other_liability' };
  if (t.includes('ASSET')) return { category: 'other_asset' };
  return { category: netDebit >= 0 ? 'other_asset' : 'other_liability' };
}

interface Line { acct: number; farm: number | null; debit: number; credit: number; row: JournalRow; isFarmAccount: boolean }
interface Group { key: string; rows: JournalRow[]; dr: number; cr: number }
interface MemBatch {
  farm: number; no: number; placement: string | null; firstDate: string; lastDate: string; chicksDate: string | null; chicksQty: number;
  closed: boolean; closedDate: string | null; hasCogs: boolean; carry: boolean; saleDates: string[]; cogs: number; cost: number; integ: number; lastSale: string | null; realId?: number;
}

export async function importJournal(allRows: JournalRow[], tb: Record<string, string>, opts: { replace: boolean; userId: number | null }): Promise<ImportReport> {
  const warnings: string[] = [];
  const warn = (m: string) => { if (warnings.length < 60) warnings.push(m); };

  // --- 0. clean rows & repair dates
  const rows: JournalRow[] = [];
  let prev: string | null = null;
  const yearCount = new Map<string, number>();
  for (const r of allRows) if (r.date) yearCount.set(r.date.slice(0, 4), (yearCount.get(r.date.slice(0, 4)) ?? 0) + 1);
  const dominantYear = [...yearCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? String(new Date().getFullYear());
  for (let r of allRows) {
    if (!r.account) { if (r.debit || r.credit) warn(`Row ${r.row}: amount without an account — skipped`); continue; }
    if (!r.debit && !r.credit) continue;
    // A negative debit is a credit (and vice-versa); net out lines that carry both.
    const net = r.debit - r.credit;
    if (r.debit < 0 || r.credit < 0 || (r.debit && r.credit)) warn(`Row ${r.row}: unusual amount (debit ${r.debit}, credit ${r.credit}) — treated as ${net >= 0 ? 'debit' : 'credit'} ${Math.abs(net)}`);
    if (Math.abs(net) < 0.005) continue;
    r = { ...r, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 };
    let d = r.date;
    if (!d) d = prev;
    else if (d.slice(0, 4) !== dominantYear) {
      // typo such as 2029-09-12 in a 2026 book: keep day & month, use the book's year
      const fixed = dominantYear + d.slice(4);
      warn(`Row ${r.row}: date ${d} looked wrong, used ${fixed}`);
      d = fixed;
    }
    if (!d) { warn(`Row ${r.row}: no date — skipped`); continue; }
    prev = d;
    rows.push({ ...r, date: d });
  }

  // --- 1. discover farm names (accounts that look like farms and carry entries)
  const farmNames = new Map<string, string>(); // key -> display
  for (const r of rows) {
    const n = norm(r.account);
    const cls = tb[n];
    if (FARM_RE.test(n) && !/OWNER|RENT/.test(n) && (!cls || cls.toUpperCase().includes('ASSET'))) farmNames.set(key(n), n);
  }
  // A farm reference is "<name> FARM <n>": split it so spelling variants (MAMAGARA / MAMANGARA / MAMNKARA FARM1) can be matched.
  const parts = (k: string) => { const m = /^(.*?)F?FARM(\d*)$/.exec(k); return m ? { base: m[1], num: m[2] === '1' ? '' : m[2] } : null; };
  const farmInfo = [...farmNames.keys()].map((k) => ({ k, ...parts(k)! })).filter((f) => f.base !== undefined);
  const farmCache = new Map<string, string | null>();
  const resolveFarmKey = (text: string): string | null => {
    const k = key(text);
    if (!k) return null;
    if (farmCache.has(k)) return farmCache.get(k)!;
    let found: string | null = null;
    if (farmNames.has(k)) found = k;
    else if (!/OWNER|RENT/.test(k)) {
      const p = parts(k);
      if (p && p.base.length >= 3) {
        let best = 99;
        for (const f of farmInfo) {
          if (f.num !== p.num) continue;
          const dist = lev(p.base, f.base);
          if (dist < best) { best = dist; found = f.k; }
        }
        if (best > Math.max(2, Math.floor(p.base.length * 0.3))) found = null;
      }
    }
    farmCache.set(k, found);
    return found;
  };

  // --- 2. wipe (replace mode) after taking a backup
  let backup: string | null = null;
  if (opts.replace && ((await get<{ n: number }>('SELECT COUNT(*) n FROM vouchers'))?.n ?? 0) > 0) {
    backup = await backupLocal('before-import');
  }

  return await tx(async () => {
    if (opts.replace) {
      for (const t of ['entries', 'vouchers', 'cash_counts', 'batches', 'farms']) await run(`DELETE FROM ${t}`);
      await run('DELETE FROM accounts WHERE sys_key IS NULL');
    }
    const wip = await sysAccountId('wip'), salesId = await sysAccountId('sales'), cogsId = await sysAccountId('cogs'), suspenseId = await sysAccountId('suspense');
    const cashId = await sysAccountId('cash');

    // net debit per account name (to classify unknown ones)
    const netDebit = new Map<string, number>();
    for (const r of rows) netDebit.set(norm(r.account), (netDebit.get(norm(r.account)) ?? 0) + r.debit - r.credit);

    const accCache = new Map<string, { id: number; category: string; subtype: string | null }>();
    const sysByName: Record<string, number> = { CASH: cashId, SALES: salesId, 'COST OF GOODS SOLD': cogsId };
    let accountsCreated = 0;
    const resolveAccount = async (name: string) => {
      const n = norm(name);
      let a = accCache.get(n);
      if (a) return a;
      const ex = await get<{ id: number; category: string; subtype: string | null }>('SELECT id,category,subtype FROM accounts WHERE name=?', n);
      if (ex) a = ex;
      else if (sysByName[n]) a = (await get<{ id: number; category: string; subtype: string | null }>('SELECT id,category,subtype FROM accounts WHERE id=?', sysByName[n]))!;
      else {
        const inf = inferCategory(n, tb[n], netDebit.get(n) ?? 0);
        const id = await addAccount(n, inf.category, { subtype: inf.category === 'supplier' ? inf.subtype ?? 'other' : null });
        accountsCreated++;
        a = { id, category: inf.category, subtype: inf.subtype ?? null };
      }
      accCache.set(n, a);
      return a;
    };

    // farms (created lazily)
    const farmIds = new Map<string, number>();
    const farmIdFor = async (fk: string): Promise<number> => {
      let id = farmIds.get(fk);
      if (id) return id;
      const display = farmNames.get(fk)!;
      const existing = await get<{ id: number }>('SELECT id FROM farms WHERE name=?', display);
      id = existing ? existing.id : (await run('INSERT INTO farms(name) VALUES(?)', display)).id;
      farmIds.set(fk, id);
      return id;
    };

    // --- 3. group rows into vouchers
    const groups: Group[] = [];
    let cur: Group | null = null;
    for (const r of rows) {
      const opening = norm(r.item) === 'OPENING' || /^OPENING BALANCE/.test(norm(r.description));
      const k = opening ? 'OPENING' : norm(r.description);
      let join = false;
      if (cur) {
        if (opening || cur.key === 'OPENING') join = opening && cur.key === 'OPENING';
        else if (cur.dr === 0 || cur.cr === 0) join = Math.abs(daysBetween(cur.rows[0].date!, r.date!)) <= 3; // one-sided so far: wait for the partner row
        else if (Math.abs(cur.dr - cur.cr) < 0.01) join = false; // balanced: voucher complete
        else join = cur.key === k || norm(cur.rows[cur.rows.length - 1].description) === k; // both sides but off (typo): keep only same-description rows
      }
      if (cur && join) { cur.rows.push(r); cur.dr += r.debit; cur.cr += r.credit; }
      else { cur = { key: k, rows: [r], dr: r.debit, cr: r.credit }; groups.push(cur); }
    }

    // --- 4. resolve lines + voucher-level classification
    interface V { date: string; desc: string; lines: Line[]; opening: boolean; rowNo: number; farmKeys: Set<string> }
    const vouchers: V[] = [];
    for (const g of groups) {
      const opening = g.key === 'OPENING';
      const lines: Line[] = [];
      const fks = new Set<string>();
      for (const r of g.rows) {
        const fkAcc = FARM_RE.test(norm(r.account)) ? resolveFarmKey(r.account) : null;
        const fkItem = resolveFarmKey(r.item);
        const isFarmAccount = !!fkAcc;
        const fk = fkAcc ?? fkItem;
        if (fk) fks.add(fk);
        const acct = isFarmAccount ? wip : (await resolveAccount(r.account)).id;
        lines.push({ acct, farm: fk ? await farmIdFor(fk) : null, debit: round2(r.debit), credit: round2(r.credit), row: r, isFarmAccount });
      }
      vouchers.push({ date: g.rows[0].date!, desc: g.rows[0].description.trim() || 'Imported entry', lines, opening, rowNo: g.rows[0].row, farmKeys: fks });
    }

    // Sales lines that don't name their farm (e.g. "DAMAGE" weight deductions): take it from the description ("… FROM <farm>")
    // or from the closest sale to the same trader.
    const traderOf = (v: V) => v.lines.find((l) => ![wip, salesId, cogsId, suspenseId, cashId].includes(l.acct))?.acct ?? 0;
    const knownSales = new Map<number, { date: string; farm: number }[]>();
    for (const v of vouchers) {
      const sl = v.lines.find((l) => l.acct === salesId && l.farm);
      if (sl) { const t = traderOf(v); if (!knownSales.has(t)) knownSales.set(t, []); knownSales.get(t)!.push({ date: v.date, farm: sl.farm! }); }
    }
    for (const v of vouchers) {
      if (!v.lines.some((l) => l.acct === salesId) || v.lines.some((l) => l.acct === salesId && l.farm)) continue;
      const tail = /\bFROM\b(.+)$/i.exec(v.desc)?.[1]?.trim();
      const fk = tail ? resolveFarmKey(/FARM/i.test(tail) ? tail : `${tail} FARM`) : null;
      let farm = fk ? await farmIdFor(fk) : null;
      if (!farm) {
        let best = 8, pick: number | null = null;
        for (const c of knownSales.get(traderOf(v)) ?? []) { const d = Math.abs(daysBetween(c.date, v.date)); if (d < best) { best = d; pick = c.farm; } }
        farm = pick;
      }
      if (farm) for (const l of v.lines) if (!l.farm) l.farm = farm;
    }

    const catOf = new Map<number, { category: string; subtype: string | null }>();
    const catInfo = async (id: number) => {
      let c = catOf.get(id);
      if (!c) { c = (await get<{ category: string; subtype: string | null }>('SELECT category,subtype FROM accounts WHERE id=?', id))!; catOf.set(id, c); }
      return c;
    };

    /** Work out what a Work-in-Progress line is, from who is on the other side of the voucher. */
    const wipCategory = async (v: V, l: Line): Promise<string> => {
      if (v.opening) return 'opening';
      const others = v.lines.filter((x) => x !== l && (l.debit > 0 ? x.credit > 0 : x.debit > 0));
      others.sort((a, b) => b.debit + b.credit - (a.debit + a.credit));
      const o = others[0];
      if (!o) return 'misc';
      if (o.acct === cogsId) return 'cogs';
      if (o.acct === wip) return l.debit > 0 ? 'feed' : 'feed_return';
      const c = await catInfo(o.acct);
      let base = 'misc';
      if (c.category === 'supplier') base = c.subtype === 'feed' ? 'feed' : c.subtype === 'chicks' ? 'chicks' : c.subtype === 'medicine' ? 'medicine' : 'misc';
      else if (c.category === 'farmer') base = 'integration';
      if (l.credit > 0 && base === 'feed') return 'feed_return';
      return base;
    };

    // --- 5. infer batches per farm from chick placements, then assign every line by date
    //     (the sheet is not in date order and COGS is posted in instalments, so rows can't be walked sequentially)
    const LEAD = 10; // feed/medicine can be delivered a few days before the chicks arrive
    const vcats = new Map<V, Map<Line, string>>();
    interface FL { l: Line; v: V; kind: 'sale' | 'wip' | 'cogs' | 'other'; cat: string | null; date: string }
    const byFarm = new Map<number, FL[]>();
    for (const v of vouchers) {
      const cats = new Map<Line, string>();
      for (const l of v.lines) if (l.acct === wip) cats.set(l, await wipCategory(v, l));
      vcats.set(v, cats);
      for (const l of v.lines) {
        if (!l.farm) continue;
        const kind = l.acct === salesId ? 'sale' : l.acct === wip ? 'wip' : l.acct === cogsId ? 'cogs' : 'other';
        if (!byFarm.has(l.farm)) byFarm.set(l.farm, []);
        byFarm.get(l.farm)!.push({ l, v, kind, cat: cats.get(l) ?? null, date: v.date });
      }
    }
    const batches: MemBatch[] = [];
    const batchOfLine = new Map<Line, MemBatch>();
    for (const [farm, fls] of byFarm) {
      fls.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : x.v.rowNo - y.v.rowNo));
      const clusters: { date: string; qty: number }[] = [];
      for (const c of fls.filter((x) => x.kind === 'wip' && x.cat === 'chicks' && x.l.debit > 0)) {
        const last = clusters[clusters.length - 1];
        if (last && daysBetween(last.date, c.date) <= 12) last.qty += c.l.row.qty ?? 0;
        else clusters.push({ date: c.date, qty: c.l.row.qty ?? 0 });
      }
      const mk = (placement: string | null, qty: number, carry: boolean): MemBatch => ({ farm, no: 0, placement, firstDate: fls[0].date, lastDate: fls[0].date, chicksDate: placement, chicksQty: qty, closed: false, closedDate: null, hasCogs: false, carry, saleDates: [], cogs: 0, cost: 0, integ: 0, lastSale: null });
      const mem: MemBatch[] = [];
      const needCarry = !clusters.length || fls.some((x) => x.date < addDays(clusters[0].date, -LEAD) || x.cat === 'opening');
      const carry = needCarry ? mk(null, 0, true) : null;
      if (carry) mem.push(carry);
      const placements = clusters.map((c) => mk(c.date, c.qty, false));
      mem.push(...placements);
      mem.forEach((b, i) => { b.no = i + 1; batches.push(b); });
      const pick = (date: string, lead: number): MemBatch => {
        let chosen: MemBatch = carry ?? placements[0];
        for (const b of placements) if (addDays(b.placement!, -lead) <= date) chosen = b;
        return chosen;
      };
      const pickSold = (date: string): MemBatch => {
        for (let i = placements.length - 1; i >= 0; i--) { const b = placements[i]; if (b.placement! <= date && b.saleDates.some((d) => d <= date)) return b; }
        return pick(date, 0);
      };
      for (const fl of fls) if (fl.kind === 'sale') { const b = pick(fl.date, 0); b.saleDates.push(fl.date); batchOfLine.set(fl.l, b); }
      for (const fl of fls) {
        if (fl.kind === 'sale') continue;
        let b: MemBatch | undefined;
        if (fl.cat === 'opening') b = carry ?? placements[0];
        else if (fl.kind === 'cogs' || (fl.kind === 'wip' && (fl.cat === 'integration' || fl.cat === 'cogs'))) b = pickSold(fl.date);
        else if (fl.kind === 'wip') b = pick(fl.date, LEAD);
        if (!b) { // supplier/cash/trader line tagged with this farm: follow its voucher's main line
          const sib = fls.find((o) => o.v === fl.v && o !== fl && batchOfLine.has(o.l));
          b = (sib && batchOfLine.get(sib.l)) || pick(fl.date, 0);
        }
        batchOfLine.set(fl.l, b);
      }
      for (const fl of fls) {
        const b = batchOfLine.get(fl.l);
        if (!b) continue;
        if (fl.date > b.lastDate) b.lastDate = fl.date;
        if (fl.kind === 'sale' && (!b.lastSale || fl.date > b.lastSale)) b.lastSale = fl.date;
        if (fl.kind === 'wip') {
          if (fl.cat === 'cogs') { b.cogs += fl.l.credit - fl.l.debit; b.hasCogs = true; if (!b.closedDate || fl.date > b.closedDate) b.closedDate = fl.date; }
          else { const amt = fl.l.debit - fl.l.credit; if (fl.cat === 'integration') b.integ += amt; else b.cost += amt; }
        }
      }
    }

    // --- 6. persist batches (older batches are closed; the farm's latest is running unless its cost has been cleared to COGS)
    const ref = today();
    const lastPerFarm = new Map<number, MemBatch>();
    for (const b of batches) lastPerFarm.set(b.farm, b);
    for (const b of batches) {
      const placement = b.placement ?? b.firstDate;
      const isLatest = lastPerFarm.get(b.farm) === b && !b.carry;
      const cleared = b.saleDates.length > 0 && b.cogs >= b.cost * 0.9;
      const stale = daysBetween(b.lastDate, ref) > 60;
      const closed = !isLatest || cleared || stale;
      b.closed = closed;
      const closedDate = closed ? (b.closedDate ?? b.lastSale ?? b.lastDate) : null;
      const note = b.carry ? 'Cost brought forward from before this system (opening balances) — placement date unknown' : closed && !cleared && !isLatest && !b.hasCogs ? 'Closed automatically on import (no cost clearing entry found)' : null;
      b.realId = (await run('INSERT INTO batches(farm_id,batch_no,placement_date,placed_qty,status,closed_date,notes,partial) VALUES(?,?,?,?,?,?,?,?)',
        b.farm, b.no, b.carry ? b.firstDate : placement, b.chicksQty > 0 ? Math.round(b.chicksQty) : null, closed ? 'closed' : 'running', closedDate, note, b.carry || b.chicksQty === 0 ? 1 : 0)).id;
    }

    // --- 7. post vouchers
    let adjusted = 0, suspenseNet = 0, voucherCount = 0, entryCount = 0, no = 0;
    const typeOf = async (entries: EntryInput[], v: V, cats: Map<Line, string>): Promise<string> => {
      if (v.opening) return 'opening';
      if (entries.some((e) => e.accountId === salesId)) return 'sale';
      if (entries.some((e) => e.accountId === cogsId)) return 'close';
      const wc = [...cats.values()];
      if (wc.includes('chicks')) return 'chicks';
      if (wc.includes('integration')) return 'integration';
      if (wc.includes('feed') || wc.includes('feed_return')) return 'feed';
      if (wc.includes('medicine')) return 'medicine';
      if (wc.length) return 'misc';
      const cats2 = await Promise.all(v.lines.map(async (l) => (await catInfo(l.acct)).category));
      const liquidDr = v.lines.some((l, i) => l.debit > 0 && ['cash', 'bank'].includes(cats2[i]));
      const liquidCr = v.lines.some((l, i) => l.credit > 0 && ['cash', 'bank'].includes(cats2[i]));
      if (liquidDr && liquidCr) return 'transfer';
      if (liquidDr) return 'receipt';
      if (liquidCr) return v.lines.some((l, i) => l.debit > 0 && cats2[i] === 'expense') ? 'expense' : 'payment';
      return 'journal';
    };

    for (const v of vouchers) {
      const cats = vcats.get(v)!;
      const vFarm = v.lines.find((l) => l.farm)?.farm ?? null;
      const entries: EntryInput[] = v.lines.map((l) => {
        const r = l.row;
        const isSales = l.acct === salesId;
        const text = (r.item2 || '').trim();
        let category: string | null = l.acct === wip ? (cats.get(l) ?? 'misc') : null;
        if (isSales) category = /WEAK/i.test(text) || /WEAK/i.test(r.description) ? 'weak' : /DAMAGE/i.test(text) || /^DAMAGE/i.test(r.description) ? 'damage' : 'live';
        if (l.acct === cogsId) category = 'cogs';
        const b = batchOfLine.get(l);
        return {
          accountId: l.acct, debit: l.debit, credit: l.credit,
          farmId: l.farm ?? (l.isFarmAccount ? null : vFarm), batchId: b?.realId ?? null,
          category, item: (text || r.item || '').slice(0, 60) || null, qty: r.qty, weight: r.weight, rate: r.price, narration: r.description.slice(0, 200),
        };
      });
      // entries that inherited vFarm but belong to another batch context
      if (vFarm) {
        const vb = v.lines.map((l) => batchOfLine.get(l)).find(Boolean);
        for (const e of entries) if (e.farmId === vFarm && !e.batchId && vb) e.batchId = vb.realId;
      }
      const dr = round2(entries.reduce((s, e) => s + (e.debit ?? 0), 0)), cr = round2(entries.reduce((s, e) => s + (e.credit ?? 0), 0));
      if (Math.abs(dr - cr) > 0.005) {
        adjusted++;
        const diff = round2(cr - dr); // >0 → needs extra debit
        suspenseNet += diff;
        entries.push(diff > 0 ? { accountId: suspenseId, debit: diff, narration: 'Import difference (debit ≠ credit in Excel)' } : { accountId: suspenseId, credit: -diff, narration: 'Import difference (debit ≠ credit in Excel)' });
        if (adjusted <= 8) warn(`Row ${v.rowNo}: "${v.desc}" did not balance in Excel (difference ₹${Math.abs(diff)}) — posted to Suspense`);
      }
      const type = await typeOf(entries, v, cats);
      let partyLine: (typeof v.lines)[number] | undefined;
      for (const l of v.lines) {
        if (![wip, salesId, cogsId, suspenseId, cashId].includes(l.acct) && !['bank', 'cash'].includes((await catInfo(l.acct)).category)) { partyLine = l; break; }
      }
      const vb = v.lines.map((l) => batchOfLine.get(l)).find(Boolean);
      no++;
      await postVoucher({
        type, date: v.date, description: v.desc.slice(0, 200), partyId: partyLine?.acct ?? null, farmId: vFarm, batchId: vb?.realId ?? null,
        source: 'import', userId: opts.userId, meta: { excelRow: v.rowNo }, entries,
      });
      voucherCount++; entryCount += entries.length;
    }

    // --- 8. link farms to their farmer account
    const farmers = await all<{ id: number; name: string }>(`SELECT id,name FROM accounts WHERE category='farmer'`);
    for (const f of await all<{ id: number; name: string }>('SELECT id,name FROM farms')) {
      const first = norm(f.name).split(' ')[0];
      const match = farmers.find((a) => lev(key(a.name.split(' ')[0]), key(first)) <= 2 && key(first).length > 3 && key(a.name.split(' ')[0]).length > 3);
      if (match) await run('UPDATE farms SET farmer_account_id=?, farmer_name=? WHERE id=?', match.id, match.name, f.id);
    }

    // The first synced voucher number follows the sheet; reset the bill-number counter to continue after the Excel bill book.
    void CATEGORY_TYPE; void addDays;
    const stats = (await get<{ a: string | null; b: string | null }>('SELECT MIN(date) a, MAX(date) b FROM vouchers'))!;
    return {
      rows: rows.length, vouchers: voucherCount, entries: entryCount, accounts: accountsCreated,
      farms: (await get<{ n: number }>('SELECT COUNT(*) n FROM farms'))!.n, batches: batches.length,
      runningBatches: (await get<{ n: number }>(`SELECT COUNT(*) n FROM batches WHERE status='running'`))!.n,
      adjustedVouchers: adjusted, suspenseNet: round2(suspenseNet), warnings, backup, firstDate: stats.a, lastDate: stats.b,
    };
  });
}
