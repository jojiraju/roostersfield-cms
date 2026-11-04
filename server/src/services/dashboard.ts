import { all, get, getSetting } from '../db.ts';
import { addDays, monthStart, round2, today } from '../util.ts';
import { listBatches } from './batches.ts';
import { outstanding } from './reports.ts';
import { sysAccountId } from '../seed.ts';

function monthsBack(n: number, from: string): string[] {
  const out: string[] = [];
  let y = Number(from.slice(0, 4)), m = Number(from.slice(5, 7));
  for (let i = 0; i < n; i++) { out.unshift(`${y}-${String(m).padStart(2, '0')}`); m--; if (m === 0) { m = 12; y--; } }
  return out;
}

export async function dashboard() {
  const t = today();
  const months = monthsBack(12, t);
  const since = months[0] + '-01';

  const liquid = await all<{ id: number; name: string; category: string; bal: number }>(
    `SELECT a.id,a.name,a.category,COALESCE(SUM(e.debit-e.credit),0) bal FROM accounts a LEFT JOIN entries e ON e.account_id=a.id
      WHERE a.category IN ('cash','bank') AND a.active=1 GROUP BY a.id ORDER BY (a.category='cash') DESC, a.name`);
  const cash = round2(liquid.filter((l) => l.category === 'cash').reduce((s, l) => s + l.bal, 0));
  const bank = round2(liquid.filter((l) => l.category === 'bank').reduce((s, l) => s + l.bal, 0));
  const traders = await outstanding(['trader']);
  const suppliers = await outstanding(['supplier']);
  const farmers = await outstanding(['farmer']);

  const salesId = await sysAccountId('sales');
  const monthlySales = await all<{ m: string; amount: number; kg: number; birds: number }>(
    `SELECT substr(date,1,7) m, SUM(credit-debit) amount,
            SUM(CASE WHEN credit>0 THEN COALESCE(weight,0) ELSE -COALESCE(weight,0) END) kg,
            SUM(CASE WHEN credit>0 THEN COALESCE(qty,0) ELSE -COALESCE(qty,0) END) birds
       FROM entries WHERE account_id=? AND date>=? GROUP BY m`, salesId, since);
  const monthlyPnl = await all<{ m: string; type: string; net: number }>(
    `SELECT substr(e.date,1,7) m, a.type, SUM(e.credit-e.debit) net FROM entries e JOIN accounts a ON a.id=e.account_id
      WHERE a.type IN ('income','expense') AND e.date>=? GROUP BY m, a.type`, since);
  const series = months.map((m) => {
    const s = monthlySales.find((x) => x.m === m);
    const profit = monthlyPnl.filter((x) => x.m === m).reduce((sum, x) => sum + x.net, 0);
    return { month: m, sales: round2(s?.amount ?? 0), kg: round2(s?.kg ?? 0), birds: s?.birds ?? 0, profit: round2(profit) };
  });

  const thisM = series[series.length - 1], lastM = series[series.length - 2];
  const ytdFrom = `${t.slice(0, 4)}-01-01`;
  const ytd = await all<{ type: string; category: string; net: number }>(
    `SELECT a.type, a.category, SUM(e.credit-e.debit) net FROM entries e JOIN accounts a ON a.id=e.account_id WHERE a.type IN ('income','expense') AND e.date>=? GROUP BY a.type, a.category`, ytdFrom);
  const ytdSales = ytd.filter((r) => r.type === 'income').reduce((s, r) => s + r.net, 0);
  const ytdCogs = ytd.filter((r) => r.category === 'cogs').reduce((s, r) => s - r.net, 0);
  const ytdNet = ytd.reduce((s, r) => s + r.net, 0);

  const batches = await listBatches();
  const running = batches.filter((b) => b.status === 'running');
  const alertDays = Number(await getSetting('harvest_alert_days', '33'));
  const closed = batches.filter((b) => b.status === 'closed' && b.soldKg > 0 && b.closed_date && b.closed_date >= addDays(t, -120));
  const avg = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };

  const recent = await all(
    `SELECT v.id, v.voucher_no, v.type, v.date, v.description, p.name AS party_name,
            (SELECT COALESCE(SUM(debit),0) FROM entries e WHERE e.voucher_id=v.id) AS amount
       FROM vouchers v LEFT JOIN accounts p ON p.id=v.party_id ORDER BY v.id DESC LIMIT 8`);

  const suspense = (await get<{ s: number | null }>('SELECT SUM(debit-credit) s FROM entries WHERE account_id=?', await sysAccountId('suspense')))?.s ?? 0;
  const lastCount = await get<{ date: string }>('SELECT date FROM cash_counts ORDER BY date DESC LIMIT 1');

  const alerts: { level: 'warn' | 'info'; text: string; href?: string }[] = [];
  for (const b of running) if (b.ageDays !== null && b.ageDays >= alertDays) alerts.push({ level: 'warn', text: `${b.farm_name} batch is ${b.ageDays} days old — harvest due`, href: `/batches/${b.id}` });
  if (Math.abs(suspense) > 1) alerts.push({ level: 'info', text: `Suspense balance of ₹${Math.round(suspense).toLocaleString('en-IN')} from imported entries needs review`, href: `/ledger/${await sysAccountId('suspense')}` });
  if (!lastCount || lastCount.date < addDays(t, -1)) alerts.push({ level: 'info', text: 'Cash was not counted yesterday — record today’s denomination count in Cash Book', href: '/cashbook' });

  return {
    today: t,
    liquid, cash, bank,
    receivables: traders.receivable, payablesSuppliers: suppliers.payable, payablesFarmers: farmers.payable,
    topDebtors: traders.rows.filter((r) => r.bal > 0).slice(0, 6),
    topCreditors: suppliers.rows.filter((r) => r.bal < 0).slice(0, 6).map((r) => ({ ...r, bal: -r.bal })),
    thisMonth: { month: thisM.month, sales: thisM.sales, kg: thisM.kg, birds: thisM.birds, prevSales: lastM.sales, prevKg: lastM.kg },
    ytd: { sales: round2(ytdSales), grossProfit: round2(ytdSales - ytdCogs), net: round2(ytdNet), from: ytdFrom },
    series,
    running: running.slice(0, 12).map((b) => ({ id: b.id, farm_name: b.farm_name, batch_no: b.batch_no, ageDays: b.ageDays, placed_qty: b.placed_qty, cost: b.cost, soldBirds: b.soldBirds, placement_date: b.placement_date })),
    runningCount: running.length, runningBirds: running.reduce((s, b) => s + (b.placed_qty ?? 0), 0),
    performance: { batches: closed.length, fcr: avg(closed.map((b) => b.kpis.fcr)), livability: avg(closed.map((b) => b.kpis.livability)), avgWeight: avg(closed.map((b) => b.kpis.avgWeight)), profitPerKg: avg(closed.map((b) => b.kpis.profitPerKg)) },
    recent, alerts, monthStart: monthStart(t),
  };
}
