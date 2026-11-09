// Updates the CMS from the Excel files — keeps everything already there.
//
//   node scripts/update-data.mjs "C:\path\ROOSTERS_FIELD_EDAKKARA_7.xlsx" "C:\path\ROOSTERS__FIELD_DAILY_REPORT.xlsx"
//
// Either file is optional (give just the journal workbook, or just the daily one — the daily one is
// recognised by "DAILY" in its file name). By default it updates the HOSTED database named in .env.local
// (the one the Vercel site uses). Add --local to update the file database server/data/roosters.db instead
// (the one `npm run dev` uses).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const local = args.includes('--local');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) { console.error('Usage: node scripts/update-data.mjs <journal.xlsx> [daily-report.xlsx] [--local]'); process.exit(1); }

const env = { ...process.env };
if (!local) {
  const f = path.join(root, '.env.local');
  if (!fs.existsSync(f)) { console.error('.env.local not found — run with --local, or create it with TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.'); process.exit(1); }
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  if (!env.TURSO_DATABASE_URL) { console.error('.env.local has no TURSO_DATABASE_URL.'); process.exit(1); }
  console.log('Updating the HOSTED database:', env.TURSO_DATABASE_URL);
} else { delete env.TURSO_DATABASE_URL; console.log('Updating the LOCAL file database (server/data/roosters.db)'); }

const cli = path.join(root, 'server', 'src', 'importer', 'cli.ts');
// journal first, daily reports after (daily sheets are matched to batches created by the journal)
const ordered = [...files.filter((x) => !/daily/i.test(path.basename(x))), ...files.filter((x) => /daily/i.test(path.basename(x)))];
for (const f of ordered) {
  const daily = /daily/i.test(path.basename(f));
  console.log(`\n=== ${daily ? 'Daily reports' : 'Journal'}: ${f}`);
  const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', cli, f, daily ? '--daily' : '--sync'], { cwd: path.join(root, 'server'), env, stdio: 'inherit' });
  if (r.status !== 0) { console.error('\nStopped — nothing further was run.'); process.exit(r.status ?? 1); }
}
console.log('\nAll done. Refresh the site (Ctrl+F5).');
