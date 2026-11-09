# Rooster's Field — Farm Manager

A web app that replaces the `ROOSTERS_FIELD_EDAKKARA` Excel workbook for the poultry-integration business at Edakkara:
contract farms and batches, feed/chick/medicine issues, weighing bills to traders, farmer integration payouts,
cash book with denomination count, party ledgers, and reports (P&L, Balance Sheet, Trial Balance, Outstanding, Batch performance / FCR / livability).

Under the friendly forms it is a real double-entry ledger (debits always equal credits), so the books always tally.

## Stack
- **Frontend:** React 18 + Vite + TypeScript, hand-written design system (no UI-library dependency)
- **Backend:** Node.js (≥ 22.18, native TypeScript) with built-in SQLite (`node:sqlite`), zod validation, JWT login
- **Database:** a single file, `server/data/roosters.db` (created on first run) — easy to back up

## Run it
```bash
npm install
npm run dev          # API on :4000, app on http://localhost:5173
```
Sign in with **admin / rooster123** and change the password under *Settings*.

### Production (one process, one port)
```bash
npm run build
npm start            # http://localhost:4000 serves API + app
```
Copy `.env.example` to `.env` and set `JWT_SECRET`, `ADMIN_PASSWORD` and `PORT` before going live.

## Bring the Excel data in
*Settings → Your data → Import from Excel* and choose `ROOSTERS_FIELD_EDAKKARA_7.xlsx`
(or `npm run import -- path/to/file.xlsx [--replace]`). The importer reads the JOURNALS sheet, rebuilds
vouchers, detects farms and batches, and checks the result against the workbook trial balance.
Anything it can't classify goes to a *Suspense* account (shown on the dashboard) rather than being dropped.
Replacing existing data takes a backup first.

### Adding newer Excel data later (keeps everything already there)
*Settings → Your data → Update from Excel → "Add new entries"* and choose the newer workbook.
Only new entries are added, corrected amounts are applied (a backup is taken first), and entries that
are no longer in the workbook are kept, not deleted.
Then use *Import farm daily reports* with the `…DAILY_REPORT….xlsx` workbook (one sheet per farm) to fill the
**Daily reports** page. Sheets are matched to batches by farm name and placement date; days you edited in the app are kept.
Command line: `npm run import -- --sync file.xlsx` and `npm run import -- --daily file.xlsx` (inside `server/`).

## Daily use
- **New entry** (orange button): feed, chicks/new batch, medicine, feed return/transfer, integration, farm expense, receipt, payment, expense, cash⇄bank, journal.
- **New bill**: box-by-box weighing → live bill total → printable bill with the trader's running balance.
- **Close batch** moves the batch cost into cost-of-goods-sold so profit appears in reports; re-open is admin-only.
- **Cash book**: day view plus denomination count compared to the book.
- Entries created in the app can be edited; imported entries can be deleted (admin) or adjusted via journal.

## Project layout
```
server/   src/{routes,services,importer}  – API, business rules, Excel importer
client/   src/{pages,components,lib}      – React app
scripts/  dev.mjs                         – runs API + Vite together
```
Backups: *Settings → Back up → Download*, or copy `server/data/roosters.db`.

Poppins font is bundled under the SIL Open Font License.

---

## Deploying everything on Vercel (frontend + backend + database)

Vercel has no permanent disk, so online the data lives in **Turso** (hosted SQLite, free tier is plenty). Locally nothing changes — `npm run dev` still uses a file on your laptop.

How it fits together: Vercel serves the built React app as static files, and runs the API as one serverless function (`api/index.mjs`, built from `server/src`). `vercel.json` routes `/api/*` to that function.

### 1. Create the Turso database (one time)
```bash
# install the CLI: https://docs.turso.tech/cli/installation
turso auth login
turso db create roosters-field
turso db show roosters-field --url          # → TURSO_DATABASE_URL  (libsql://…)
turso db tokens create roosters-field       # → TURSO_AUTH_TOKEN
```

### 2. Load your existing data (recommended: import locally, then upload the file)
The Excel import makes thousands of small writes, which is fast on your laptop but slow over the internet. So:
```bash
npm install
npm run dev                                  # sign in → Settings → Import from Excel
# then in Settings → Backup, download the .db backup (or take server/data/backups/*.db)
turso db create roosters-field --from-file path/to/roosters-backup.db
```
(If you create the database first as in step 1, use a different name here, or `turso db destroy` the empty one.) Starting empty also works — the app creates its tables and the `admin` user on first request.

### 3. Push the project to GitHub and import it in Vercel
Leave all build settings at what `vercel.json` says (build `npm run build:vercel`, output `client/dist`). Under **Settings → Environment Variables** add:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | the `libsql://…` URL |
| `TURSO_AUTH_TOKEN` | the token |
| `JWT_SECRET` | a long random string (`openssl rand -hex 32`) |
| `ADMIN_PASSWORD` | first admin password (only used if the database has no users yet) |

Deploy. Open the Vercel URL and sign in.

### Notes
- After changing anything in `server/src`, run `npm run build:api -w server` and commit `api/index.mjs` (Vercel also rebuilds it during deploy).
- Excel upload from the browser is limited by Vercel to about 4.5 MB per request and 30 s per call — use the local import + upload route above for big workbooks.
- **Backup** in Settings downloads a JSON copy of all tables when the database is hosted. Turso also keeps point-in-time restore on paid plans; `turso db shell roosters-field .dump > backup.sql` takes a full SQL dump any time.
- Local development against Turso: copy `.env.example` to `.env.local`, then `node --env-file=.env.local server/src/index.ts`.
