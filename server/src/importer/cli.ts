// Usage:  npm run import -- "C:\path\ROOSTERS_FIELD.xlsx" --replace
import fs from 'node:fs';
import { seed } from '../seed.ts';
import { importJournal } from './core.ts';
import { importWorkbook } from './excel.ts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const replace = args.includes('--replace');
if (!file) { console.error('Usage: npm run import -- <workbook.xlsx> [--replace]'); process.exit(1); }
await seed();
const started = Date.now();
let report;
if (file.endsWith('.json')) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  report = await importJournal(j.rows, j.tb ?? {}, { replace, userId: null });
} else {
  report = await importWorkbook(fs.readFileSync(file), { replace, userId: null });
}
console.log(JSON.stringify(report, null, 2));
console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
