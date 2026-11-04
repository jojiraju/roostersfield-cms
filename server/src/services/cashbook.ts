import { all, get, run } from '../db.ts';
import { badRequest } from '../errors.ts';
import { round2 } from '../util.ts';

export async function cashbook(date: string) {
  const accounts = await all<{ id: number; name: string; category: string }>(
    `SELECT id,name,category FROM accounts WHERE category IN ('cash','bank') AND active=1 ORDER BY (category='cash') DESC, name`);
  const books = await Promise.all(accounts.map(async (a) => {
    const opening = (await get<{ s: number | null }>('SELECT SUM(debit-credit) s FROM entries WHERE account_id=? AND date < ?', a.id, date))?.s ?? 0;
    const lines = await all<{ id: number; voucher_id: number; voucher_no: number; description: string; debit: number; credit: number; counter: string | null }>(
      `SELECT e.id, e.voucher_id, v.voucher_no, v.description, e.debit, e.credit,
              (SELECT group_concat(DISTINCT a2.name) FROM entries e2 JOIN accounts a2 ON a2.id=e2.account_id
                WHERE e2.voucher_id=e.voucher_id AND e2.id<>e.id AND ((e.debit>0 AND e2.credit>0) OR (e.credit>0 AND e2.debit>0))) AS counter
         FROM entries e JOIN vouchers v ON v.id=e.voucher_id WHERE e.account_id=? AND e.date=? ORDER BY e.id`, a.id, date);
    const receipts = lines.filter((l) => l.debit > 0);
    const payments = lines.filter((l) => l.credit > 0);
    const rt = round2(receipts.reduce((s, l) => s + l.debit, 0));
    const pt = round2(payments.reduce((s, l) => s + l.credit, 0));
    return { ...a, opening: round2(opening), receipts, payments, totalReceipts: rt, totalPayments: pt, closing: round2(opening + rt - pt) };
  }));
  const count = await get<{ denominations: string; damage: number; total: number; note: string | null }>('SELECT denominations,damage,total,note FROM cash_counts WHERE date=?', date);
  return {
    date, books,
    count: count ? { denominations: JSON.parse(count.denominations), damage: count.damage, total: count.total, note: count.note } : null,
  };
}

export async function saveCount(date: string, denominations: Record<string, number>, damage: number, note: string | null, userId: number | null) {
  let total = damage;
  for (const [d, c] of Object.entries(denominations)) {
    const face = Number(d), n = Number(c);
    if (!Number.isFinite(face) || !Number.isFinite(n) || n < 0) throw badRequest('Invalid denomination count');
    total += face * n;
  }
  total = round2(total);
  await run(
    `INSERT INTO cash_counts(date,denominations,damage,total,note,updated_by,updated_at) VALUES(?,?,?,?,?,?,datetime('now'))
     ON CONFLICT(date) DO UPDATE SET denominations=excluded.denominations, damage=excluded.damage, total=excluded.total, note=excluded.note, updated_by=excluded.updated_by, updated_at=excluded.updated_at`,
    date, JSON.stringify(denominations), damage, total, note, userId);
  return { total };
}
