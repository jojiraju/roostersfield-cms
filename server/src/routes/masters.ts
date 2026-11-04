import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { all, backupLocal, get, run, tx } from '../db.ts';
import { config } from '../config.ts';
import { deleteVoucher } from '../services/posting.ts';
import { badRequest, notFound } from '../errors.ts';
import { addAccount } from '../seed.ts';
import { CATEGORIES, CATEGORY_TYPE } from '../util.ts';
import type { Category } from '../util.ts';
import { listBatches } from '../services/batches.ts';
import type { Router } from '../http.ts';

const accountSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(80),
  category: z.enum(CATEGORIES as [Category, ...Category[]]),
  subtype: z.enum(['feed', 'medicine', 'chicks', 'other']).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  notes: z.string().trim().max(300).nullable().optional(),
});

export function masterRoutes(r: Router) {
  // ---- accounts / parties
  r.get('/api/accounts', async ({ query }) => {
    const where: string[] = []; const p: (string | number)[] = [];
    const cats = query.get('category')?.split(',').filter(Boolean);
    if (cats?.length) { where.push(`a.category IN (${cats.map(() => '?').join(',')})`); p.push(...cats); }
    if (query.get('subtype')) { where.push('a.subtype=?'); p.push(query.get('subtype')!); }
    if (query.get('q')) { where.push('a.name LIKE ?'); p.push(`%${query.get('q')}%`); }
    if (query.get('active') !== 'all') where.push('a.active=1');
    return await all(
      `SELECT a.id,a.name,a.type,a.category,a.subtype,a.sys_key,a.phone,a.notes,a.active, COALESCE(b.bal,0) AS balance, b.last AS last_activity, COALESCE(b.n,0) AS entries
         FROM accounts a LEFT JOIN (SELECT account_id, SUM(debit-credit) bal, MAX(date) last, COUNT(*) n FROM entries GROUP BY account_id) b ON b.account_id=a.id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY a.name`, ...p);
  });
  r.post('/api/accounts', async ({ body }) => {
    const d = accountSchema.parse(body);
    if (await get('SELECT 1 FROM accounts WHERE name=?', d.name)) throw badRequest(`"${d.name}" already exists`);
    const id = await addAccount(d.name, d.category, { subtype: d.category === 'supplier' ? (d.subtype ?? 'other') : null });
    await run('UPDATE accounts SET phone=?, notes=? WHERE id=?', d.phone ?? null, d.notes ?? null, id);
    return { id };
  });
  r.put('/api/accounts/:id', async ({ params, body }) => {
    const id = Number(params.id);
    const cur = await get<{ sys_key: string | null }>('SELECT sys_key FROM accounts WHERE id=?', id);
    if (!cur) throw notFound('Account not found');
    const d = accountSchema.partial().extend({ active: z.boolean().optional() }).parse(body);
    if (d.name && await get('SELECT 1 FROM accounts WHERE name=? AND id<>?', d.name, id)) throw badRequest(`"${d.name}" already exists`);
    if (d.category && cur.sys_key) throw badRequest('System accounts cannot change type');
    await run(
      `UPDATE accounts SET name=COALESCE(?,name), category=COALESCE(?,category), type=COALESCE(?,type), subtype=?, phone=COALESCE(?,phone), notes=COALESCE(?,notes), active=COALESCE(?,active) WHERE id=?`,
      d.name, d.category, d.category ? CATEGORY_TYPE[d.category] : null,
      d.category === 'supplier' || d.subtype ? (d.subtype ?? 'other') : (await get<{ subtype: string | null }>('SELECT subtype FROM accounts WHERE id=?', id))!.subtype,
      d.phone, d.notes, d.active === undefined ? null : Number(d.active), id);
  });
  r.delete('/api/accounts/:id', async ({ params, query }) => {
    const id = Number(params.id);
    const force = query.get('force') === '1';
    const a = await get<{ sys_key: string | null }>('SELECT sys_key FROM accounts WHERE id=?', id);
    if (!a) throw notFound();
    if (a.sys_key) throw badRequest('System accounts cannot be deleted');
    const vouchers = (await all<{ voucher_id: number }>('SELECT DISTINCT voucher_id FROM entries WHERE account_id=?', id)).map((x) => x.voucher_id);
    if (vouchers.length && !force) throw badRequest('This account has transactions. Mark it inactive, or delete it together with its transactions.');
    let backup: string | null = null;
    if (vouchers.length) {
      // Safety net: copy the database before removing history.
      backup = await backupLocal('before-delete');
    }
    await tx(async () => {
      for (const v of vouchers) await deleteVoucher(v);
      await run('UPDATE farms SET farmer_account_id=NULL WHERE farmer_account_id=?', id);
      await run('DELETE FROM accounts WHERE id=?', id);
    });
    return { deletedVouchers: vouchers.length, backup: backup ? path.basename(backup) : null };
  }, { admin: true });

  // ---- farms
  const farmSchema = z.object({
    name: z.string().trim().min(2, 'Enter the farm name').max(80),
    farmerName: z.string().trim().max(80).nullable().optional(),
    farmerAccountId: z.coerce.number().int().positive().nullable().optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    location: z.string().trim().max(120).nullable().optional(),
    capacity: z.coerce.number().int().min(0).nullable().optional(),
    notes: z.string().trim().max(300).nullable().optional(),
    active: z.boolean().optional(),
  });
  const resolveFarmer = async (d: z.infer<typeof farmSchema>): Promise<number | null> => {
    if (d.farmerAccountId) return d.farmerAccountId;
    if (d.farmerName) {
      const ex = await get<{ id: number }>('SELECT id FROM accounts WHERE name=?', d.farmerName);
      return ex ? ex.id : await addAccount(d.farmerName.toUpperCase(), 'farmer');
    }
    return null;
  };

  r.get('/api/farms', async () => {
    const farms = await all<any>(`SELECT f.*, a.name AS farmer_account FROM farms f LEFT JOIN accounts a ON a.id=f.farmer_account_id ORDER BY f.active DESC, f.name`);
    const batches = await listBatches();
    return farms.map((f) => {
      const mine = batches.filter((b) => b.farm_id === f.id);
      const running = mine.find((b) => b.status === 'running') ?? null;
      const done = mine.filter((b) => b.status === 'closed' && b.soldKg > 0);
      const profit = done.reduce((s, b) => s + b.profit, 0);
      const kg = done.reduce((s, b) => s + b.soldKg, 0);
      const fcrs = done.map((b) => b.kpis.fcr).filter((x): x is number => x !== null);
      return {
        ...f, batchCount: mine.length, running: running ? { id: running.id, batch_no: running.batch_no, ageDays: running.ageDays, placed_qty: running.placed_qty, cost: running.cost } : null,
        lifetime: { profit: Math.round(profit), profitPerKg: kg > 0 ? profit / kg : null, avgFcr: fcrs.length ? fcrs.reduce((s, x) => s + x, 0) / fcrs.length : null },
      };
    });
  });
  r.post('/api/farms', async ({ body }) => {
    const d = farmSchema.parse(body);
    if (await get('SELECT 1 FROM farms WHERE name=?', d.name)) throw badRequest(`Farm "${d.name}" already exists`);
    return { id: (await run('INSERT INTO farms(name,farmer_name,farmer_account_id,phone,location,capacity,notes) VALUES(?,?,?,?,?,?,?)', d.name, d.farmerName, await resolveFarmer(d), d.phone, d.location, d.capacity, d.notes)).id };
  });
  r.put('/api/farms/:id', async ({ params, body }) => {
    const id = Number(params.id);
    if (!await get('SELECT 1 FROM farms WHERE id=?', id)) throw notFound('Farm not found');
    const d = farmSchema.partial().parse(body);
    if (d.name && await get('SELECT 1 FROM farms WHERE name=? AND id<>?', d.name, id)) throw badRequest(`Farm "${d.name}" already exists`);
    const farmer = d.farmerAccountId !== undefined || d.farmerName ? await resolveFarmer(d as any) : null;
    await run(`UPDATE farms SET name=COALESCE(?,name), farmer_name=COALESCE(?,farmer_name), farmer_account_id=COALESCE(?,farmer_account_id), phone=COALESCE(?,phone), location=COALESCE(?,location),
         capacity=COALESCE(?,capacity), notes=COALESCE(?,notes), active=COALESCE(?,active) WHERE id=?`,
      d.name, d.farmerName, farmer, d.phone, d.location, d.capacity, d.notes, d.active === undefined ? null : Number(d.active), id);
  });
}
