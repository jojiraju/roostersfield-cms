import { z } from 'zod';
import { get, run } from '../db.ts';
import { badRequest } from '../errors.ts';
import { deleteVoucher, getVoucher } from '../services/posting.ts';
import { VOUCHER_TYPES, createVoucher, editVoucher, listVouchers, nextBillNo } from '../services/vouchers.ts';
import { createSale, getSaleBill, listSales } from '../services/sales.ts';
import { closeBatch, createBatch, getBatch, listBatches, reopenBatch, suggestIntegration, updateBatch } from '../services/batches.ts';
import type { Router } from '../http.ts';

const optNum = (v: string | null) => (v ? Number(v) : undefined);

export function transactionRoutes(r: Router) {
  // ---- vouchers
  r.get('/api/vouchers', async ({ query }) => await listVouchers({
    type: query.get('type') || undefined, from: query.get('from') || undefined, to: query.get('to') || undefined, q: query.get('q') || undefined,
    accountId: optNum(query.get('accountId')), batchId: optNum(query.get('batchId')), farmId: optNum(query.get('farmId')),
    limit: optNum(query.get('limit')), offset: optNum(query.get('offset')),
  }));
  r.get('/api/vouchers/types', () => VOUCHER_TYPES);
  r.get('/api/vouchers/:id', async ({ params }) => await getVoucher(Number(params.id)));
  r.post('/api/vouchers/:type', async ({ params, body, user }) => ({ id: await createVoucher(params.type, body, user!.sub) }));
  r.put('/api/vouchers/:id', async ({ params, body, user }) => {
    const v = await get<{ type: string }>('SELECT type FROM vouchers WHERE id=?', Number(params.id));
    if (v?.type === 'sale') return await createSale(body, user!.sub, Number(params.id));
    return { id: await editVoucher(Number(params.id), body, user!.sub) };
  });
  r.delete('/api/vouchers/:id', async ({ params }) => await deleteVoucher(Number(params.id)), { admin: true });
  r.patch('/api/vouchers/:id/batch', async ({ params, body }) => {
    const { batchId } = z.object({ batchId: z.coerce.number().int().positive() }).parse(body);
    const b = await get<{ id: number; farm_id: number }>('SELECT id,farm_id FROM batches WHERE id=?', batchId);
    if (!b) throw badRequest('Batch not found');
    const id = Number(params.id);
    await run('UPDATE vouchers SET batch_id=?, farm_id=? WHERE id=?', b.id, b.farm_id, id);
    await run('UPDATE entries SET batch_id=?, farm_id=? WHERE voucher_id=? AND (batch_id IS NOT NULL OR farm_id IS NOT NULL)', b.id, b.farm_id, id);
  }, { admin: true });

  // ---- sales / bills
  r.get('/api/sales', async ({ query }) => await listSales({
    from: query.get('from') || undefined, to: query.get('to') || undefined, q: query.get('q') || undefined,
    traderId: optNum(query.get('traderId')), farmId: optNum(query.get('farmId')), batchId: optNum(query.get('batchId')),
  }));
  r.get('/api/sales/next-bill-no', async () => ({ billNo: await nextBillNo() }));
  r.get('/api/sales/:id', async ({ params }) => await getSaleBill(Number(params.id)));
  r.post('/api/sales', async ({ body, user }) => await createSale(body, user!.sub));

  // ---- batches
  r.get('/api/batches', async ({ query }) => await listBatches({ status: query.get('status') || undefined, farmId: optNum(query.get('farmId')), from: query.get('from') || undefined, to: query.get('to') || undefined }));
  r.get('/api/batches/:id', async ({ params }) => await getBatch(Number(params.id)));
  r.get('/api/batches/:id/integration-suggestion', async ({ params }) => await suggestIntegration(Number(params.id)));
  r.post('/api/batches', async ({ body, user }) => {
    const d = z.object({
      farmId: z.coerce.number().int().positive('Choose a farm'),
      placementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the placement date'),
      placedQty: z.coerce.number().int().positive('Enter the number of chicks placed'),
      supplierId: z.coerce.number().int().positive().nullable().optional(),
      billedQty: z.coerce.number().positive().nullable().optional(),
      rate: z.coerce.number().min(0).nullable().optional(),
      notes: z.string().trim().max(300).optional(),
    }).parse(body);
    return { id: await createBatch(d, user!.sub) };
  });
  r.put('/api/batches/:id', async ({ params, body }) => {
    const d = z.object({ placementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), placedQty: z.coerce.number().int().positive().nullable().optional(), notes: z.string().max(300).nullable().optional() }).parse(body);
    await updateBatch(Number(params.id), d);
  });
  r.post('/api/batches/:id/close', async ({ params, body, user }) => {
    const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the closing date') }).parse(body);
    await closeBatch(Number(params.id), date, user!.sub);
  });
  r.post('/api/batches/:id/reopen', async ({ params }) => await reopenBatch(Number(params.id)), { admin: true });
}
