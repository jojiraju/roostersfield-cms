import { z } from 'zod';
import { all, get, getSetting, run, tx } from '../db.ts';
import { badRequest, notFound } from '../errors.ts';
import { sysAccountId } from '../seed.ts';
import { round2 } from '../util.ts';
import { postVoucher } from './posting.ts';
import type { EntryInput, VoucherInput } from './posting.ts';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date');
const id = z.coerce.number().int().positive('Please choose one');
const amount = z.coerce.number().positive('Enter an amount greater than zero');
const qtyN = z.coerce.number().positive('Enter a quantity');
const rateN = z.coerce.number().min(0);
const note = z.string().trim().max(300).optional().default('');

export const voucherSchemas = {
  feed: z.object({ date, supplierId: id, batchId: id, feedType: z.string().trim().min(1, 'Choose the feed type'), bags: qtyN, rate: rateN, narration: note }),
  chicks: z.object({ date, supplierId: id, batchId: id, qty: qtyN, rate: rateN, narration: note }),
  medicine: z.object({ date, supplierId: id, batchId: id, item: z.string().trim().min(1, 'Enter the medicine / vaccine name'), qty: qtyN.default(1), rate: rateN, narration: note }),
  feed_return: z.object({
    date, batchId: id, to: z.enum(['supplier', 'batch']), supplierId: id.optional(), toBatchId: id.optional(),
    feedType: z.string().trim().min(1, 'Choose the feed type'), bags: qtyN, rate: rateN, narration: note,
  }),
  integration: z.object({ date, batchId: id, amount, narration: note }),
  misc: z.object({ date, batchId: id, amount, paidFromId: id, narration: note }),
  receipt: z.object({ date, partyId: id, accountId: id, amount, narration: note }),
  payment: z.object({ date, partyId: id, accountId: id, amount, narration: note }),
  expense: z.object({ date, expenseAccountId: id, accountId: id, amount, farmBatchId: id.optional(), narration: note }),
  transfer: z.object({ date, fromAccountId: id, toAccountId: id, amount, narration: note }),
  journal: z.object({
    date, narration: note,
    lines: z.array(z.object({ accountId: id, debit: z.coerce.number().min(0).default(0), credit: z.coerce.number().min(0).default(0), narration: note })).min(2, 'Add at least two lines'),
  }),
} as const;
export type VoucherType = keyof typeof voucherSchemas;
export const VOUCHER_TYPES = Object.keys(voucherSchemas) as VoucherType[];

// ---------- lookups ----------
interface BatchCtx { id: number; batch_no: number; status: string; farm_id: number; farm_name: string; farmer_account_id: number | null }
export async function batchCtx(batchId: number, opts: { allowClosed?: boolean } = {}): Promise<BatchCtx> {
  const b = await get<BatchCtx>(
    `SELECT b.id,b.batch_no,b.status,b.farm_id,f.name AS farm_name,f.farmer_account_id
       FROM batches b JOIN farms f ON f.id=b.farm_id WHERE b.id=?`, batchId);
  if (!b) throw notFound('Batch not found');
  if (b.status === 'closed' && !opts.allowClosed) throw badRequest(`${b.farm_name} batch #${b.batch_no} is closed. Re-open the batch first to add entries.`);
  return b;
}
async function account(accId: number, expect?: string[]) {
  const a = await get<{ id: number; name: string; category: string; subtype: string | null }>('SELECT id,name,category,subtype FROM accounts WHERE id=?', accId);
  if (!a) throw badRequest('Selected account does not exist');
  if (expect && !expect.includes(a.category)) throw badRequest(`${a.name} is not a valid choice here`);
  return a;
}
const liquid = ['cash', 'bank'];
const bn = (b: BatchCtx) => `${b.farm_name} #${b.batch_no}`;

type Built = Omit<VoucherInput, 'userId' | 'source' | 'replaceId'>;
type Data<T extends VoucherType> = z.infer<typeof voucherSchemas[T]>;

// ---------- builders: friendly form  ->  balanced double entry ----------
const builders: { [K in VoucherType]: (d: Data<K>) => Promise<Built> | Built } = {
  async feed(d) {
    const b = await batchCtx(d.batchId); const s = await account(d.supplierId, ['supplier']);
    const amt = round2(d.bags * d.rate);
    return {
      type: 'feed', date: d.date, description: d.narration || `Feed to ${b.farm_name}`, partyId: s.id, farmId: b.farm_id, batchId: b.id,
      entries: [
        { accountId: await sysAccountId('wip'), debit: amt, category: 'feed', item: d.feedType, qty: d.bags, rate: d.rate },
        { accountId: s.id, credit: amt, item: d.feedType, qty: d.bags, rate: d.rate },
      ],
    };
  },
  async chicks(d) {
    const b = await batchCtx(d.batchId); const s = await account(d.supplierId, ['supplier']);
    const amt = round2(d.qty * d.rate);
    return {
      type: 'chicks', date: d.date, description: d.narration || `Chicks for ${bn(b)}`, partyId: s.id, farmId: b.farm_id, batchId: b.id,
      entries: [
        { accountId: await sysAccountId('wip'), debit: amt, category: 'chicks', item: 'CHICKS', qty: d.qty, rate: d.rate },
        { accountId: s.id, credit: amt, item: 'CHICKS', qty: d.qty, rate: d.rate },
      ],
    };
  },
  async medicine(d) {
    const b = await batchCtx(d.batchId); const s = await account(d.supplierId, ['supplier']);
    const amt = round2(d.qty * d.rate);
    return {
      type: 'medicine', date: d.date, description: d.narration || `Medicine to ${b.farm_name}`, partyId: s.id, farmId: b.farm_id, batchId: b.id,
      entries: [
        { accountId: await sysAccountId('wip'), debit: amt, category: 'medicine', item: d.item, qty: d.qty, rate: d.rate },
        { accountId: s.id, credit: amt, item: d.item, qty: d.qty, rate: d.rate },
      ],
    };
  },
  async feed_return(d) {
    const from = await batchCtx(d.batchId); const amt = round2(d.bags * d.rate);
    const wip = await sysAccountId('wip');
    const out: EntryInput = { accountId: wip, credit: amt, category: 'feed_return', item: d.feedType, qty: d.bags, rate: d.rate };
    if (d.to === 'supplier') {
      if (!d.supplierId) throw badRequest('Choose the supplier the feed goes back to');
      const s = await account(d.supplierId, ['supplier']);
      return {
        type: 'feed_return', date: d.date, description: d.narration || `Feed returned from ${from.farm_name} to ${s.name}`, partyId: s.id, farmId: from.farm_id, batchId: from.id,
        entries: [{ accountId: s.id, debit: amt, item: d.feedType, qty: d.bags, rate: d.rate }, out],
      };
    }
    if (!d.toBatchId) throw badRequest('Choose the farm the feed goes to');
    if (d.toBatchId === d.batchId) throw badRequest('Source and destination are the same batch');
    const to = await batchCtx(d.toBatchId);
    return {
      type: 'feed_return', date: d.date, description: d.narration || `Feed transferred from ${from.farm_name} to ${to.farm_name}`, farmId: from.farm_id, batchId: from.id,
      entries: [
        { accountId: wip, debit: amt, farmId: to.farm_id, batchId: to.id, category: 'feed', item: d.feedType, qty: d.bags, rate: d.rate },
        { ...out, farmId: from.farm_id, batchId: from.id },
      ],
    };
  },
  async integration(d) {
    const b = await batchCtx(d.batchId);
    if (!b.farmer_account_id) throw badRequest(`${b.farm_name} has no farmer account linked. Edit the farm and set the farmer first.`);
    return {
      type: 'integration', date: d.date, description: d.narration || `Integration for ${bn(b)}`, partyId: b.farmer_account_id, farmId: b.farm_id, batchId: b.id,
      entries: [
        { accountId: await sysAccountId('wip'), debit: d.amount, category: 'integration', item: 'INTEGRATION' },
        { accountId: b.farmer_account_id, credit: d.amount, item: 'INTEGRATION' },
      ],
    };
  },
  async misc(d) {
    const b = await batchCtx(d.batchId); const from = await account(d.paidFromId, liquid);
    return {
      type: 'misc', date: d.date, description: d.narration || `Farm expense — ${b.farm_name}`, farmId: b.farm_id, batchId: b.id,
      entries: [
        { accountId: await sysAccountId('wip'), debit: d.amount, category: 'misc', item: d.narration || 'MISCELLANEOUS' },
        { accountId: from.id, credit: d.amount },
      ],
    };
  },
  async receipt(d) {
    const p = await account(d.partyId); const to = await account(d.accountId, liquid);
    return {
      type: 'receipt', date: d.date, description: d.narration || `Received from ${p.name}`, partyId: p.id,
      entries: [{ accountId: to.id, debit: d.amount }, { accountId: p.id, credit: d.amount }],
    };
  },
  async payment(d) {
    const p = await account(d.partyId); const from = await account(d.accountId, liquid);
    return {
      type: 'payment', date: d.date, description: d.narration || `Paid to ${p.name}`, partyId: p.id,
      entries: [{ accountId: p.id, debit: d.amount }, { accountId: from.id, credit: d.amount }],
    };
  },
  async expense(d) {
    const ex = await account(d.expenseAccountId, ['expense']); const from = await account(d.accountId, liquid);
    if (d.farmBatchId) {
      const b = await batchCtx(d.farmBatchId);
      return {
        type: 'misc', date: d.date, description: d.narration || `${ex.name} — ${b.farm_name}`, farmId: b.farm_id, batchId: b.id,
        entries: [{ accountId: await sysAccountId('wip'), debit: d.amount, category: 'misc', item: ex.name }, { accountId: from.id, credit: d.amount }],
      };
    }
    return {
      type: 'expense', date: d.date, description: d.narration || ex.name, partyId: ex.id,
      entries: [{ accountId: ex.id, debit: d.amount }, { accountId: from.id, credit: d.amount }],
    };
  },
  async transfer(d) {
    if (d.fromAccountId === d.toAccountId) throw badRequest('Choose two different accounts');
    const from = await account(d.fromAccountId, liquid); const to = await account(d.toAccountId, liquid);
    return {
      type: 'transfer', date: d.date, description: d.narration || `Transfer ${from.name} → ${to.name}`,
      entries: [{ accountId: to.id, debit: d.amount }, { accountId: from.id, credit: d.amount }],
    };
  },
  async journal(d) {
    for (const l of d.lines) { await account(l.accountId); if ((l.debit > 0) === (l.credit > 0)) throw badRequest('Each line needs either a debit or a credit amount'); }
    return {
      type: 'journal', date: d.date, description: d.narration || 'Journal entry',
      entries: d.lines.map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, narration: l.narration || null })),
    };
  },
};

export async function createVoucher(type: string, raw: unknown, userId: number | null, replaceId?: number): Promise<number> {
  if (!(type in voucherSchemas)) throw badRequest(`Unknown transaction type "${type}"`);
  const t = type as VoucherType;
  const data = voucherSchemas[t].parse(raw) as any;
  const built = await (builders[t] as (d: any) => Promise<Built>)(data);
  return await postVoucher({ ...built, userId, replaceId, source: 'app', meta: { payload: { ...data, type: t } } });
}

/** Re-post an app-created voucher from edited form data. */
export async function editVoucher(voucherId: number, raw: unknown, userId: number | null): Promise<number> {
  const v = await get<{ source: string; meta: string | null; type: string }>('SELECT source,meta,type FROM vouchers WHERE id=?', voucherId);
  if (!v) throw notFound('Transaction not found');
  const payloadType = v.meta ? (JSON.parse(v.meta)?.payload?.type as string | undefined) : undefined;
  if (v.source !== 'app' || !payloadType) throw badRequest('Imported entries cannot be edited here. Delete and re-enter, or post an adjustment journal.');
  const body = (raw ?? {}) as { type?: string };
  return await createVoucher(body.type ?? payloadType, raw, userId, voucherId);
}

export interface VoucherFilter {
  type?: string; from?: string; to?: string; q?: string; accountId?: number; batchId?: number; farmId?: number; limit?: number; offset?: number;
}
export async function listVouchers(f: VoucherFilter) {
  const where: string[] = []; const p: (string | number)[] = [];
  if (f.type) { where.push('v.type = ?'); p.push(f.type); }
  if (f.from) { where.push('v.date >= ?'); p.push(f.from); }
  if (f.to) { where.push('v.date <= ?'); p.push(f.to); }
  if (f.batchId) { where.push('v.batch_id = ?'); p.push(f.batchId); }
  if (f.farmId) { where.push('v.farm_id = ?'); p.push(f.farmId); }
  if (f.accountId) { where.push('EXISTS (SELECT 1 FROM entries x WHERE x.voucher_id=v.id AND x.account_id=?)'); p.push(f.accountId); }
  if (f.q) {
    const like = `%${f.q.replace(/[%_]/g, '')}%`;
    where.push('(v.description LIKE ? OR p.name LIKE ? OR fm.name LIKE ? OR CAST(v.voucher_no AS TEXT)=? OR CAST(v.bill_no AS TEXT)=?)');
    p.push(like, like, like, f.q.trim(), f.q.trim());
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const base = `FROM vouchers v LEFT JOIN accounts p ON p.id=v.party_id LEFT JOIN farms fm ON fm.id=v.farm_id LEFT JOIN batches b ON b.id=v.batch_id ${w}`;
  const total = (await get<{ n: number }>(`SELECT COUNT(*) n ${base}`, ...p))!.n;
  const rows = await all(
    `SELECT v.id, v.voucher_no, v.type, v.date, v.description, v.bill_no, v.source, v.party_id, p.name AS party_name,
            v.farm_id, fm.name AS farm_name, v.batch_id, b.batch_no,
            (SELECT COALESCE(SUM(debit),0) FROM entries e WHERE e.voucher_id=v.id) AS amount
       ${base} ORDER BY v.date DESC, v.id DESC LIMIT ? OFFSET ?`,
    ...p, Math.min(f.limit ?? 50, 500), f.offset ?? 0);
  return { total, rows };
}

export const nextBillNo = async () => {
  const n = Number(await getSetting('next_bill_no', '1')) || 1;
  const used = (await get<{ m: number | null }>('SELECT MAX(bill_no) m FROM vouchers'))?.m ?? 0;
  return Math.max(n, used + 1);
};
export const bumpBillNo = async (used: number) => {
  await run(`INSERT INTO settings(key,value) VALUES('next_bill_no',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, String(used + 1));
};
export { tx };
