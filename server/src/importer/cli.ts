// Usage:  npm run import -- "C:\path\ROOSTERS_FIELD.xlsx" --replace   (first load: wipes and rebuilds)
//         npm run import -- "C:\path\ROOSTERS_FIELD.xlsx" --sync      (later updates: adds new entries, keeps everything else)
import fs from 'node:fs';
import { seed } from '../seed.ts';
import { importJournal } from './core.ts';
import { importWorkbook, syncWorkbook } from './excel.ts';
import { syncJournal } from './sync.ts';
import { importDailySheets, importDailyWorkbook } from './daily.ts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const replace = args.includes('--replace');
const sync = args.includes('--sync');
const daily = args.includes('--daily');
if (!file) { console.error('Usage: npm run import -- <workbook.xlsx> [--replace | --sync | --daily]'); process.exit(1); }
await seed();
const started = Date.now();
let report;
if (daily) {
  report = file.endsWith('.json') ? await importDailySheets(JSON.parse(fs.readFileSync(file, 'utf8')), { userId: null }) : await importDailyWorkbook(fs.readFileSync(file), { userId: null });
} else if (sync) {
  if (file.endsWith('.json')) { const j = JSON.parse(fs.readFileSync(file, 'utf8')); report = await syncJournal(j.rows, j.tb ?? {}, { userId: null }); }
  else report = await syncWorkbook(fs.readFileSync(file), { userId: null });
} else if (file.endsWith('.json')) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  report = await importJournal(j.rows, j.tb ?? {}, { replace, userId: null });
} else {
  report = await importWorkbook(fs.readFileSync(file), { replace, userId: null });
}
console.log(JSON.stringify(report, null, 2));
console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
