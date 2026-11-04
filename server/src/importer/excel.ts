import { badRequest } from '../errors.ts';
import { importJournal } from './core.ts';
import type { ImportReport, JournalRow } from './core.ts';
import { num } from '../util.ts';

const pad = (n: number) => String(n).padStart(2, '0');

function toIso(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') {
    if (v < 20000 || v > 80000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v + 1e-6) * 86400000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  if (v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v).trim());
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const dm = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(String(v).trim());
  return dm ? `${dm[3]}-${pad(Number(dm[2]))}-${pad(Number(dm[1]))}` : null;
}
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const numOrNull = (v: unknown) => (v === null || v === undefined || String(v).trim() === '' ? null : num(v));

export async function parseWorkbook(buf: Buffer): Promise<{ rows: JournalRow[]; tb: Record<string, string> }> {
  const XLSX = await import('xlsx'); // loaded on demand so the API runs even before this package is installed
  let wb: import('xlsx').WorkBook;
  try { wb = XLSX.read(buf, { type: 'buffer', cellDates: false, cellFormula: false, cellHTML: false, cellStyles: false }); }
  catch { throw badRequest('Could not read that file. Please upload the .xlsx workbook.'); }
  const sheetName = wb.SheetNames.find((n) => n.trim().toUpperCase() === 'JOURNALS');
  if (!sheetName) throw badRequest(`This workbook has no "JOURNALS" sheet. Sheets found: ${wb.SheetNames.join(', ')}`);

  // JOURNALS: header on row 4 (DATE, DESCRIPTION, ACCOUNT, ITEM, ITEM2, QTY, WEIGHT, PRICE, …, DEBIT, CREDIT)
  const data = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, range: 3, raw: true, defval: null });
  const header = (data[0] ?? []).map((c) => str(c).toUpperCase());
  if (!header.includes('DEBIT') || !header.includes('ACCOUNT')) throw badRequest('The JOURNALS sheet does not have the expected columns (DATE, DESCRIPTION, ACCOUNT … DEBIT, CREDIT).');
  const col = (name: string, fallback: number) => { const i = header.indexOf(name); return i >= 0 ? i : fallback; };
  const c = { date: col('DATE', 0), desc: col('DESCRIPTION', 1), acc: col('ACCOUNT', 2), item: col('ITEM', 3), item2: col('ITEM2', 4), qty: col('QOUNTITY', 5), wt: col('WEIGT', 6), price: col('PRICE', 7), dr: col('DEBIT', 10), cr: col('CREDIT', 11) };
  const rows: JournalRow[] = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i] as unknown[];
    if (!r || r.every((x) => x === null || x === '')) continue;
    rows.push({
      row: i + 4, date: toIso(r[c.date]), description: str(r[c.desc]), account: str(r[c.acc]), item: str(r[c.item]), item2: str(r[c.item2]),
      qty: numOrNull(r[c.qty]), weight: numOrNull(r[c.wt]), price: numOrNull(r[c.price]), debit: num(r[c.dr]), credit: num(r[c.cr]),
    });
  }

  // TRAIL BALANCE: account → statement classification (used to type unknown accounts)
  const tb: Record<string, string> = {};
  const tbName = wb.SheetNames.find((n) => n.trim().toUpperCase() === 'TRAIL BALANCE' || n.trim().toUpperCase() === 'TRIAL BALANCE');
  if (tbName) {
    const t = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[tbName], { header: 1, raw: true, defval: null });
    for (const r of t) { const name = str(r[1]).toUpperCase().replace(/\s+/g, ' '); const cls = str(r[10]); if (name && cls && name !== 'ACCOUNT') tb[name] = cls; }
  }
  return { rows, tb };
}

export async function importWorkbook(buf: Buffer, opts: { replace: boolean; userId: number | null }): Promise<ImportReport> {
  const { rows, tb } = await parseWorkbook(buf);
  if (!rows.length) throw badRequest('No journal rows were found in the JOURNALS sheet.');
  return await importJournal(rows, tb, opts);
}
