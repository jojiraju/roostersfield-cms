import { all, get, getSetting, run } from '../db.ts';
import { badRequest, notFound } from '../errors.ts';
import { round2, today } from '../util.ts';
import { listBatches } from './batches.ts';
import { feedChart, flockIssues, flockMetrics } from './flockMetrics.ts';
import type { FlockDay } from './flockMetrics.ts';

interface FlockRow { id: number; name: string; placement_date: string; placed_qty: number | null; gross_qty: number; status: 'running' | 'closed'; source: string; notes: string | null }
type DayRow = FlockDay & { flock_id: number; source: string };
type BatchList = Awaited<ReturnType<typeof listBatches>>;

const key = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Workbook tab name → farm name in the accounts, where the two are spelt differently. */
const FARM_ALIASES: Record<string, string> = {
  ANANDFARM: 'ANANAD FARM', JITHUKOTTAMALA: 'JITHU KOTAMALA FARM', LALUKOTTMALA2: 'LALU KOTTAMALA FARM 2', LALUKOTTAMALA2: 'LALU KOTTAMALA FARM 2',
  LALUKOTTAMALA3: 'LALU KOTTAMALA FARM 3', MATHAIKAIPPINI: 'MATHAI FARM', MADHUCHUNGATHARA: 'MADHU FARM', USMANCHUNGATHARA: 'USMAN FARM',
  RAFEEKPALEMAD: 'RAFEEK FARM', NAVAJITH: 'NAVJITH FARM',
};
export function farmNameFor(flockName: string, farms: string[]): string | null {
  const k = key(flockName);
  const byKey = (x: string) => farms.find((f) => key(f) === x) ?? null;
  return byKey(k) ?? byKey(`${k}FARM`) ?? (FARM_ALIASES[k] ? byKey(key(FARM_ALIASES[k])) : null);
}

/** The accounts' batch for this flock: same farm, placed within ten days. */
function ledgerBatch(f: FlockRow, batches: BatchList, farms: string[]) {
  const farm = farmNameFor(f.name, farms);
  if (!farm) return { farm: null, batch: null };
  const t = Date.parse(f.placement_date);
  let best: BatchList[number] | null = null, gap = 11;
  for (const b of batches) {
    if (b.farm_name !== farm || !b.placement_date) continue;
    const d = Math.abs(Date.parse(b.placement_date) - t) / 86400000;
    if (d < gap) { gap = d; best = b; }
  }
  return { farm, batch: best };
}

type LedgerTotals = Map<number, { birds: number; kg: number; bags: number }>;

/**
 * Birds, kg and feed bags per batch in the accounts, up to the cutoff.
 * Bills entered in the app after the last import are left out, so both sides of the comparison cover the same days.
 */
async function ledgerTotals(through: string | null): Promise<LedgerTotals> {
  const upTo = through ? 'AND e.date <= ?' : '';
  const args = through ? [through] : [];
  const out: LedgerTotals = new Map();
  const at = (id: number) => { let t = out.get(id); if (!t) { t = { birds: 0, kg: 0, bags: 0 }; out.set(id, t); } return t; };
  const sales = await all<{ batch_id: number; birds: number; kg: number }>(
    `SELECT e.batch_id,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) birds,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.weight,0) ELSE -COALESCE(e.weight,0) END) kg
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='sales'
      WHERE e.batch_id IS NOT NULL ${upTo} GROUP BY e.batch_id`, ...args);
  for (const r of sales) { const t = at(r.batch_id); t.birds = r.birds; t.kg = round2(r.kg); }
  const feed = await all<{ batch_id: number; bags: number }>(
    `SELECT e.batch_id, SUM(CASE WHEN e.debit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) bags
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip'
      WHERE e.batch_id IS NOT NULL AND e.category IN ('feed','feed_return') ${upTo} GROUP BY e.batch_id`, ...args);
  for (const r of feed) at(r.batch_id).bags = round2(r.bags);
  return out;
}

/** Compares the daily sheet with the accounts, counting only the days the accounts have reached on both sides. */
function ledgerCheck(f: FlockRow, days: FlockDay[], batches: BatchList, totals: LedgerTotals, farms: string[], through: string | null) {
  const { farm, batch } = ledgerBatch(f, batches, farms);
  const upTo = days.filter((d) => !through || d.date <= through);
  const daily = { birds: upTo.reduce((s, d) => s + d.sale_qty, 0), kg: upTo.reduce((s, d) => s + d.sale_kg, 0), bags: upTo.reduce((s, d) => s + d.feed_in, 0) };
  if (!batch) {
    // Placed after the accounts stop: there can't be a batch yet, so this isn't a difference.
    const tooNew = !!farm && !!through && f.placement_date > through;
    return { farm, batchId: null, batchNo: null, batchStatus: null, placed: null, daily, ledger: null, differs: tooNew ? [] : [farm ? 'No batch in the accounts for this placement' : 'No farm in the accounts with this name'] };
  }
  const ledger = totals.get(batch.id) ?? { birds: 0, kg: 0, bags: 0 };
  const differs: string[] = [];
  if (f.placed_qty !== null && batch.placed_qty !== null && Math.abs(f.placed_qty - batch.placed_qty) >= 1) differs.push('placed');
  if (batch.placed_qty === null) differs.push('placed');
  if (Math.abs(daily.birds - ledger.birds) >= 1) differs.push('birds sold');
  if (Math.abs(daily.kg - ledger.kg) >= 1) differs.push('kg sold');
  if (Math.abs(daily.bags - ledger.bags) >= 0.5) differs.push('feed bags');
  return { farm, batchId: batch.id, batchNo: batch.batch_no, batchStatus: batch.status, placed: batch.placed_qty, daily, ledger, differs };
}

const bagSize = async () => Number(await getSetting('feed_bag_kg', '50')) || 50;
/** The last date the imported accounts run to. Both sides of the check stop here until the next accounts import moves it on. */
const ledgerThrough = async () => (await get<{ d: string | null }>(`SELECT MAX(date) d FROM vouchers WHERE source='import'`))?.d ?? null;
const farmNames = async () => (await all<{ name: string }>('SELECT name FROM farms')).map((f) => f.name);
const flockDays = (id: number) => all<DayRow>('SELECT * FROM flock_days WHERE flock_id=? ORDER BY date', id);

export async function dailyReport(requestedDate?: string) {
  const now = today();
  const flocks = await all<FlockRow>('SELECT * FROM flocks ORDER BY placement_date, name');
  const rows = await all<DayRow>('SELECT * FROM flock_days ORDER BY date');
  const byFlock = new Map<number, DayRow[]>();
  for (const r of rows) { const l = byFlock.get(r.flock_id); if (l) l.push(r); else byFlock.set(r.flock_id, [r]); }
  // Until today's figures are in, show the last day anything was entered on, not a page of zeros.
  const running = new Set(flocks.filter((f) => f.status === 'running').map((f) => f.id));
  const latest = rows.reduce<string | null>((m, r) => (running.has(r.flock_id) && r.date <= now && (!m || r.date > m) ? r.date : m), null);
  const asOf = requestedDate ?? latest ?? now;
  const [bagKg, through, batches, farms] = await Promise.all([bagSize(), ledgerThrough(), listBatches(), farmNames()]);
  const totals = await ledgerTotals(through);
  return {
    asOf, today: now, ledgerThrough: through, bagKg,
    flocks: flocks.map((f) => {
      const days = byFlock.get(f.id) ?? [];
      return { ...f, ...flockMetrics(f, days, asOf, bagKg), enteredOnDay: days.some((d) => d.date === asOf), issues: flockIssues(f, days, now), check: ledgerCheck(f, days, batches, totals, farms, through) };
    }),
  };
}

export async function flockDetail(id: number) {
  const f = await get<FlockRow>('SELECT * FROM flocks WHERE id=?', id);
  if (!f) throw notFound('Flock not found');
  const now = today();
  const days = await flockDays(id);
  const [bagKg, through, batches, farms] = await Promise.all([bagSize(), ledgerThrough(), listBatches(), farmNames()]);
  const chart = feedChart(f.placement_date, f.gross_qty, days, bagKg);
  return { ...f, ...flockMetrics(f, days, now, bagKg), issues: flockIssues(f, days, now), check: ledgerCheck(f, days, batches, await ledgerTotals(through), farms, through), days, chart };
}

export async function createFlock(d: { name: string; placementDate: string; placedQty: number; grossQty: number; notes?: string | null }) {
  if (await get('SELECT 1 FROM flocks WHERE name=? AND placement_date=?', d.name, d.placementDate)) throw badRequest(`${d.name} already has a flock placed on that date`);
  return { id: (await run(`INSERT INTO flocks(name,placement_date,placed_qty,gross_qty,source,notes) VALUES(?,?,?,?,'app',?)`, d.name, d.placementDate, d.placedQty, d.grossQty, d.notes ?? null)).id };
}

export async function updateFlock(id: number, d: { status?: 'running' | 'closed'; placementDate?: string; placedQty?: number; grossQty?: number; notes?: string | null }) {
  if (!await get('SELECT 1 FROM flocks WHERE id=?', id)) throw notFound('Flock not found');
  await run('UPDATE flocks SET status=COALESCE(?,status), placement_date=COALESCE(?,placement_date), placed_qty=COALESCE(?,placed_qty), gross_qty=COALESCE(?,gross_qty), notes=COALESCE(?,notes) WHERE id=?',
    d.status, d.placementDate, d.placedQty, d.grossQty, d.notes, id);
}

export async function saveDay(id: number, date: string, d: { mortality: number; saleQty: number; saleKg: number; feedIn: number; feedUsed: number; avgWeightG: number | null }) {
  const f = await get<FlockRow>('SELECT * FROM flocks WHERE id=?', id);
  if (!f) throw notFound('Flock not found');
  // Clearing comes first so a wrongly dated entry from the workbook can always be removed.
  const empty = !d.mortality && !d.saleQty && !d.saleKg && !d.feedIn && !d.feedUsed && !d.avgWeightG;
  if (empty) { await run('DELETE FROM flock_days WHERE flock_id=? AND date=?', id, date); return; }
  if (date < f.placement_date) throw badRequest('That date is before this flock was placed');
  if (date > today()) throw badRequest('That date is in the future');
  await run(`INSERT INTO flock_days(flock_id,date,mortality,sale_qty,sale_kg,feed_in,feed_used,avg_weight_g,source) VALUES(?,?,?,?,?,?,?,?,'app')
             ON CONFLICT(flock_id,date) DO UPDATE SET mortality=excluded.mortality, sale_qty=excluded.sale_qty, sale_kg=excluded.sale_kg, feed_in=excluded.feed_in, feed_used=excluded.feed_used, avg_weight_g=excluded.avg_weight_g, source='app'`,
    id, date, d.mortality, d.saleQty, d.saleKg, d.feedIn, d.feedUsed, d.avgWeightG);
}
