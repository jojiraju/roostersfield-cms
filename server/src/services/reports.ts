import { all, get } from '../db.ts';
import { notFound } from '../errors.ts';
import { round2 } from '../util.ts';

const FAR_PAST = '0000-01-01';
const FAR_FUTURE = '9999-12-31';

export async function trialBalance(from = FAR_PAST, to = FAR_FUTURE) {
  const rows = await all<{ id: number; name: string; type: string; category: string; sys_key: string | null; debit: number; credit: number }>(
    `SELECT a.id,a.name,a.type,a.category,a.sys_key, COALESCE(SUM(e.debit),0) debit, COALESCE(SUM(e.credit),0) credit
       FROM accounts a JOIN entries e ON e.account_id=a.id AND e.date BETWEEN ? AND ?
      GROUP BY a.id ORDER BY a.type, a.category, a.name`, from, to);
  const wipFarms = await all<{ farm: string; debit: number; credit: number }>(
    `SELECT COALESCE(f.name,'(no farm)') farm, SUM(e.debit) debit, SUM(e.credit) credit
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' LEFT JOIN farms f ON f.id=e.farm_id
      WHERE e.date BETWEEN ? AND ? GROUP BY f.id ORDER BY f.name`, from, to);
  const out = rows.map((r) => ({
    ...r, debit: round2(r.debit), credit: round2(r.credit), balance: round2(r.debit - r.credit),
    children: r.sys_key === 'wip' ? wipFarms.map((w) => ({ name: w.farm, debit: round2(w.debit), credit: round2(w.credit), balance: round2(w.debit - w.credit) })).filter((c) => Math.abs(c.balance) > 0.004 || c.debit > 0) : undefined,
  }));
  const totals = out.reduce((s, r) => ({ debit: s.debit + r.debit, credit: s.credit + r.credit }), { debit: 0, credit: 0 });
  return { from, to, rows: out, totals: { debit: round2(totals.debit), credit: round2(totals.credit) } };
}

export async function incomeStatement(from = FAR_PAST, to = FAR_FUTURE) {
  const rows = await all<{ id: number; name: string; type: string; category: string; net: number }>(
    `SELECT a.id,a.name,a.type,a.category, SUM(e.credit-e.debit) net
       FROM accounts a JOIN entries e ON e.account_id=a.id AND e.date BETWEEN ? AND ?
      WHERE a.type IN ('income','expense') GROUP BY a.id ORDER BY a.name`, from, to);
  const sales = rows.filter((r) => r.type === 'income').map((r) => ({ id: r.id, name: r.name, amount: round2(r.net) }));
  const cogs = rows.filter((r) => r.category === 'cogs').map((r) => ({ id: r.id, name: r.name, amount: round2(-r.net) }));
  const expenses = rows.filter((r) => r.type === 'expense' && r.category !== 'cogs').map((r) => ({ id: r.id, name: r.name, amount: round2(-r.net) })).sort((a, b) => b.amount - a.amount);
  const sum = (a: { amount: number }[]) => round2(a.reduce((s, r) => s + r.amount, 0));
  const totalSales = sum(sales), totalCogs = sum(cogs), totalExpenses = sum(expenses);
  const grossProfit = round2(totalSales - totalCogs);
  return { from, to, sales, cogs, expenses, totalSales, totalCogs, grossProfit, totalExpenses, netProfit: round2(grossProfit - totalExpenses),
    grossMargin: totalSales ? (grossProfit / totalSales) * 100 : null };
}

export async function balanceSheet(asOf = FAR_FUTURE) {
  const bal = await all<{ id: number; name: string; type: string; category: string; sys_key: string | null; bal: number }>(
    `SELECT a.id,a.name,a.type,a.category,a.sys_key, SUM(e.debit-e.credit) bal
       FROM accounts a JOIN entries e ON e.account_id=a.id AND e.date <= ? GROUP BY a.id ORDER BY a.name`, asOf);
  const wipFarms = await all<{ farm: string; bal: number }>(
    `SELECT COALESCE(f.name,'(no farm)') farm, SUM(e.debit-e.credit) bal
       FROM entries e JOIN accounts a ON a.id=e.account_id AND a.sys_key='wip' LEFT JOIN farms f ON f.id=e.farm_id
      WHERE e.date <= ? GROUP BY f.id HAVING ABS(SUM(e.debit-e.credit)) > 0.004 ORDER BY bal DESC`, asOf);
  const pick = (cats: string[], sign: 1 | -1) => bal.filter((r) => cats.includes(r.category) && Math.abs(r.bal) > 0.004).map((r) => ({ id: r.id, name: r.name, amount: round2(sign * r.bal) })).sort((a, b) => b.amount - a.amount);
  const sec = (title: string, rows: { id?: number; name: string; amount: number }[]) => ({ title, rows, total: round2(rows.reduce((s, r) => s + r.amount, 0)) });
  const profit = round2(bal.filter((r) => r.type === 'income' || r.type === 'expense').reduce((s, r) => s - r.bal, 0));
  const wip = bal.find((r) => r.sys_key === 'wip');
  const assets = [
    sec('Cash & bank', pick(['cash', 'bank'], 1)),
    sec('Traders (receivable)', pick(['trader'], 1)),
    { ...sec('Farm batches in progress', wipFarms.map((w) => ({ name: w.farm, amount: round2(w.bal) }))), total: round2(wip?.bal ?? 0) },
    sec('Other current assets', pick(['other_asset'], 1)),
    sec('Fixed assets', pick(['fixed_asset'], 1)),
  ];
  const liabilities = [
    sec('Suppliers (payable)', pick(['supplier'], -1)),
    sec('Farmers (payable)', pick(['farmer'], -1)),
    sec('Loans & borrowings', pick(['loan'], -1)),
    sec('Other liabilities', pick(['other_liability'], -1)),
  ];
  const equity = sec('Owners’ equity', [...pick(['equity'], -1), { name: 'Profit to date', amount: profit }]);
  const totalAssets = round2(assets.reduce((s, x) => s + x.total, 0));
  const totalLiab = round2(liabilities.reduce((s, x) => s + x.total, 0));
  return { asOf, assets, liabilities, equity, totalAssets, totalLiabilities: totalLiab, totalEquity: equity.total, totalLiabilitiesAndEquity: round2(totalLiab + equity.total), difference: round2(totalAssets - totalLiab - equity.total) };
}

export async function ledger(accountId: number, from = FAR_PAST, to = FAR_FUTURE, farmId?: number, batchId?: number) {
  const acc = await get<{ id: number; name: string; category: string; type: string; sys_key: string | null }>('SELECT id,name,category,type,sys_key FROM accounts WHERE id=?', accountId);
  if (!acc) throw notFound('Account not found');
  const extra = (farmId ? ' AND e.farm_id = ?' : '') + (batchId ? ' AND e.batch_id = ?' : '');
  const extraArgs = [...(farmId ? [farmId] : []), ...(batchId ? [batchId] : [])];
  const opening = (await get<{ s: number | null }>(`SELECT SUM(e.debit-e.credit) s FROM entries e WHERE e.account_id=? AND e.date < ? ${extra}`, accountId, from, ...extraArgs))?.s ?? 0;
  const lines = await all<any>(
    `SELECT e.id, e.date, e.voucher_id, v.voucher_no, v.type, v.description, v.bill_no, e.debit, e.credit, e.category, e.item, e.qty, e.weight, e.rate, fm.name AS farm,
            (SELECT group_concat(DISTINCT a2.name) FROM entries e2 JOIN accounts a2 ON a2.id=e2.account_id
              WHERE e2.voucher_id=e.voucher_id AND e2.id<>e.id AND ((e.debit>0 AND e2.credit>0) OR (e.credit>0 AND e2.debit>0))) AS counter
       FROM entries e JOIN vouchers v ON v.id=e.voucher_id LEFT JOIN farms fm ON fm.id=e.farm_id
      WHERE e.account_id=? AND e.date BETWEEN ? AND ? ${extra}
      ORDER BY e.date, v.id, e.id`, accountId, from, to, ...extraArgs);
  let run = opening;
  const rows = lines.map((l) => { run += l.debit - l.credit; return { ...l, balance: round2(run) }; });
  const totals = rows.reduce((s, r) => ({ debit: s.debit + r.debit, credit: s.credit + r.credit }), { debit: 0, credit: 0 });
  return { account: acc, from, to, opening: round2(opening), rows, totals: { debit: round2(totals.debit), credit: round2(totals.credit) }, closing: round2(run) };
}

export async function outstanding(categories: string[]) {
  const ph = categories.map(() => '?').join(',');
  const rows = await all<{ id: number; name: string; category: string; phone: string | null; bal: number; last: string | null }>(
    `SELECT a.id,a.name,a.category,a.phone, SUM(e.debit-e.credit) bal, MAX(e.date) last
       FROM accounts a JOIN entries e ON e.account_id=a.id WHERE a.category IN (${ph}) GROUP BY a.id HAVING ABS(SUM(e.debit-e.credit)) > 0.5 ORDER BY ABS(bal) DESC`, ...categories);
  const receivable = round2(rows.filter((r) => r.bal > 0).reduce((s, r) => s + r.bal, 0));
  const payable = round2(rows.filter((r) => r.bal < 0).reduce((s, r) => s - r.bal, 0));
  return { rows: rows.map((r) => ({ ...r, bal: round2(r.bal) })), receivable, payable };
}
