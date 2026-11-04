import { all, get, run, tx } from '../db.ts';
import { badRequest, notFound } from '../errors.ts';
import { round2 } from '../util.ts';

export interface EntryInput {
  accountId: number;
  debit?: number;
  credit?: number;
  farmId?: number | null;
  batchId?: number | null;
  category?: string | null;
  item?: string | null;
  qty?: number | null;
  weight?: number | null;
  rate?: number | null;
  narration?: string | null;
}

export interface VoucherInput {
  type: string;
  date: string;
  description: string;
  partyId?: number | null;
  farmId?: number | null;
  batchId?: number | null;
  billNo?: number | null;
  meta?: unknown;
  source?: string;
  userId?: number | null;
  entries: EntryInput[];
  /** When set, the voucher (same number/bill no) is rewritten instead of creating a new one. */
  replaceId?: number;
}

/**
 * The single place where money moves. Validates that debits == credits, then writes the voucher
 * header and its lines atomically. Everything else (feed, sales, receipts…) builds on this.
 */
export async function postVoucher(v: VoucherInput): Promise<number> {
  const lines = v.entries
    .map((e) => ({ ...e, debit: round2(e.debit ?? 0), credit: round2(e.credit ?? 0) }))
    .filter((e) => e.debit !== 0 || e.credit !== 0);
  if (lines.length < 2) throw badRequest('A transaction needs at least two lines');
  for (const e of lines) {
    if (e.debit < 0 || e.credit < 0) throw badRequest('Amounts cannot be negative');
    if (e.debit > 0 && e.credit > 0) throw badRequest('A line cannot be both debit and credit');
  }
  const dr = round2(lines.reduce((s, e) => s + e.debit, 0));
  const cr = round2(lines.reduce((s, e) => s + e.credit, 0));
  if (Math.abs(dr - cr) > 0.01) throw badRequest(`Debits (${dr}) and credits (${cr}) do not match`);

  return await tx(async () => {
    let id: number;
    const meta = v.meta === undefined ? null : JSON.stringify(v.meta);
    if (v.replaceId) {
      const old = await get('SELECT id FROM vouchers WHERE id=?', v.replaceId);
      if (!old) throw notFound('Transaction not found');
      await run(
        `UPDATE vouchers SET type=?, date=?, description=?, party_id=?, farm_id=?, batch_id=?, meta=?, updated_at=datetime('now') WHERE id=?`,
        v.type, v.date, v.description, v.partyId ?? null, v.farmId ?? null, v.batchId ?? null, meta, v.replaceId,
      );
      await run('DELETE FROM entries WHERE voucher_id=?', v.replaceId);
      id = v.replaceId;
    } else {
      const next = (await get<{ n: number }>('SELECT COALESCE(MAX(voucher_no),0)+1 AS n FROM vouchers'))!.n;
      id = (await run(
        `INSERT INTO vouchers(voucher_no,type,date,description,party_id,farm_id,batch_id,bill_no,meta,source,created_by)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        next, v.type, v.date, v.description, v.partyId ?? null, v.farmId ?? null, v.batchId ?? null,
        v.billNo ?? null, meta, v.source ?? 'app', v.userId ?? null,
      )).id;
    }
    for (const [i, e] of lines.entries()) {
      await run(
        `INSERT INTO entries(voucher_id,seq,date,account_id,farm_id,batch_id,debit,credit,category,item,qty,weight,rate,narration)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        id, i, v.date, e.accountId, e.farmId ?? v.farmId ?? null, e.batchId ?? v.batchId ?? null, e.debit, e.credit,
        e.category ?? null, e.item ?? null, e.qty ?? null, e.weight ?? null, e.rate ?? null, e.narration ?? null,
      );
    }
    return id;
  });
}

export async function deleteVoucher(id: number) {
  const v = await get<{ id: number; type: string; batch_id: number | null }>('SELECT id,type,batch_id FROM vouchers WHERE id=?', id);
  if (!v) throw notFound('Transaction not found');
  await tx(async () => {
    await run('DELETE FROM entries WHERE voucher_id=?', id);
    await run('DELETE FROM vouchers WHERE id=?', id);
    // Deleting a batch-closing entry re-opens the batch.
    if (v.type === 'close' && v.batch_id) await run(`UPDATE batches SET status='running', closed_date=NULL WHERE id=?`, v.batch_id);
  });
}

export async function getVoucher(id: number) {
  const v = await get(
    `SELECT v.*, p.name AS party_name, f.name AS farm_name, b.batch_no
       FROM vouchers v
       LEFT JOIN accounts p ON p.id=v.party_id
       LEFT JOIN farms f ON f.id=v.farm_id
       LEFT JOIN batches b ON b.id=v.batch_id
      WHERE v.id=?`, id);
  if (!v) throw notFound('Transaction not found');
  const entries = await all(
    `SELECT e.*, a.name AS account_name, a.category AS account_category, f.name AS farm_name
       FROM entries e JOIN accounts a ON a.id=e.account_id LEFT JOIN farms f ON f.id=e.farm_id
      WHERE e.voucher_id=? ORDER BY e.seq, e.id`, id);
  return { ...v, meta: v.meta ? JSON.parse(v.meta) : null, entries };
}
