/**
 * Reads the DAILY REPORT workbook: one tab per flock, with a day-by-day table under a "Date" header.
 * Only the figures people type are stored (deaths, sales, feed); everything the tabs calculate is recalculated
 * by services/flockMetrics.ts. Importing never touches the accounts.
 */
import { all, backupLocal, get, run, tx } from '../db.ts';
import { badRequest } from '../errors.ts';
import { daysBetween, today } from '../util.ts';
import { toIso } from './excel.ts';

export interface ParsedDay { date: string; mortality: number; sale_qty: number; sale_kg: number; feed_in: number; feed_used: number; avg_weight_g: number | null }
export interface ParsedFlock { name: string; hidden: boolean; placementDate: string; placedQty: number | null; grossQty: number; days: ParsedDay[] }
export interface DailyImportReport { flocks: number; created: number; updated: number; days: number; running: number; closed: number; asOf: string | null; skipped: string[]; backup: string | null }

const STALE_DAYS = 7;
const n0 = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export async function parseDailyWorkbook(buf: Buffer): Promise<{ flocks: ParsedFlock[]; skipped: string[] }> {
  const XLSX = await import('xlsx');
  let wb: import('xlsx').WorkBook;
  try { wb = XLSX.read(buf, { type: 'buffer', cellDates: false, cellFormula: true, cellHTML: false, cellStyles: false }); }
  catch { throw badRequest('Could not read that file. Please upload the .xlsx workbook.'); }
  if (!wb.SheetNames.some((n) => n.trim().toUpperCase() === 'DAILY REPORT')) throw badRequest(`This workbook has no "DAILY REPORT" sheet. Sheets found: ${wb.SheetNames.slice(0, 8).join(', ')}`);

  const flocks: ParsedFlock[] = [];
  const skipped: string[] = [];
  for (const sheetName of wb.SheetNames) {
    if (/^(DAILY )?REPORT$/i.test(sheetName.trim())) continue;
    const ws = wb.Sheets[sheetName];
    const cell = (col: string, row: number) => ws[`${col}${row}`] as { v?: unknown; f?: string } | undefined;
    const val = (col: string, row: number) => cell(col, row)?.v;
    let header = 0;
    for (let r = 1; r <= 10 && !header; r++) if (String(val('B', r) ?? '').trim().toUpperCase() === 'DATE') header = r;
    if (!header) { skipped.push(`${sheetName}: no day-by-day table`); continue; }

    // Two tab layouts: F4 is the chick count in both; the plain layout also has the billed count in D4.
    const grossQty = n0(val('F', header - 1));
    if (grossQty <= 0) { skipped.push(`${sheetName}: no placement quantity`); continue; }
    const billed = n0(val('D', header - 1));
    const days: ParsedDay[] = [];
    let placementDate: string | null = null;
    for (let r = header + 1; ; r++) {
      const date = toIso(val('B', r));
      if (!date) break;
      placementDate ??= date;
      const weighed = cell('Q', r);
      const d: ParsedDay = {
        date, mortality: n0(val('D', r)), sale_qty: n0(val('F', r)), sale_kg: n0(val('H', r)), feed_in: n0(val('I', r)), feed_used: n0(val('J', r)),
        avg_weight_g: !weighed?.f && n0(weighed?.v) > 0 ? n0(weighed?.v) : null, // on some tabs this column is a formula, not a weighing
      };
      if (d.mortality || d.sale_qty || d.sale_kg || d.feed_in || d.feed_used || d.avg_weight_g) days.push(d);
    }
    if (!placementDate) { skipped.push(`${sheetName}: no dates`); continue; }
    const hidden = !!wb.Workbook?.Sheets?.find((s) => s.name === sheetName)?.Hidden;
    flocks.push({ name: sheetName.trim().toUpperCase().replace(/\s+/g, ' '), hidden, placementDate, placedQty: billed > 0 ? billed : grossQty, grossQty, days });
  }
  if (!flocks.length) throw badRequest('No farm tabs with a day-by-day table were found in this workbook.');
  return { flocks, skipped };
}

/** Hidden tabs and tabs with nothing recent are finished flocks. A status changed in the app is kept on re-import. */
export function initialStatus(f: ParsedFlock, asOf: string | null, now: string): 'running' | 'closed' {
  if (f.hidden) return 'closed';
  const last = f.days.reduce<string>((m, d) => (d.date <= now && d.date > m ? d.date : m), f.placementDate);
  return asOf && daysBetween(last, asOf) > STALE_DAYS ? 'closed' : 'running';
}

export async function importDailyWorkbook(buf: Buffer): Promise<DailyImportReport> {
  const { flocks, skipped } = await parseDailyWorkbook(buf);
  const now = today();
  // Hidden tabs are old flocks, and an old tab with wrong dates must not decide what "latest" means.
  const asOf = flocks.filter((f) => !f.hidden).flatMap((f) => f.days).reduce<string | null>((m, d) => (d.date <= now && (!m || d.date > m) ? d.date : m), null);
  const backup = await backupLocal('before-daily-import');
  let created = 0, updated = 0, dayCount = 0;

  await tx(async () => {
    for (const f of flocks) {
      const existing = await get<{ id: number }>('SELECT id FROM flocks WHERE name=? AND placement_date=?', f.name, f.placementDate);
      let id: number;
      if (existing) {
        id = existing.id; updated++;
        await run('UPDATE flocks SET placed_qty=?, gross_qty=? WHERE id=?', f.placedQty, f.grossQty, id);
        await run(`DELETE FROM flock_days WHERE flock_id=? AND source='excel'`, id); // days entered in the app stay, unless the workbook has that date too
      } else {
        id = (await run(`INSERT INTO flocks(name,placement_date,placed_qty,gross_qty,status,source) VALUES(?,?,?,?,?,'excel')`, f.name, f.placementDate, f.placedQty, f.grossQty, initialStatus(f, asOf, now))).id;
        created++;
      }
      // One statement per batch of rows: thousands of single inserts are slow against the hosted database.
      for (let i = 0; i < f.days.length; i += 40) {
        const chunk = f.days.slice(i, i + 40);
        await run(`INSERT OR REPLACE INTO flock_days(flock_id,date,mortality,sale_qty,sale_kg,feed_in,feed_used,avg_weight_g,source) VALUES ${chunk.map(() => `(?,?,?,?,?,?,?,?,'excel')`).join(',')}`,
          ...chunk.flatMap((d) => [id, d.date, d.mortality, d.sale_qty, d.sale_kg, d.feed_in, d.feed_used, d.avg_weight_g]));
      }
      dayCount += f.days.length;
    }
  });
  const counts = await all<{ status: string; n: number }>('SELECT status, COUNT(*) n FROM flocks GROUP BY status');
  return {
    flocks: flocks.length, created, updated, days: dayCount, asOf, skipped, backup,
    running: counts.find((c) => c.status === 'running')?.n ?? 0, closed: counts.find((c) => c.status === 'closed')?.n ?? 0,
  };
}
