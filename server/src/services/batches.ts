import { all, get, getSetting, run, tx } from '../db.ts';
import { badRequest, notFound } from '../errors.ts';
import { sysAccountId } from '../seed.ts';
import { daysBetween, round2, today } from '../util.ts';
import { postVoucher } from './posting.ts';
import { createVoucher } from './vouchers.ts';

export interface Kpis {
  avgWeight: number | null; fcr: number | null; cfcr: number | null; livability: number | null; mortality: number | null;
  costPerBird: number | null; costPerKg: number | null; salePerBird: number | null; profitPerBird: number | null; profitPerKg: number | null;
  meanAge: number | null; bpi: number | null;
}

/** Same formulas the client uses in the FARM P&L REPORT sheet. */
export function computeKpis(i: {
  placed: number | null; soldBirds: number; soldKg: number; sales: number; cost: number; feedBags: number; bagKg: number; meanAge: number | null;
}): Kpis {
  const avgWeight = i.soldBirds > 0 ? i.soldKg / i.soldBirds : null;
  const fcr = i.soldKg > 0 && i.feedBags > 0 ? (i.feedBags * i.bagKg) / i.soldKg : null;
  const cfcr = fcr !== null && avgWeight !== null ? fcr + (2 - avgWeight) * 0.25 : null;
  const livability = i.placed && i.placed > 0 && i.soldBirds > 0 ? Math.min(100, (i.soldBirds * 100) / i.placed) : null;
  const mortality = livability !== null ? 100 - livability : null;
  const profit = i.sales - i.cost;
  const bpi = livability !== null && avgWeight !== null && fcr !== null && i.meanAge && i.meanAge > 0 ? (livability * avgWeight * 100) / (i.meanAge * fcr) : null;
  return {
    avgWeight, fcr, cfcr, livability, mortality,
    costPerBird: i.soldBirds > 0 ? i.cost / i.soldBirds : null,
    costPerKg: i.soldKg > 0 ? i.cost / i.soldKg : null,
    salePerBird: i.soldBirds > 0 ? i.sales / i.soldBirds : null,
    profitPerBird: i.soldBirds > 0 ? profit / i.soldBirds : null,
    profitPerKg: i.soldKg > 0 ? profit / i.soldKg : null,
    meanAge: i.meanAge, bpi,
  };
}

interface CostLine { amount: number; qty: number }
interface Agg {
  costs: Record<'chicks' | 'feed' | 'feed_return' | 'medicine' | 'integration' | 'misc' | 'opening', CostLine>;
  totalCost: number; wipBalance: number;
  sales: number; birds: number; kg: number; ageSum: number; lastSale: string | null; firstSale: string | null;
}
const emptyAgg = (): Agg => ({
  costs: { chicks: { amount: 0, qty: 0 }, feed: { amount: 0, qty: 0 }, feed_return: { amount: 0, qty: 0 }, medicine: { amount: 0, qty: 0 }, integration: { amount: 0, qty: 0 }, misc: { amount: 0, qty: 0 }, opening: { amount: 0, qty: 0 } },
  totalCost: 0, wipBalance: 0, sales: 0, birds: 0, kg: 0, ageSum: 0, lastSale: null, firstSale: null,
});

/** One pass over the ledger gives costs + sales for one batch (or all batches). */
export async function batchAggregates(batchId?: number): Promise<Map<number, Agg>> {
  const out = new Map<number, Agg>();
  const A = (id: number) => { let a = out.get(id); if (!a) { a = emptyAgg(); out.set(id, a); } return a; };
  const filter = batchId ? 'AND e.batch_id = ?' : '';
  const args = batchId ? [batchId] : [];

  const costs = await all<{ batch_id: number; category: string | null; d: number; c: number; q: number }>(
    `SELECT e.batch_id, e.category, SUM(e.debit) d, SUM(e.credit) c,
            SUM(CASE WHEN e.debit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) q
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip'
      WHERE e.batch_id IS NOT NULL ${filter} GROUP BY e.batch_id, e.category`, ...args);
  for (const r of costs) {
    const a = A(r.batch_id);
    const amount = r.d - r.c;
    a.wipBalance += amount;
    if (r.category === 'cogs') continue;
    a.totalCost += amount;
    const key = (r.category && r.category in a.costs ? r.category : 'misc') as keyof Agg['costs'];
    a.costs[key].amount += amount;
    a.costs[key].qty += r.q;
  }
  const sales = await all<{ batch_id: number; birds: number; kg: number; amount: number; agesum: number | null; first: string; last: string }>(
    `SELECT e.batch_id,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) birds,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.weight,0) ELSE -COALESCE(e.weight,0) END) kg,
            SUM(e.credit-e.debit) amount,
            SUM((CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) * (julianday(e.date)-julianday(b.placement_date))) agesum,
            MIN(e.date) first, MAX(e.date) last
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='sales' JOIN batches b ON b.id=e.batch_id
      WHERE e.batch_id IS NOT NULL ${filter} GROUP BY e.batch_id`, ...args);
  for (const r of sales) {
    const a = A(r.batch_id);
    a.sales = r.amount; a.birds = r.birds; a.kg = r.kg; a.ageSum = r.agesum ?? 0; a.firstSale = r.first; a.lastSale = r.last;
  }
  return out;
}

interface BatchRow {
  id: number; farm_id: number; farm_name: string; farmer_name: string | null; batch_no: number; placement_date: string | null;
  placed_qty: number | null; status: 'running' | 'closed'; closed_date: string | null; notes: string | null; partial: number;
}
const BATCH_SELECT = `SELECT b.id,b.farm_id,f.name AS farm_name,f.farmer_name,b.batch_no,b.placement_date,b.placed_qty,b.status,b.closed_date,b.notes,b.partial
                        FROM batches b JOIN farms f ON f.id=b.farm_id`;

async function summarize(b: BatchRow, a: Agg) {
  const bagKg = Number(await getSetting('feed_bag_kg', '50')) || 50;
  const feedBags = a.costs.feed.qty + a.costs.feed_return.qty;
  const meanAge = a.birds > 0 && b.placement_date ? a.ageSum / a.birds : null;
  const kpis = computeKpis({ placed: b.placed_qty, soldBirds: a.birds, soldKg: a.kg, sales: a.sales, cost: a.totalCost, feedBags, bagKg, meanAge });
  if (b.partial) Object.assign(kpis, { fcr: null, cfcr: null, livability: null, mortality: null, bpi: null, meanAge: null }); // history incomplete → don't show misleading ratios
  const endDate = b.status === 'closed' ? (b.closed_date ?? a.lastSale ?? today()) : today();
  const ageDays = b.placement_date ? Math.max(0, daysBetween(b.placement_date, endDate)) : null;
  return {
    ...b, ageDays, cost: round2(a.totalCost), salesAmount: round2(a.sales), profit: round2(a.sales - a.totalCost),
    soldBirds: a.birds, soldKg: round2(a.kg), feedBags: round2(feedBags), wipBalance: round2(a.wipBalance), firstSale: a.firstSale, lastSale: a.lastSale, kpis,
  };
}

export async function listBatches(f: { status?: string; farmId?: number; from?: string; to?: string } = {}) {
  const where: string[] = []; const p: (string | number)[] = [];
  if (f.status) { where.push('b.status = ?'); p.push(f.status); }
  if (f.farmId) { where.push('b.farm_id = ?'); p.push(f.farmId); }
  if (f.from) { where.push('COALESCE(b.closed_date, b.placement_date, ?) >= ?'); p.push('9999-12-31', f.from); }
  if (f.to) { where.push('COALESCE(b.placement_date, b.closed_date, ?) <= ?'); p.push('0000-01-01', f.to); }
  const rows = await all<BatchRow>(`${BATCH_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY (b.status='running') DESC, COALESCE(b.placement_date,'') DESC, b.id DESC`, ...p);
  const aggs = await batchAggregates();
  return await Promise.all(rows.map(async (b) => await summarize(b, aggs.get(b.id) ?? emptyAgg())));
}

export async function getBatch(id: number) {
  const b = await get<BatchRow>(`${BATCH_SELECT} WHERE b.id=?`, id);
  if (!b) throw notFound('Batch not found');
  const a = (await batchAggregates(id)).get(id) ?? emptyAgg();
  const salesLines = (await all(
    `SELECT e.id, e.date, e.category, e.qty, e.weight, e.rate, e.credit, e.debit, e.voucher_id, v.bill_no, v.party_id, p.name AS trader
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='sales'
       JOIN vouchers v ON v.id=e.voucher_id LEFT JOIN accounts p ON p.id=v.party_id
      WHERE e.batch_id=? ORDER BY e.date, e.id`, id))
    .map((r) => {
      const sign = r.credit > 0 ? 1 : -1;
      return { id: r.id, date: r.date, category: r.category ?? 'live', trader: r.trader, billNo: r.bill_no, voucherId: r.voucher_id,
        birds: sign * (r.qty ?? 0), kg: round2(sign * (r.weight ?? 0)), rate: r.rate, amount: round2(r.credit - r.debit),
        avgWeight: r.qty > 0 && r.weight > 0 ? r.weight / r.qty : null };
    });
  const bySupplier = await all(
    `SELECT p.name AS party, e.category, SUM(e.debit-e.credit) AS amount
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' LEFT JOIN vouchers v ON v.id=e.voucher_id LEFT JOIN accounts p ON p.id=v.party_id
      WHERE e.batch_id=? AND e.category IN ('feed','chicks','medicine') GROUP BY p.name, e.category ORDER BY amount DESC`, id);
  return { ...await summarize(b, a), costs: a.costs, salesLines, bySupplier };
}

export async function createBatch(input: { farmId: number; placementDate: string; placedQty: number; notes?: string; supplierId?: number | null; billedQty?: number | null; rate?: number | null }, userId: number | null) {
  const farm = await get<{ id: number; name: string; active: number }>('SELECT id,name,active FROM farms WHERE id=?', input.farmId);
  if (!farm) throw badRequest('Choose a farm');
  const running = await get<{ batch_no: number }>(`SELECT batch_no FROM batches WHERE farm_id=? AND status='running'`, input.farmId);
  if (running) throw badRequest(`${farm.name} already has a running batch (#${running.batch_no}). Close it before starting a new one.`);
  if (!(input.placedQty > 0)) throw badRequest('Enter the number of chicks placed');
  return await tx(async () => {
    const next = (await get<{ n: number }>('SELECT COALESCE(MAX(batch_no),0)+1 n FROM batches WHERE farm_id=?', input.farmId))!.n;
    const id = (await run('INSERT INTO batches(farm_id,batch_no,placement_date,placed_qty,notes) VALUES(?,?,?,?,?)', input.farmId, next, input.placementDate, Math.round(input.placedQty), input.notes ?? null)).id;
    if (input.supplierId && input.rate !== null && input.rate !== undefined) {
      await createVoucher('chicks', { date: input.placementDate, supplierId: input.supplierId, batchId: id, qty: input.billedQty ?? input.placedQty, rate: input.rate }, userId);
    }
    return id;
  });
}

export async function updateBatch(id: number, f: { placementDate?: string | null; placedQty?: number | null; notes?: string | null }) {
  if (!await get('SELECT 1 FROM batches WHERE id=?', id)) throw notFound('Batch not found');
  await run(`UPDATE batches SET placement_date=COALESCE(?,placement_date), placed_qty=COALESCE(?,placed_qty), notes=COALESCE(?,notes) WHERE id=?`,
    f.placementDate ?? null, f.placedQty ?? null, f.notes ?? null, id);
}

/** Moves the batch's accumulated cost out of Work-in-Progress into Cost of Goods Sold and closes it. */
export async function closeBatch(id: number, date: string, userId: number | null) {
  const b = await get<{ id: number; farm_id: number; status: string; farm_name: string; batch_no: number }>(
    'SELECT b.id,b.farm_id,b.status,f.name farm_name,b.batch_no FROM batches b JOIN farms f ON f.id=b.farm_id WHERE b.id=?', id);
  if (!b) throw notFound('Batch not found');
  if (b.status === 'closed') throw badRequest('This batch is already closed');
  await tx(async () => {
    const bal = round2((await get<{ s: number | null }>(`SELECT SUM(e.debit-e.credit) s FROM entries e WHERE e.batch_id=? AND e.account_id=?`, id, await sysAccountId('wip')))?.s ?? 0);
    if (Math.abs(bal) >= 0.01) {
      await postVoucher({
        type: 'close', date, description: `Batch closed — cost of goods sold, ${b.farm_name} #${b.batch_no}`, farmId: b.farm_id, batchId: id, userId, source: 'app',
        entries: bal > 0
          ? [{ accountId: await sysAccountId('cogs'), debit: bal, category: 'cogs' }, { accountId: await sysAccountId('wip'), credit: bal, category: 'cogs' }]
          : [{ accountId: await sysAccountId('wip'), debit: -bal, category: 'cogs' }, { accountId: await sysAccountId('cogs'), credit: -bal, category: 'cogs' }],
      });
    }
    await run(`UPDATE batches SET status='closed', closed_date=? WHERE id=?`, date, id);
  });
}

export async function reopenBatch(id: number) {
  const b = await get<{ id: number; farm_id: number; status: string }>('SELECT id,farm_id,status FROM batches WHERE id=?', id);
  if (!b) throw notFound('Batch not found');
  if (b.status === 'running') return;
  if (await get(`SELECT 1 FROM batches WHERE farm_id=? AND status='running'`, b.farm_id)) throw badRequest('This farm already has another running batch');
  await tx(async () => {
    for (const v of await all<{ id: number }>(`SELECT id FROM vouchers WHERE batch_id=? AND type='close'`, id)) await run('DELETE FROM vouchers WHERE id=?', v.id);
    await run(`UPDATE batches SET status='running', closed_date=NULL WHERE id=?`, id);
  });
}

/** Suggested integration payout for a batch (₹/kg of live weight, or ₹/bird for broast-size lots). */
export async function suggestIntegration(id: number) {
  const perKg = Number(await getSetting('integration_rate_per_kg', '6.5'));
  const perBird = Number(await getSetting('integration_rate_per_bird_broast', '13'));
  const lines = await all<{ birds: number; kg: number }>(
    `SELECT SUM(CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) birds,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.weight,0) ELSE -COALESCE(e.weight,0) END) kg
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='sales' WHERE e.batch_id=?`, id);
  const kg = lines[0]?.kg ?? 0;
  const birds = lines[0]?.birds ?? 0;
  const paid = (await get<{ s: number | null }>(`SELECT SUM(e.debit-e.credit) s FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' WHERE e.batch_id=? AND e.category='integration'`, id))?.s ?? 0;
  return { perKg, perBird, kg: round2(kg), birds, byWeight: round2(kg * perKg), byBird: round2(birds * perBird), alreadyPosted: round2(paid) };
}
