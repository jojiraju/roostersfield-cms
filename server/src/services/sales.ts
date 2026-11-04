import { z } from 'zod';
import { all, get, tx } from '../db.ts';
import { badRequest, notFound } from '../errors.ts';
import { sysAccountId } from '../seed.ts';
import { round2 } from '../util.ts';
import { postVoucher } from './posting.ts';
import type { EntryInput } from './posting.ts';
import { batchCtx, bumpBillNo, createVoucher, nextBillNo } from './vouchers.ts';

const n = (min = 0) => z.coerce.number().min(min);
export const saleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date'),
  traderId: z.coerce.number().int().positive('Choose the buyer'),
  batchId: z.coerce.number().int().positive('Choose the farm / batch'),
  billNo: z.coerce.number().int().positive().optional(),
  vehicleNo: z.string().trim().max(30).optional().default(''),
  isBroast: z.boolean().optional().default(false),
  boxes: z.array(z.object({ emptyBoxes: n().default(0), emptyWeight: n().default(0), loadedBoxes: n().default(0), loadedWeight: n().default(0) })).optional().default([]),
  grossKg: n().optional().default(0),
  birds: z.coerce.number().int().positive('Enter the number of birds'),
  damageKg: n().optional().default(0),
  rate: z.coerce.number().positive('Enter the rate per kg'),
  weakBirds: n().optional().default(0),
  weakKg: n().optional().default(0),
  weakRate: n().optional().default(0),
  receivedAmount: n().optional().default(0),
  receivedAccountId: z.coerce.number().int().positive().optional(),
  narration: z.string().trim().max(300).optional().default(''),
});
export type SaleInput = z.infer<typeof saleSchema>;

export function computeBill(d: SaleInput) {
  const emptyWeight = round2(d.boxes.reduce((s, b) => s + b.emptyWeight, 0));
  const loadedWeight = round2(d.boxes.reduce((s, b) => s + b.loadedWeight, 0));
  const emptyBoxes = d.boxes.reduce((s, b) => s + b.emptyBoxes, 0);
  const loadedBoxes = d.boxes.reduce((s, b) => s + b.loadedBoxes, 0);
  const gross = d.boxes.length ? round2(loadedWeight - emptyWeight) : round2(d.grossKg);
  const netKg = round2(gross - d.damageKg);
  if (netKg <= 0) throw badRequest('Net weight must be greater than zero — check the box weights');
  const liveAmount = round2(netKg * d.rate);
  const weakAmount = round2(d.weakKg * d.weakRate);
  return { emptyWeight, loadedWeight, emptyBoxes, loadedBoxes, gross, netKg, liveAmount, weakAmount, total: round2(liveAmount + weakAmount), avgWeight: d.birds > 0 ? netKg / d.birds : 0 };
}

export async function createSale(raw: unknown, userId: number | null, replaceId?: number) {
  const d = saleSchema.parse(raw);
  const trader = await get<{ id: number; name: string }>(`SELECT id,name FROM accounts WHERE id=? AND category IN ('trader','other_asset','other_liability','supplier','farmer')`, d.traderId);
  if (!trader) throw badRequest('Choose the buyer');
  const b = await batchCtx(d.batchId, { allowClosed: true });
  const calc = computeBill(d);
  return await tx(async () => {
    let billNo = d.billNo ?? null;
    if (replaceId) billNo = (await get<{ bill_no: number | null }>('SELECT bill_no FROM vouchers WHERE id=?', replaceId))?.bill_no ?? billNo;
    else if (!billNo) billNo = await nextBillNo();
    else if (await get('SELECT 1 FROM vouchers WHERE bill_no=?', billNo)) throw badRequest(`Bill no. ${billNo} is already used`);

    const entries: EntryInput[] = [
      { accountId: trader.id, debit: calc.total, item: `Bill ${billNo}` },
      { accountId: await sysAccountId('sales'), credit: calc.liveAmount, category: 'live', item: trader.name, qty: d.birds, weight: calc.netKg, rate: d.rate },
    ];
    if (calc.weakAmount > 0) entries.push({ accountId: await sysAccountId('sales'), credit: calc.weakAmount, category: 'weak', item: 'WEAK BIRDS', qty: d.weakBirds, weight: d.weakKg, rate: d.weakRate });
    const id = await postVoucher({
      type: 'sale', date: d.date, description: d.narration || `Sale to ${trader.name} from ${b.farm_name}`, partyId: trader.id, farmId: b.farm_id, batchId: b.id,
      billNo, userId, source: 'app', replaceId, entries,
      meta: { payload: { ...d, type: 'sale' }, calc, bill: { vehicleNo: d.vehicleNo, boxes: d.boxes, isBroast: d.isBroast } },
    });
    if (!replaceId) {
      if (billNo !== null && (!d.billNo || billNo >= await nextBillNo())) await bumpBillNo(billNo);
      if (d.receivedAmount > 0) {
        const acc = d.receivedAccountId ?? await sysAccountId('cash');
        await createVoucher('receipt', { date: d.date, partyId: trader.id, accountId: acc, amount: d.receivedAmount, narration: `Received with bill no. ${billNo}` }, userId);
      }
    }
    return { id, billNo, total: calc.total };
  });
}

export async function listSales(f: { from?: string; to?: string; traderId?: number; farmId?: number; batchId?: number; q?: string }) {
  const where = [`v.type='sale'`]; const p: (string | number)[] = [];
  if (f.from) { where.push('v.date>=?'); p.push(f.from); }
  if (f.to) { where.push('v.date<=?'); p.push(f.to); }
  if (f.traderId) { where.push('v.party_id=?'); p.push(f.traderId); }
  if (f.farmId) { where.push('v.farm_id=?'); p.push(f.farmId); }
  if (f.batchId) { where.push('v.batch_id=?'); p.push(f.batchId); }
  if (f.q) { const like = `%${f.q}%`; where.push('(t.name LIKE ? OR fm.name LIKE ? OR CAST(v.bill_no AS TEXT)=?)'); p.push(like, like, f.q.trim()); }
  const rows = await all(
    `SELECT v.id, v.date, v.bill_no, v.voucher_no, v.source, t.name AS trader, v.party_id, fm.name AS farm, v.farm_id, v.batch_id, b.batch_no,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.qty,0) ELSE -COALESCE(e.qty,0) END) AS birds,
            SUM(CASE WHEN e.credit>0 THEN COALESCE(e.weight,0) ELSE -COALESCE(e.weight,0) END) AS kg,
            SUM(e.credit-e.debit) AS amount
       FROM vouchers v
       JOIN entries e ON e.voucher_id=v.id AND e.account_id=${await sysAccountId('sales')}
       LEFT JOIN accounts t ON t.id=v.party_id LEFT JOIN farms fm ON fm.id=v.farm_id LEFT JOIN batches b ON b.id=v.batch_id
      WHERE ${where.join(' AND ')}
      GROUP BY v.id ORDER BY v.date DESC, v.id DESC LIMIT 1000`, ...p);
  const totals = rows.reduce((s, r) => ({ birds: s.birds + (r.birds ?? 0), kg: s.kg + (r.kg ?? 0), amount: s.amount + (r.amount ?? 0) }), { birds: 0, kg: 0, amount: 0 });
  return { rows: rows.map((r) => ({ ...r, kg: round2(r.kg), amount: round2(r.amount), avgWeight: r.birds > 0 ? r.kg / r.birds : null, rate: r.kg > 0 ? r.amount / r.kg : null })), totals: { ...totals, kg: round2(totals.kg), amount: round2(totals.amount) } };
}

export async function getSaleBill(voucherId: number) {
  const v = await get(
    `SELECT v.*, t.name AS trader, fm.name AS farm, b.batch_no FROM vouchers v
       LEFT JOIN accounts t ON t.id=v.party_id LEFT JOIN farms fm ON fm.id=v.farm_id LEFT JOIN batches b ON b.id=v.batch_id
      WHERE v.id=? AND v.type='sale'`, voucherId);
  if (!v) throw notFound('Bill not found');
  const meta = v.meta ? JSON.parse(v.meta) : null;
  const lines = await all(`SELECT e.category, e.qty, e.weight, e.rate, e.credit-e.debit AS amount FROM entries e WHERE e.voucher_id=? AND e.account_id=?`, voucherId, await sysAccountId('sales'));
  const balance = (await get<{ s: number }>(`SELECT COALESCE(SUM(e.debit-e.credit),0) s FROM entries e WHERE e.account_id=? AND (e.date < ? OR (e.date = ? AND e.voucher_id <= ?))`, v.party_id, v.date, v.date, voucherId))?.s ?? 0;
  const previous = round2(balance - lines.reduce((s, l) => s + l.amount, 0));
  return { ...v, meta, lines, partyBalanceAfter: round2(balance), partyBalanceBefore: previous };
}
