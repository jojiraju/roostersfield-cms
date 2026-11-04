import { addDays, daysBetween } from '../util.ts';

/**
 * Standard grow-out chart: [feed g/bird/day, body weight g, FCR] for day 0–41.
 * Copied from the farm tabs of the DAILY REPORT workbook, where it is identical on every tab.
 */
export const STANDARD: ReadonlyArray<readonly [number, number, number]> = [
  [14, 57, 0.25], [17, 74, 0.42], [21, 94, 0.55], [25, 118, 0.65], [29, 143, 0.74], [34, 175, 0.8], [40, 205, 0.88],
  [45, 237, 0.95], [49, 274, 1], [53, 319, 1.03], [58, 363, 1.06], [63, 418, 1.07], [68, 463, 1.11], [74, 520, 1.13],
  [81, 585, 1.15], [86, 640, 1.18], [92, 710, 1.2], [97, 782, 1.21], [102, 857, 1.22], [108, 932, 1.24], [114, 1010, 1.26],
  [117, 1082, 1.28], [121, 1148, 1.31], [124, 1221, 1.34], [127, 1297, 1.36], [130, 1376, 1.37], [133, 1456, 1.39],
  [136, 1540, 1.4], [141, 1615, 1.42], [144, 1698, 1.44], [149, 1782, 1.45], [153, 1867, 1.47], [157, 1950, 1.49],
  [161, 2035, 1.51], [165, 2120, 1.52], [168, 2194, 1.55], [171, 2276, 1.57], [174, 2359, 1.59], [179, 2440, 1.61],
  [183, 2520, 1.63], [187, 2600, 1.65], [188, 2680, 1.67],
];
const LAST_DAY = STANDARD.length - 1;
const BROAST_DAY = 27;
const FULL_SIZE_DAY = 35;
const ORDER_AHEAD_DAYS = 5;
/** A flock that has started selling and has under this share of its birds left is treated as sold out. */
const SOLD_OUT_SHARE = 0.07;

export interface FlockDay { date: string; mortality: number; sale_qty: number; sale_kg: number; feed_in: number; feed_used: number; avg_weight_g: number | null }

export interface ChartPoint { day: number; date: string; live: number; stdFeedG: number; stdWeightG: number; stdFcr: number; stdBags: number; cumStdBags: number }

/** Bags the flock should eat each day at the standard rate, on the birds actually left that day. */
export function feedChart(placement: string, gross: number, days: FlockDay[], bagKg: number): ChartPoint[] {
  const points: ChartPoint[] = [];
  let cum = 0;
  STANDARD.forEach(([feed, weight, fcr], day) => {
    const date = addDays(placement, day);
    let gone = 0;
    for (const d of days) if (d.date <= date) gone += d.mortality + d.sale_qty;
    const live = gross - gone;
    const stdBags = (feed * live) / 1000 / bagKg;
    cum += stdBags;
    points.push({ day, date, live, stdFeedG: feed, stdWeightG: weight, stdFcr: fcr, stdBags, cumStdBags: cum });
  });
  return points;
}

/** The Daily Report column for one flock. `asOf` sets the age; totals cover every recorded day, as in the workbook. */
export function flockMetrics(flock: { placement_date: string; gross_qty: number }, days: FlockDay[], asOf: string, bagKg: number) {
  const chart = feedChart(flock.placement_date, flock.gross_qty, days, bagKg);
  const sum = (k: 'mortality' | 'sale_qty' | 'sale_kg' | 'feed_in' | 'feed_used') => days.reduce((s, d) => s + d[k], 0);
  const age = Math.max(0, daysBetween(flock.placement_date, asOf));
  const totalMortality = sum('mortality'), sold = sum('sale_qty'), soldKg = sum('sale_kg'), feedIn = sum('feed_in'), feedUsed = sum('feed_used');
  const balanceQty = flock.gross_qty - totalMortality - sold;

  // How far along the chart the feed eaten so far puts this flock.
  let feedAge: number | null = null;
  for (const p of chart) if (p.cumStdBags <= feedUsed) feedAge = p.day;

  const cumAt = (day: number) => chart[Math.min(day, LAST_DAY)].cumStdBags;
  const chartFeed = cumAt(age);
  const feedForBroast = cumAt(BROAST_DAY);
  const feedForFull = cumAt(FULL_SIZE_DAY);
  const soldOut = sold > 0 && balanceQty < flock.gross_qty * SOLD_OUT_SHARE;
  const last = days.reduce<string | null>((m, d) => (d.date <= asOf && (!m || d.date > m) ? d.date : m), null);
  const weighed = [...days].filter((d) => d.avg_weight_g && d.date <= asOf).sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  return {
    age,
    mortalityOnDay: days.find((d) => d.date === asOf)?.mortality ?? 0,
    totalMortality,
    mortalityPct: flock.gross_qty > 0 ? (totalMortality * 100) / flock.gross_qty : 0,
    sold, soldKg, avgSoldKg: sold > 0 && soldKg > 0 ? soldKg / sold : null,
    balanceQty, soldOut,
    feedIn, feedUsed, feedStock: feedIn - feedUsed,
    chartFeed, chartDiff: chartFeed - feedUsed,
    feedForBroast, feedForFull, balanceForBroast: feedForBroast - feedUsed,
    feedAge,
    expectedWeightG: feedAge === null ? null : STANDARD[feedAge][1],
    ageWeightG: age <= LAST_DAY ? STANDARD[age][1] : null,
    ageDiff: feedAge === null ? null : feedAge - age,
    // Bags to order: what the flock needs up to five days past where its feed intake has reached, less all it has received.
    feedNeed: cumAt((feedAge ?? age) + ORDER_AHEAD_DAYS) - feedIn,
    lastEntry: last,
    lastWeighedG: weighed?.avg_weight_g ?? null,
  };
}

/** Entries that look wrong, in words the farm staff can act on. */
export function flockIssues(flock: { gross_qty: number }, days: FlockDay[], today: string): string[] {
  const out: string[] = [];
  const future = days.filter((d) => d.date > today);
  if (future.length) out.push(`${future.length} ${future.length === 1 ? 'entry is' : 'entries are'} dated after today (${future[0].date}${future.length > 1 ? ` to ${future[future.length - 1].date}` : ''})`);
  const noKg = days.filter((d) => d.sale_qty > 0 && !d.sale_kg);
  if (noKg.length) out.push(`${noKg.reduce((s, d) => s + d.sale_qty, 0)} birds sold with no weight (${noKg.map((d) => d.date).join(', ')})`);
  const noQty = days.filter((d) => d.sale_kg > 0 && !d.sale_qty);
  if (noQty.length) out.push(`Sale weight with no bird count (${noQty.map((d) => d.date).join(', ')})`);
  const gone = days.reduce((s, d) => s + d.mortality + d.sale_qty, 0);
  if (gone > flock.gross_qty) out.push(`Deaths and sales (${gone}) are more than the birds placed (${flock.gross_qty})`);
  const stock = days.reduce((s, d) => s + d.feed_in - d.feed_used, 0);
  if (stock < -0.01) out.push(`More feed used than received (${Math.abs(stock)} bags short)`);
  return out;
}
