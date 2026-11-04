import fs from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Client, InValue, Transaction } from '@libsql/client';
import { config } from './config.ts';
import { SCHEMA } from './schema.ts';

/**
 * Database access. Talks to Turso (hosted SQLite) when TURSO_DATABASE_URL is set — this is what runs on Vercel —
 * and to a local SQLite file otherwise, so `npm run dev` keeps working with no account or internet.
 * The API is async; every helper must be awaited.
 */
const remote = !!config.tursoUrl;
if (!remote) fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
// Hosted: the lightweight HTTP client (no native code, ideal for serverless). Local: the full client, which can open a file.
export const client: Client = remote
  ? (await import('@libsql/client/web')).createClient({ url: config.tursoUrl!.replace(/^libsql:/, 'https:'), authToken: config.tursoToken })
  : (await import('@libsql/client')).createClient({ url: `file:${config.dbFile}` });

export type Row = Record<string, any>;
type Param = string | number | bigint | null | undefined | boolean;

const clean = (p: Param[]): InValue[] => p.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v)) as InValue[];

interface TxCtx { t: Transaction; depth: number }
const store = new AsyncLocalStorage<TxCtx>();

async function exec(sql: string, params: Param[]) {
  const ctx = store.getStore();
  return (ctx ? ctx.t : client).execute({ sql, args: clean(params) });
}
const toRows = (r: { columns: string[]; rows: ArrayLike<any>[] }): Row[] => r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]])));

export const all = async <T = Row>(sql: string, ...params: Param[]): Promise<T[]> => toRows(await exec(sql, params)) as T[];
export const get = async <T = Row>(sql: string, ...params: Param[]): Promise<T | undefined> => (await all<T>(sql, ...params))[0];
export const run = async (sql: string, ...params: Param[]) => {
  const r = await exec(sql, params);
  return { changes: Number(r.rowsAffected), id: Number(r.lastInsertRowid ?? 0) };
};

/** Runs fn inside a transaction (nested calls become savepoints). Rolls back on any throw. */
export async function tx<T>(fn: () => Promise<T> | T): Promise<T> {
  const cur = store.getStore();
  if (!cur) {
    const t = await client.transaction('write');
    try {
      const result = await store.run({ t, depth: 0 }, async () => fn());
      await t.commit();
      return result;
    } catch (e) {
      try { await t.rollback(); } catch { /* connection already gone */ }
      throw e;
    } finally {
      t.close();
    }
  }
  const name = `sp${++cur.depth}`;
  await cur.t.execute(`SAVEPOINT ${name}`);
  try {
    const result = await fn();
    await cur.t.execute(`RELEASE ${name}`);
    return result;
  } catch (e) {
    await cur.t.execute(`ROLLBACK TO ${name}`);
    await cur.t.execute(`RELEASE ${name}`);
    throw e;
  } finally {
    cur.depth--;
  }
}

let ready: Promise<void> | null = null;
/** Creates tables on first use. Safe to call on every request — it only runs once per process. */
export function initDb(): Promise<void> {
  ready ??= (async () => {
    if (!remote) await client.executeMultiple('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;');
    await client.executeMultiple(SCHEMA);
  })();
  return ready;
}

export async function getSetting(key: string, fallback = ''): Promise<string> {
  return (await get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key))?.value ?? fallback;
}
export async function setSetting(key: string, value: string) {
  await run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value);
}

/** Local-file mode only: copy the database next to the app before something destructive. Turso keeps its own point-in-time history, so remote returns null. */
export async function backupLocal(prefix: string): Promise<string | null> {
  if (remote) return null;
  fs.mkdirSync(config.backupDir, { recursive: true });
  const file = path.join(config.backupDir, `${prefix}-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.db`);
  if (fs.existsSync(file)) fs.rmSync(file);
  await client.execute(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  return file;
}

/** Every table as plain JSON — used for the "Download backup" button when the database is hosted. */
export async function dumpAll(): Promise<Record<string, Row[]>> {
  const tables = await all<{ name: string }>(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' ORDER BY name`);
  const out: Record<string, Row[]> = {};
  for (const t of tables) out[t.name] = t.name === 'users' ? (await all(`SELECT id,username,name,role,active,created_at FROM users`)) : await all(`SELECT * FROM "${t.name}"`);
  return out;
}
export const isRemote = remote;
