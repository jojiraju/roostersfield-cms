import { all, get, getSetting, run, tx } from '../db.ts';
import { notFound } from '../errors.ts';
import { addDays, daysBetween, round2, today } from '../util.ts';

export interface DailyInput { mortality?: number | null; saleQty?: number | null; saleWeight?: number | null; feedIn?: number | null; feedUsed?: number | null; note?: string | null }
interface Log { batch_id: number; date: string; mortality: number | null; sale_qty: number | null; sale_weight: number | null; feed_in: number | null; feed_used: number | null; note: string | null }
interface Std { day: number; feed_g: number | null; weight_g: number | null; fcr: number | null }

const n0 = (v: number | null | undefined) => v ?? 0;

export const stdChart = async (): Promise<Std[]> => all<Std>('SELECT day,feed_g,weight_g,fcr FROM std_chart ORDER BY day');

/** Walks a batch's logs in date order and works out the running figures a farm manager looks at. */
/** Feed bag weight and the % of free birds the hatchery adds on top of the chicks billed — both come from Settings. */
async function basis() {
  return { bagKg: Number(await getSetting('feed_bag_kg', '50')) || 50, extra: Number(await getSetting('chick_extra_pct', '2')) || 0 };
}
const received = (placed: number | null, extra: number) => (placed ? Math.round(placed * (1 + extra / 100)) : 0);

function walk(placed: number, placement: string, logs: Log[], std: Map<number, Std>, upTo: string, BAG_KG: number) {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const rows: any[] = [];
  let cumMort = 0, cumSold = 0, cumIn = 0, cumUsed = 0, cumReq = 0, soldKg = 0;
  for (let d = placement; d <= upTo; d = addDays(d, 1)) {
    const l = byDate.get(d);
    const day = daysBetween(placement, d);
    cumMort += n0(l?.mortality); cumSold += n0(l?.sale_qty); soldKg += n0(l?.sale_weight);
    cumIn += n0(l?.feed_in); cumUsed += n0(l?.feed_used);
    const alive = placed ? Math.max(0, placed - cumMort - cumSold) : null;
    const s = std.get(day);
    const reqKg = s?.feed_g != null && alive !== null ? (s.feed_g * alive) / 1000 : null;
    if (reqKg !== null) cumReq += reqKg / BAG_KG;
    rows.push({
      date: d, day, hasLog: !!l,
      mortality: l?.mortality ?? null, saleQty: l?.sale_qty ?? null, saleWeight: l?.sale_weight ?? null, feedIn: l?.feed_in ?? null, feedUsed: l?.feed_used ?? null, note: l?.note ?? null,
      cumMortality: cumMort, mortalityPct: placed ? round2((cumMort / placed) * 100) : null, cumSold, alive,
      stock: round2(cumIn - cumUsed), cumFeedUsed: round2(cumUsed),
      stdFeedBags: reqKg !== null ? round2(reqKg / BAG_KG) : null, cumStdFeedBags: reqKg !== null ? round2(cumReq) : null,
      feedDiff: reqKg !== null && l?.feed_used != null ? round2(l.feed_used - reqKg / BAG_KG) : null,
      stdWeight: s?.weight_g ?? null, avgSoldWeight: l?.sale_qty && l?.sale_weight ? round2(l.sale_weight / l.sale_qty) : null,
    });
  }
  return { rows, cumMort, cumSold, cumIn, cumUsed, soldKg };
}

export async function batchDaily(batchId: number) {
  const b = await get<any>(`SELECT b.id,b.batch_no,b.placement_date,b.placed_qty,b.status,b.closed_date,f.id farm_id,f.name farm_name FROM batches b JOIN farms f ON f.id=b.farm_id WHERE b.id=?`, batchId);
  if (!b) throw notFound('Batch not found');
  const logs = await all<Log>('SELECT * FROM daily_logs WHERE batch_id=? ORDER BY date', batchId);
  const std = new Map((await stdChart()).map((s) => [s.day, s]));
  const placement: string | null = b.placement_date ?? logs[0]?.date ?? null;
  let rows: any[] = [], totals: any = null;
  if (placement) {
    const lastLog = logs.length ? logs[logs.length - 1].date : placement;
    const end = b.status === 'closed' ? (b.closed_date && b.closed_date > lastLog ? b.closed_date : lastLog) : (today() > lastLog ? today() : lastLog);
    const { bagKg, extra } = await basis();
    const base = received(b.placed_qty, extra);
    const w = walk(base, placement, logs, std, end < placement ? placement : end, bagKg);
    rows = w.rows;
    totals = { mortality: w.cumMort, mortalityPct: base ? round2((w.cumMort / base) * 100) : null, received: base || null, sold: w.cumSold, soldKg: round2(w.soldKg), feedIn: round2(w.cumIn), feedUsed: round2(w.cumUsed), stock: round2(w.cumIn - w.cumUsed), alive: base ? Math.max(0, base - w.cumMort - w.cumSold) : null };
  }
  return { batch: b, rows, totals, hasStd: std.size > 0 };
}

/** One line per running batch (plus any batch that has a report on that day) as of a date — the "daily report" screen. */
export async function dailyOverview(date: string) {
  const batches = await all<any>(
    `SELECT b.id,b.batch_no,b.placement_date,b.placed_qty,b.status,f.name farm_name,f.farmer_name
       FROM batches b JOIN farms f ON f.id=b.farm_id
      WHERE b.placement_date IS NOT NULL AND b.placement_date<=? AND (b.status='running' OR EXISTS (SELECT 1 FROM daily_logs d WHERE d.batch_id=b.id AND d.date=?))
        AND COALESCE(b.partial,0)=0
      ORDER BY f.name, b.batch_no`, date, date);
  if (!batches.length) return { date, rows: [] };
  const ids = batches.map((b) => b.id);
  const logs = await all<Log>(`SELECT * FROM daily_logs WHERE batch_id IN (${ids.map(() => '?').join(',')}) AND date<=? ORDER BY date`, ...ids, date);
  const std = new Map((await stdChart()).map((s) => [s.day, s]));
  const { bagKg, extra } = await basis();
  const per = new Map<number, Log[]>();
  for (const l of logs) { if (!per.has(l.batch_id)) per.set(l.batch_id, []); per.get(l.batch_id)!.push(l); }
  const rows = batches.map((b) => {
    const mine = per.get(b.id) ?? [];
    const w = walk(received(b.placed_qty, extra), b.placement_date, mine, std, date, bagKg);
    const t = w.rows[w.rows.length - 1];
    const lastReport = mine.length ? mine[mine.length - 1].date : null;
    return {
      batchId: b.id, farm: b.farm_name, farmer: b.farmer_name, batchNo: b.batch_no, placementDate: b.placement_date, placed: b.placed_qty, received: received(b.placed_qty, extra) || null, status: b.status,
      age: t.day, alive: t.alive, cumMortality: t.cumMortality, mortalityPct: t.mortalityPct, stock: t.stock, cumFeedUsed: t.cumFeedUsed, cumStdFeedBags: t.cumStdFeedBags,
      feedGap: t.cumStdFeedBags !== null ? round2(t.cumFeedUsed - t.cumStdFeedBags) : null, stdWeight: t.stdWeight,
      today: t.hasLog ? { mortality: t.mortality, saleQty: t.saleQty, saleWeight: t.saleWeight, feedIn: t.feedIn, feedUsed: t.feedUsed, note: t.note } : null,
      lastReport, daysSince: lastReport ? daysBetween(lastReport, date) : null,
    };
  });
  return { date, rows };
}

const clean = (v: number | null | undefined) => (v === undefined || v === null || Number.isNaN(v) ? null : v);
export async function saveDaily(batchId: number, date: string, d: DailyInput, userId: number | null, source = 'app') {
  const b = await get('SELECT 1 FROM batches WHERE id=?', batchId);
  if (!b) throw notFound('Batch not found');
  const v = { m: clean(d.mortality), sq: clean(d.saleQty), sw: clean(d.saleWeight), fi: clean(d.feedIn), fu: clean(d.feedUsed), note: d.note?.trim() || null };
  if (v.m === null && v.sq === null && v.sw === null && v.fi === null && v.fu === null && !v.note) {
    await run('DELETE FROM daily_logs WHERE batch_id=? AND date=?', batchId, date);
    return;
  }
  await run(
    `INSERT INTO daily_logs(batch_id,date,mortality,sale_qty,sale_weight,feed_in,feed_used,note,source,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,datetime('now'))
     ON CONFLICT(batch_id,date) DO UPDATE SET mortality=excluded.mortality, sale_qty=excluded.sale_qty, sale_weight=excluded.sale_weight, feed_in=excluded.feed_in, feed_used=excluded.feed_used,
       note=excluded.note, source=excluded.source, updated_by=excluded.updated_by, updated_at=datetime('now')`,
    batchId, date, v.m, v.sq, v.sw, v.fi, v.fu, v.note, source, userId);
}

export async function saveDailyBulk(date: string, items: Array<DailyInput & { batchId: number }>, userId: number | null) {
  await tx(async () => { for (const it of items) await saveDaily(it.batchId, date, it, userId); });
}
