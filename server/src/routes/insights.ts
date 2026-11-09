import { z } from 'zod';
import { all, backupLocal, dumpAll, get, getSetting, isRemote, run, setSetting } from '../db.ts';
import { config } from '../config.ts';
import { badRequest } from '../errors.ts';
import { HANDLED } from '../http.ts';
import type { Router } from '../http.ts';
import { dashboard } from '../services/dashboard.ts';
import { balanceSheet, incomeStatement, ledger, outstanding, trialBalance } from '../services/reports.ts';
import { cashbook, saveCount } from '../services/cashbook.ts';
import { DEFAULT_SETTINGS, feedTypes } from '../seed.ts';
import { listBatches } from '../services/batches.ts';
import fs from 'node:fs';
import path from 'node:path';
import { importWorkbook, syncWorkbook } from '../importer/excel.ts';

const d = (v: string | null) => v || undefined;

export function insightRoutes(r: Router) {
  r.get('/api/dashboard', async () => await dashboard());

  r.get('/api/reports/trial-balance', async ({ query }) => await trialBalance(d(query.get('from')), d(query.get('to'))));
  r.get('/api/reports/income-statement', async ({ query }) => await incomeStatement(d(query.get('from')), d(query.get('to'))));
  r.get('/api/reports/balance-sheet', async ({ query }) => await balanceSheet(d(query.get('asOf'))));
  r.get('/api/reports/ledger/:id', async ({ params, query }) => await ledger(Number(params.id), d(query.get('from')), d(query.get('to')), query.get('farmId') ? Number(query.get('farmId')) : undefined, query.get('batchId') ? Number(query.get('batchId')) : undefined));
  r.get('/api/reports/outstanding', async ({ query }) => await outstanding((query.get('categories') ?? 'trader,supplier,farmer').split(',')));
  r.get('/api/reports/batch-performance', async ({ query }) => {
    const rows = (await listBatches({ status: 'closed', from: d(query.get('from')), to: d(query.get('to')) })).filter((b) => b.soldKg > 0);
    return rows;
  });

  r.get('/api/cashbook', async ({ query }) => await cashbook(query.get('date') ?? new Date().toISOString().slice(0, 10)));
  r.put('/api/cashbook/count', async ({ body, user }) => {
    const x = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), denominations: z.record(z.coerce.number().min(0)), damage: z.coerce.number().min(0).default(0), note: z.string().max(300).nullable().optional() }).parse(body);
    return await saveCount(x.date, x.denominations, x.damage, x.note ?? null, user!.sub);
  });

  // ---- settings
  r.get('/api/settings', async () => {
    const rows = await all<{ key: string; value: string }>('SELECT key,value FROM settings');
    const out: Record<string, any> = { ...DEFAULT_SETTINGS };
    for (const x of rows) out[x.key] = x.value;
    out.feed_types = await feedTypes();
    delete out.next_bill_no;
    out.next_bill_no = await getSetting('next_bill_no', '1');
    return out;
  });
  r.put('/api/settings', async ({ body }) => {
    const allowed = Object.keys(DEFAULT_SETTINGS);
    const b = z.record(z.any()).parse(body);
    for (const [k, v] of Object.entries(b)) {
      if (!allowed.includes(k)) continue;
      await setSetting(k, k === 'feed_types' ? JSON.stringify((Array.isArray(v) ? v : String(v).split(',')).map((s: string) => s.trim().toUpperCase()).filter(Boolean)) : String(v ?? ''));
    }
  }, { admin: true });

  // ---- backup & import
  r.get('/api/system/backup', async ({ res }) => {
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
    if (isRemote) {
      const body = JSON.stringify(await dumpAll());
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="roosters-field-${stamp}.json"`, 'Content-Length': Buffer.byteLength(body) });
      res.end(body);
      return HANDLED;
    }
    const file = (await backupLocal('roosters'))!;
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="roosters-field-${stamp}.db"`, 'Content-Length': fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
    return HANDLED;
  }, { admin: true });

  r.post('/api/import/excel', async ({ readRaw, query, user }) => {
    const buf = await readRaw();
    if (buf.length < 1000) throw badRequest('That file looks empty. Choose the Rooster’s Field Excel workbook (.xlsx).');
    const replace = query.get('replace') === '1';
    const hasData = ((await get<{ n: number }>(`SELECT COUNT(*) n FROM vouchers`))?.n ?? 0) > 0;
    // Update: add what is new in the workbook, apply corrections, keep everything else.
    if (hasData && !replace && query.get('mode') === 'update') return { mode: 'update', ...(await syncWorkbook(buf, { userId: user!.sub })) };
    if (hasData && !replace) throw badRequest('There is already data in the system. Choose “Update” to add the new entries, or “Replace everything” to start over (a backup is taken first).');
    return await importWorkbook(buf, { replace, userId: user!.sub });
  }, { admin: true, raw: true });

  r.get('/api/system/stats', async () => ({
    vouchers: (await get<{ n: number }>('SELECT COUNT(*) n FROM vouchers'))!.n,
    entries: (await get<{ n: number }>('SELECT COUNT(*) n FROM entries'))!.n,
    farms: (await get<{ n: number }>('SELECT COUNT(*) n FROM farms'))!.n,
    batches: (await get<{ n: number }>('SELECT COUNT(*) n FROM batches'))!.n,
    accounts: (await get<{ n: number }>('SELECT COUNT(*) n FROM accounts'))!.n,
    firstDate: (await get<{ d: string | null }>('SELECT MIN(date) d FROM vouchers'))!.d,
    lastDate: (await get<{ d: string | null }>('SELECT MAX(date) d FROM vouchers'))!.d,
  }));
  void run;
}
