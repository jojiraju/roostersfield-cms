import { z } from 'zod';
import { all } from '../db.ts';
import { badRequest } from '../errors.ts';
import type { Router } from '../http.ts';
import { batchDaily, dailyOverview, saveDaily, saveDailyBulk, stdChart } from '../services/daily.ts';
import { importDailyWorkbook } from '../importer/daily.ts';
import { today } from '../util.ts';

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-11-09');
const num = z.number().finite().nonnegative().nullable().optional();
const entry = z.object({ mortality: num, saleQty: num, saleWeight: num, feedIn: num, feedUsed: num, note: z.string().max(300).nullable().optional() });

export function dailyRoutes(r: Router) {
  r.get('/api/daily', async ({ query }) => {
    let d = query.get('date');
    if (!d) { // no day asked for: open on the latest day that most farms have reported (never later than today)
      const last = (await all<{ d: string | null }>(`SELECT MAX(date) d FROM (SELECT date FROM daily_logs WHERE date<=? GROUP BY date HAVING COUNT(*)>=5)`, today()))[0]?.d;
      d = last || today();
    }
    return dailyOverview(iso.parse(d));
  });
  r.get('/api/daily/batch/:id', async ({ params }) => batchDaily(Number(params.id)));
  r.get('/api/std-chart', async () => stdChart());
  r.get('/api/daily/batches', async () => all(`SELECT b.id, f.name farm, b.batch_no, b.status, b.placement_date FROM batches b JOIN farms f ON f.id=b.farm_id WHERE b.placement_date IS NOT NULL AND COALESCE(b.partial,0)=0 ORDER BY b.placement_date DESC LIMIT 200`));

  r.put('/api/daily/:batchId/:date', async ({ params, body, user }) => {
    await saveDaily(Number(params.batchId), iso.parse(params.date), entry.parse(body ?? {}), user!.sub);
    return { ok: true };
  });
  r.post('/api/daily/bulk', async ({ body, user }) => {
    const d = z.object({ date: iso, items: z.array(entry.extend({ batchId: z.number().int() })).max(300) }).parse(body);
    await saveDailyBulk(d.date, d.items, user!.sub);
    return { ok: true, saved: d.items.length };
  });
  r.post('/api/import/daily', async ({ readRaw, user }) => {
    const buf = await readRaw();
    if (buf.length < 1000) throw badRequest('That file looks empty. Choose the Daily Report workbook (.xlsx).');
    return await importDailyWorkbook(buf, { userId: user!.sub });
  }, { admin: true, raw: true });
}
