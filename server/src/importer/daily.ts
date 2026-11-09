/**
 * Daily Report workbook → daily_logs.
 * Each farm sheet is one flock: a header block, then one row per day (Date, Mortality, Sale Qty, Sale Weight, Purchase = feed bags in,
 * "Taiken" = feed bags used). Everything else in the sheet is a formula, so only those inputs are read.
 * A sheet is attached to the batch placed within 4 days of its first date on a farm with a similar name; sheets that match nothing are listed, not guessed.
 */
import { all, get, run, tx } from '../db.ts';
import { badRequest } from '../errors.ts';
import { today } from '../util.ts';

export interface DailySheet { name: string; firstDate: string; rows: Array<{ date: string; mortality: number | null; saleQty: number | null; saleWeight: number | null; feedIn: number | null; feedUsed: number | null }>; std: Array<[number, number, number, number]> }
export interface DailyImportReport {
  sheets: number; matched: Array<{ sheet: string; farm: string; batchNo: number; placement: string; days: number }>; unmatched: Array<{ sheet: string; firstDate: string; reason: string }>;
  daysImported: number; daysSkippedFuture: number; keptEdited: number; standardChart: boolean; warnings: string[];
}

const pad = (n: number) => String(n).padStart(2, '0');
function toIso(v: unknown): string | null {
  if (typeof v === 'number') {
    if (v < 20000 || v > 80000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v + 1e-6) * 86400000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  if (v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v ?? '').trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
const numOrNull = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v ?? '').trim();
  if (!s || s.startsWith('#')) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
const text = (v: unknown) => String(v ?? '').trim().toUpperCase().replace(/\s+/g, ' ');

export async function parseDailyWorkbook(buf: Buffer): Promise<DailySheet[]> {
  const XLSX = await import('xlsx');
  let wb: import('xlsx').WorkBook;
  try { wb = XLSX.read(buf, { type: 'buffer', cellDates: false, cellFormula: false, cellHTML: false, cellStyles: false }); }
  catch { throw badRequest('Could not read that file. Please upload the Daily Report .xlsx workbook.'); }
  const out: DailySheet[] = [];
  for (const name of wb.SheetNames) {
    const data = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: null });
    let h = -1, off = 0; // off = how far the sheet's columns are shifted from the usual layout (Date in column B)
    for (let i = 0; i < Math.min(12, data.length); i++) {
      const cells = ((data[i] as unknown[]) ?? []).map(text);
      const di = cells.indexOf('DATE'), mi = cells.findIndex((x) => x.startsWith('MORTALITY'));
      if (di >= 0 && mi > di) { h = i; off = di - 1; break; }
    }
    if (h < 0) continue; // DAILY REPORT / REPORT summary sheets
    const head = (data[h] as unknown[]).map(text);
    const col = (re: RegExp, fb: number) => { const i = head.findIndex((x) => re.test(x)); return i >= 0 ? i : fb; };
    const c = { date: 1 + off, mort: col(/^MORTALITY/, 3 + off), saleQty: col(/^SALE QTY/, 5 + off), saleWt: col(/^SALE W/, 7 + off), purchase: col(/^PURCHASE/, 8 + off), taken: col(/^TAIKEN|^TAKEN|^USED/, 9 + off), stdFeed: col(/^STD G/, 12 + off), stdWt: col(/^STD W/, 17 + off), stdFcr: col(/^STD FCR/, 18 + off) };
    const rows: DailySheet['rows'] = []; const std: DailySheet['std'] = [];
    let day = 0;
    for (let i = h + 1; i < data.length; i++) {
      const r = data[i] as unknown[];
      const date = toIso(r?.[c.date]);
      if (!date) continue;
      rows.push({ date, mortality: numOrNull(r[c.mort]), saleQty: numOrNull(r[c.saleQty]), saleWeight: numOrNull(r[c.saleWt]), feedIn: numOrNull(r[c.purchase]), feedUsed: numOrNull(r[c.taken]) });
      const f = numOrNull(r[c.stdFeed]), w = numOrNull(r[c.stdWt]), q = numOrNull(r[c.stdFcr]);
      if (f !== null && w !== null && q !== null) std.push([day, f, w, q]);
      day++;
    }
    if (rows.length) out.push({ name, firstDate: rows[0].date, rows, std });
  }
  if (!out.length) throw badRequest('No farm sheets were found. Each farm sheet needs a header row with "Date" and "Mortality".');
  return out;
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const words = (s: string) => text(s).replace(/[^A-Z0-9 ]/g, '').split(' ').filter((w) => w && w !== 'FARM');
const tail = (s: string) => { const w = text(s).split(' '); return /^\d+$/.test(w[w.length - 1]) ? w[w.length - 1] : '1'; };
const gap = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 86400000;

export async function importDailySheets(sheets: DailySheet[], opts: { userId: number | null }): Promise<DailyImportReport> {
  const warnings: string[] = [];
  const batches = await all<{ id: number; batch_no: number; placement_date: string; farm: string }>(
    `SELECT b.id,b.batch_no,b.placement_date,f.name farm FROM batches b JOIN farms f ON f.id=b.farm_id WHERE b.placement_date IS NOT NULL AND COALESCE(b.partial,0)=0`);
  const now = today();
  const rep: DailyImportReport = { sheets: sheets.length, matched: [], unmatched: [], daysImported: 0, daysSkippedFuture: 0, keptEdited: 0, standardChart: false, warnings };

  await tx(async () => {
    for (const sh of sheets) {
      const w0 = words(sh.name)[0] ?? '';
      const cands = batches
        .map((b) => ({ b, g: gap(b.placement_date, sh.firstDate), d: lev(w0, words(b.farm)[0] ?? ''), full: lev(words(sh.name).join(''), words(b.farm).join('')), t: tail(sh.name) === tail(b.farm) ? 0 : 1 }))
        .filter((x) => x.g <= 4 && x.d <= 2)
        .sort((a, z) => a.t - z.t || a.full - z.full || a.g - z.g);
      if (!cands.length) { rep.unmatched.push({ sheet: sh.name, firstDate: sh.firstDate, reason: 'No batch for this farm was placed around that date in the accounts' }); continue; }
      const b = cands[0].b;
      let days = 0;
      for (const r of sh.rows) {
        // the sheets carry formula leftovers (negative stock figures) on empty future days — not real reports
        for (const k of ['mortality', 'saleQty', 'saleWeight', 'feedIn', 'feedUsed'] as const) if (r[k] !== null && r[k]! < 0) r[k] = null;
        if (r.mortality === null && r.saleQty === null && r.saleWeight === null && r.feedIn === null && r.feedUsed === null) continue;
        if (r.date > now) { rep.daysSkippedFuture++; continue; }
        const res = await run(
          `INSERT INTO daily_logs(batch_id,date,mortality,sale_qty,sale_weight,feed_in,feed_used,source,updated_by) VALUES(?,?,?,?,?,?,?,'import',?)
           ON CONFLICT(batch_id,date) DO UPDATE SET mortality=excluded.mortality, sale_qty=excluded.sale_qty, sale_weight=excluded.sale_weight, feed_in=excluded.feed_in, feed_used=excluded.feed_used, updated_by=excluded.updated_by, updated_at=datetime('now')
           WHERE daily_logs.source='import'`, b.id, r.date, r.mortality, r.saleQty, r.saleWeight, r.feedIn, r.feedUsed, opts.userId);
        if (res.changes) { days++; rep.daysImported++; } else rep.keptEdited++;
      }
      rep.matched.push({ sheet: sh.name, farm: b.farm, batchNo: b.batch_no, placement: b.placement_date, days });
    }
    // standard chart: take the first sheet that carries one
    const std = sheets.find((s) => s.std.length >= 30)?.std;
    if (std && ((await get<{ n: number }>('SELECT COUNT(*) n FROM std_chart'))?.n ?? 0) < 1) {
      for (const [day, f, w, q] of std) await run('INSERT OR REPLACE INTO std_chart(day,feed_g,weight_g,fcr) VALUES(?,?,?,?)', day, f, w, q);
      rep.standardChart = true;
    }
  });
  if (rep.daysSkippedFuture) warnings.push(`${rep.daysSkippedFuture} rows dated after today were left out (the sheets are pre-filled with dates up to 52 days ahead).`);
  return rep;
}

export async function importDailyWorkbook(buf: Buffer, opts: { userId: number | null }) {
  return importDailySheets(await parseDailyWorkbook(buf), opts);
}
