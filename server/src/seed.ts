import { STD_CHART } from './std-chart.ts';
import { all, get, getSetting, initDb, run, setSetting } from './db.ts';
import { config } from './config.ts';
import { hashPassword } from './security.ts';
import { CATEGORY_TYPE } from './util.ts';
import type { Category } from './util.ts';

export const DEFAULT_SETTINGS: Record<string, string> = {
  company_name: "Rooster's Field",
  company_place: 'Edakkara',
  tagline: 'Embrace Nature, Nurture A Healthy Generation',
  address: 'Near New Bus Stand, Edakkara',
  phones: '7356 219 684, 9447 630 989',
  gstin: '32BDQPJ9279N1ZM',
  feed_bag_kg: '50',
  integration_rate_per_kg: '6.5',
  integration_rate_per_bird_broast: '13',
  harvest_alert_days: '33',
  chick_extra_pct: '2',
  feed_types: JSON.stringify(['PRESTARTER', 'STARTER FEED', 'FINISHER']),
  next_bill_no: '1',
};

const SYSTEM_ACCOUNTS: { name: string; category: Category; sys: string }[] = [
  { name: 'FARM BATCH INVENTORY (WIP)', category: 'wip', sys: 'wip' },
  { name: 'SALES', category: 'income', sys: 'sales' },
  { name: 'COST OF GOODS SOLD', category: 'cogs', sys: 'cogs' },
  { name: 'SUSPENSE / IMPORT DIFFERENCES', category: 'other_asset', sys: 'suspense' },
  { name: 'CASH', category: 'cash', sys: 'cash' },
];

const STARTER_ACCOUNTS: { name: string; category: Category; subtype?: string }[] = [
  { name: 'BANK ACCOUNT', category: 'bank' },
  { name: "OWNER'S CAPITAL", category: 'equity' },
  { name: 'DRAWINGS', category: 'equity' },
  { name: 'RENT', category: 'expense' },
  { name: 'SALARY', category: 'expense' },
  { name: 'PETROL', category: 'expense' },
  { name: 'TEA CASH', category: 'expense' },
  { name: 'ELECTRICITY (KSEB)', category: 'expense' },
  { name: 'INTEREST', category: 'expense' },
  { name: 'STATIONERY', category: 'expense' },
  { name: 'MISCELLANEOUS', category: 'expense' },
];

export async function addAccount(name: string, category: Category, opts: { subtype?: string | null; sys?: string | null } = {}) {
  const r = await run(
    'INSERT INTO accounts(name,type,category,subtype,sys_key) VALUES(?,?,?,?,?)',
    name.trim(), CATEGORY_TYPE[category], category, opts.subtype ?? null, opts.sys ?? null,
  );
  return r.id;
}

export async function seed() {
  await initDb();
  if (((await get<{ n: number }>('SELECT COUNT(*) n FROM std_chart'))?.n ?? 0) === 0) {
    for (const [day, feed, weight, fcr] of STD_CHART) await run('INSERT INTO std_chart(day,feed_g,weight_g,fcr) VALUES(?,?,?,?)', day, feed, weight, fcr);
  }
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    if (await get('SELECT 1 FROM settings WHERE key=?', k) === undefined) await setSetting(k, v);
  }
  for (const a of SYSTEM_ACCOUNTS) {
    if (!await get('SELECT 1 FROM accounts WHERE sys_key=?', a.sys)) await addAccount(a.name, a.category, { sys: a.sys });
  }
  const fresh = ((await get<{ n: number }>('SELECT COUNT(*) n FROM accounts'))?.n ?? 0) <= SYSTEM_ACCOUNTS.length;
  if (fresh) for (const a of STARTER_ACCOUNTS) await addAccount(a.name, a.category, { subtype: a.subtype });
  if (!await get('SELECT 1 FROM users LIMIT 1')) {
    await run('INSERT INTO users(username,name,password_hash,role) VALUES(?,?,?,?)', 'admin', 'Administrator', hashPassword(config.adminPassword), 'admin');
    console.log(`[seed] Created user "admin" with password "${config.adminPassword}" — change it in Settings after first login.`);
  }
}

export const sysAccountId = async (key: string): Promise<number> => {
  const r = await get<{ id: number }>('SELECT id FROM accounts WHERE sys_key=?', key);
  if (!r) throw new Error(`System account missing: ${key}`);
  return r.id;
};

export const feedTypes = async (): Promise<string[]> => {
  try { return JSON.parse(await getSetting('feed_types', '[]')); } catch { return []; }
};
export const listAccounts = async () => await all('SELECT * FROM accounts');
