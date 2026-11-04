import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A throwaway database: these must never reach a real one, whatever the shell has set.
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-daily-'));
process.env.DB_FILE = path.join(dir, 'test.db');

const { client, get, run } = await import('../db.ts');
const { seed } = await import('../seed.ts');
const { dailyReport } = await import('./daily.ts');

const CUTOFF = '2026-03-10';
let voucherNo = 0;

async function post(account: 'sales' | 'wip', batch: number, date: string, source: string, e: { debit?: number; credit?: number; qty: number; weight?: number; category: string }) {
  const acc = (await get<{ id: number }>('SELECT id FROM accounts WHERE sys_key=?', account))!.id;
  const v = (await run('INSERT INTO vouchers(voucher_no,type,date,source) VALUES(?,?,?,?)', ++voucherNo, 'journal', date, source)).id;
  await run('INSERT INTO entries(voucher_id,date,account_id,batch_id,debit,credit,category,qty,weight) VALUES(?,?,?,?,?,?,?,?,?)', v, date, acc, batch, e.debit ?? 0, e.credit ?? 0, e.category, e.qty, e.weight ?? null);
}

async function addFlock(name: string, placed: string, days: Array<[string, number, number, number]>) {
  const id = (await run('INSERT INTO flocks(name,placement_date,placed_qty,gross_qty) VALUES(?,?,1000,1020)', name, placed)).id;
  for (const [date, sale_qty, sale_kg, feed_in] of days) await run('INSERT INTO flock_days(flock_id,date,sale_qty,sale_kg,feed_in) VALUES(?,?,?,?,?)', id, date, sale_qty, sale_kg, feed_in);
}
const check = async (name: string) => (await dailyReport()).flocks.find((f) => f.name === name)!.check;

before(async () => {
  await seed();
  const farm = (await run(`INSERT INTO farms(name) VALUES('TEST FARM')`)).id;
  const batch = (await run('INSERT INTO batches(farm_id,batch_no,placement_date,placed_qty) VALUES(?,1,?,1000)', farm, '2026-02-01')).id;
  await addFlock('TEST', '2026-02-01', [['2026-02-02', 0, 0, 20], ['2026-03-05', 500, 900, 0], ['2026-03-20', 300, 600, 0]]);
  await addFlock('TEST FARM', '2026-03-15', []); // same farm, placed after the accounts stop

  await post('wip', batch, '2026-02-02', 'import', { debit: 100, qty: 20, category: 'feed' });
  await post('sales', batch, '2026-03-05', 'import', { credit: 100, qty: 500, weight: 900, category: 'live' });
  await post('sales', batch, CUTOFF, 'import', { credit: 0.01, qty: 0, weight: 0, category: 'live' }); // sets the cutoff
  // A bill typed into the app after the last import, with no matching day in the daily report up to the cutoff.
  await post('sales', batch, '2026-03-25', 'app', { credit: 100, qty: 800, weight: 1600, category: 'live' });
});
after(async () => {
  client.close();
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* Windows can hold the file a moment longer; it's only a temp folder */ }
});

test('a bill entered after the cutoff is not a difference', async () => {
  const c = await check('TEST');
  assert.deepEqual(c.ledger, { birds: 500, kg: 900, bags: 20 });
  assert.deepEqual(c.daily, { birds: 500, kg: 900, bags: 20 });
  assert.deepEqual(c.differs, []);
});

test('a real difference before the cutoff is still reported', async () => {
  const before = await check('TEST');
  await run(`UPDATE flock_days SET sale_qty=450 WHERE date='2026-03-05'`);
  const c = await check('TEST');
  await run(`UPDATE flock_days SET sale_qty=500 WHERE date='2026-03-05'`);
  assert.deepEqual(before.differs, []);
  assert.deepEqual(c.differs, ['birds sold']);
});

test('a flock placed after the accounts stop is not flagged for having no batch', async () => {
  const c = await check('TEST FARM');
  assert.equal(c.ledger?.birds ?? 0, 0);
  assert.deepEqual(c.differs, []);
});
