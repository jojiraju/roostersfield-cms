import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays } from '../util.ts';
import { feedChart, flockIssues, flockMetrics, STANDARD } from './flockMetrics.ts';
import type { FlockDay } from './flockMetrics.ts';

// The ANAND FARM tab of the DAILY REPORT workbook as saved on 3 Nov 2026 (day 19). Expected values are the workbook's own.
const PLACED = '2026-10-15';
const row = (day: number, mortality: number, feed_in: number, feed_used: number): FlockDay => ({ date: addDays(PLACED, day), mortality, sale_qty: 0, sale_kg: 0, feed_in, feed_used, avg_weight_g: null });
const ANAND: FlockDay[] = [
  row(0, 0, 15, 0), row(1, 0, 0, 2), row(2, 0, 0, 2), row(3, 0, 0, 3), row(4, 0, 0, 3), row(5, 0, 0, 2), row(6, 0, 30, 4),
  row(7, 0, 0, 6), row(8, 0, 0, 7), row(9, 0, 0, 9), row(10, 38, 30, 4), row(11, 7, 0, 7), row(12, 5, 0, 8), row(13, 10, 25, 8),
  row(14, 10, 0, 15), row(15, 7, 0, 7), row(16, 15, 40, 9), row(17, 13, 0, 11), row(18, 12, 0, 11), row(19, 7, 0, 11),
];
const flock = { placement_date: PLACED, gross_qty: 6000.66 };
const near = (a: number | null, b: number, label: string) => assert.ok(a !== null && Math.abs(a - b) < 0.001, `${label}: got ${a}, workbook has ${b}`);

test('the standard chart covers day 0 to 41', () => {
  assert.equal(STANDARD.length, 42);
  assert.deepEqual(STANDARD[41], [188, 2680, 1.67]);
});

test('feed chart matches the workbook', () => {
  const c = feedChart(PLACED, flock.gross_qty, ANAND, 50);
  near(c[0].cumStdBags, 1.6801848, 'day 0');
  near(c[19].cumStdBags, 137.352, 'day 19');
});

test('daily report figures match the workbook', () => {
  const m = flockMetrics(flock, ANAND, '2026-11-03', 50);
  assert.equal(m.age, 19);
  assert.equal(m.mortalityOnDay, 7);
  assert.equal(m.totalMortality, 124);
  near(m.mortalityPct, 2.066, 'mortality %');
  near(m.balanceQty, 5876.66, 'balance birds');
  assert.equal(m.feedUsed, 129);
  assert.equal(m.feedStock, 11);
  near(m.chartFeed, 137.352, 'chart feed');
  near(m.feedForBroast, 255.121, 'feed for broast size');
  near(m.feedForFull, 400.627, 'feed for full size');
  assert.equal(m.expectedWeightG, 857);
  assert.equal(m.ageWeightG, 932);
  assert.equal(m.ageDiff, -1);
  near(m.feedNeed, 53.298, 'feed need');
});

test('age past the chart has no standard weight', () => {
  const m = flockMetrics(flock, ANAND, addDays(PLACED, 50), 50);
  assert.equal(m.age, 50); // counted from dates, so the day 42 missing from the workbook's numbering does not add one
  assert.equal(m.ageWeightG, null);
});

test('a flock with almost no birds left counts as sold out', () => {
  const sold: FlockDay = { ...row(40, 0, 0, 0), sale_qty: 5700, sale_kg: 11000 };
  assert.equal(flockMetrics(flock, [...ANAND, sold], '2026-11-30', 50).soldOut, true);
  assert.equal(flockMetrics(flock, ANAND, '2026-11-03', 50).soldOut, false);
});

test('wrong entries are reported', () => {
  const bad: FlockDay[] = [
    { ...row(0, 0, 0, 5), sale_qty: 10 },
    { ...row(30, 0, 0, 0), sale_kg: 20 },
  ];
  const issues = flockIssues({ gross_qty: 5 }, bad, addDays(PLACED, 10));
  assert.equal(issues.length, 5);
});
