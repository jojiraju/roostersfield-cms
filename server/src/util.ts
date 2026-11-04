export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const num = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
};

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => isoDate(new Date());
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
export const addDays = (d: string, n: number) => {
  const t = new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000);
  return t.toISOString().slice(0, 10);
};
export const monthStart = (d: string) => d.slice(0, 7) + '-01';

/** Account categories and the statement type each belongs to. */
export const CATEGORY_TYPE = {
  cash: 'asset', bank: 'asset', trader: 'asset', wip: 'asset', fixed_asset: 'asset', other_asset: 'asset',
  supplier: 'liability', farmer: 'liability', loan: 'liability', other_liability: 'liability',
  equity: 'equity', income: 'income', cogs: 'expense', expense: 'expense',
} as const;
export type Category = keyof typeof CATEGORY_TYPE;
export const CATEGORIES = Object.keys(CATEGORY_TYPE) as Category[];
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
