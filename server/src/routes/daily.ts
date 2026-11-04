import { z } from 'zod';
import { badRequest } from '../errors.ts';
import { importDailyWorkbook } from '../importer/daily.ts';
import { createFlock, dailyReport, flockDetail, saveDay, updateFlock } from '../services/daily.ts';
import type { Router } from '../http.ts';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date');
const count = z.coerce.number().min(0);

export function dailyRoutes(r: Router) {
  r.get('/api/daily', async ({ query }) => await dailyReport(query.get('date') ? isoDate.parse(query.get('date')) : undefined));
  r.get('/api/daily/flocks/:id', async ({ params }) => await flockDetail(Number(params.id)));

  r.post('/api/daily/flocks', async ({ body }) => {
    const d = z.object({
      name: z.string().trim().min(2, 'Choose the farm').max(80), placementDate: isoDate,
      placedQty: z.coerce.number().positive('Enter the chicks billed'), grossQty: z.coerce.number().positive('Enter the chicks counted'),
      notes: z.string().trim().max(300).nullable().optional(),
    }).parse(body);
    return await createFlock({ ...d, name: d.name.toUpperCase() });
  });

  r.patch('/api/daily/flocks/:id', async ({ params, body }) => {
    const d = z.object({
      status: z.enum(['running', 'closed']).optional(), placementDate: isoDate.optional(), placedQty: z.coerce.number().positive().optional(),
      grossQty: z.coerce.number().positive().optional(), notes: z.string().trim().max(300).nullable().optional(),
    }).parse(body);
    await updateFlock(Number(params.id), d);
  });

  r.put('/api/daily/flocks/:id/days/:date', async ({ params, body }) => {
    const d = z.object({
      mortality: count.default(0), saleQty: count.default(0), saleKg: count.default(0),
      feedIn: z.coerce.number().default(0), // negative when bags go back or move to another farm
      feedUsed: count.default(0), avgWeightG: count.nullable().default(null),
    }).parse(body);
    await saveDay(Number(params.id), isoDate.parse(params.date), d);
  });

  r.post('/api/import/daily-report', async ({ readRaw }) => {
    const buf = await readRaw();
    if (buf.length < 1000) throw badRequest('That file looks empty. Choose the daily report workbook (.xlsx).');
    return await importDailyWorkbook(buf);
  }, { admin: true, raw: true });
}
