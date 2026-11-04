import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(here, '..');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'rf-dev-secret-change-me',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'rooster123',
  tursoUrl: process.env.TURSO_DATABASE_URL || undefined,
  tursoToken: process.env.TURSO_AUTH_TOKEN || undefined,
  dbFile: process.env.DB_FILE ?? path.join(SERVER_ROOT, 'data', 'roosters.db'),
  backupDir: path.join(SERVER_ROOT, 'data', 'backups'),
  clientDist: path.resolve(SERVER_ROOT, '..', 'client', 'dist'),
  tokenTtlSeconds: 60 * 60 * 12,
};
