const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inr2Fmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,23,456 — Indian digit grouping. */
export function inr(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = decimals ? inr2Fmt.format(Math.abs(n)) : inrFmt.format(Math.abs(Math.round(n)));
  return `${n < 0 && Math.abs(n) >= (decimals ? 0.005 : 0.5) ? '−' : ''}₹${v}`;
}
/** Plain number with Indian grouping (no ₹). */
export function num(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}
/** ₹12.4 L / ₹1.2 Cr for tight spaces. */
export function inrShort(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const a = Math.abs(n), s = n < 0 ? '−' : '';
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(a >= 1e8 ? 1 : 2)} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(a >= 1e6 ? 1 : 2)} L`;
  if (a >= 1e3) return `${s}₹${(a / 1e3).toFixed(1)} K`;
  return `${s}₹${Math.round(a)}`;
}
export const pct = (n: number | null | undefined, d = 1) => (n === null || n === undefined ? '—' : `${n.toFixed(d)}%`);
export const fixed = (n: number | null | undefined, d = 2) => (n === null || n === undefined ? '—' : n.toFixed(d));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]}${withYear ? ' ' + y : ''}`;
}
export const fmtMonth = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(2, 4)}`;
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function addDaysISO(iso: string, n: number) {
  const t = new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000);
  return t.toISOString().slice(0, 10);
}
export const monthStartISO = (iso = todayISO()) => iso.slice(0, 8) + '01';
export const yearStartISO = (iso = todayISO()) => iso.slice(0, 4) + '-01-01';

/** Number from a form field string; empty → 0. */
export const toNum = (s: string | number | null | undefined) => {
  if (typeof s === 'number') return s;
  const n = Number(String(s ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
};

export const TYPE_LABELS: Record<string, string> = {
  opening: 'Opening balance', chicks: 'Chicks', feed: 'Feed', feed_return: 'Feed return / transfer', medicine: 'Medicine', sale: 'Sale',
  receipt: 'Receipt', payment: 'Payment', expense: 'Expense', integration: 'Integration', misc: 'Farm expense', transfer: 'Transfer',
  journal: 'Journal', close: 'Batch closed',
};
export const TYPE_TONE: Record<string, string> = {
  opening: 'gray', chicks: 'amber', feed: 'amber', feed_return: 'amber', medicine: 'purple', sale: 'green', receipt: 'green', payment: 'red',
  expense: 'red', integration: 'blue', misc: 'amber', transfer: 'gray', journal: 'gray', close: 'gray',
};

/** Balance in debit-positive form → a human label. Traders owe us when positive; suppliers/farmers are owed when negative. */
export function owes(bal: number): { text: string; tone: 'green' | 'red' | 'gray'; amount: number } {
  if (Math.abs(bal) < 0.5) return { text: 'Settled', tone: 'gray', amount: 0 };
  return bal > 0 ? { text: 'To receive', tone: 'green', amount: bal } : { text: 'To pay', tone: 'red', amount: -bal };
}

export function toCSV(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map((c) => { const s = c === null || c === undefined ? '' : String(c); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\r\n');
}
export function downloadCSV(name: string, rows: (string | number | null | undefined)[][]) {
  const blob = new Blob(['﻿' + toCSV(rows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
