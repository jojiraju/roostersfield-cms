import React, { useMemo, useState } from 'react';
import { api, qs } from '../lib/api';
import { useQuery } from '../lib/query';
import { navigate, useTitle } from '../lib/router';
import { downloadCSV, fixed, fmtDate, inr, inrShort, monthStartISO, num, pct, todayISO, yearStartISO } from '../lib/format';
import { Alert, Badge, Button, Card, DateInput, Donut, Empty, ErrorBox, Icon, PageLoading, PALETTE, Table } from '../components/ui';
import type { IconName } from '../components/ui';

type Tab = 'income' | 'balance' | 'trial' | 'outstanding' | 'batches';
const TABS: Array<{ id: Tab; label: string; icon: IconName; hint: string }> = [
  { id: 'income', label: 'Profit & Loss', icon: 'trend', hint: 'What you earned and spent' },
  { id: 'balance', label: 'Balance Sheet', icon: 'layers', hint: 'What you own and owe' },
  { id: 'trial', label: 'Trial Balance', icon: 'scale', hint: 'Every account, debit vs credit' },
  { id: 'outstanding', label: 'Outstanding', icon: 'users', hint: 'Dues from and to parties' },
  { id: 'batches', label: 'Batch performance', icon: 'egg', hint: 'FCR, livability, profit per kg' },
];
const SLICES = [PALETTE.green, PALETTE.orange, PALETTE.blue, PALETTE.purple, PALETTE.amber, PALETTE.teal, PALETTE.red, PALETTE.gray];

function Kpi({ icon, label, value, sub, tone, dark }: { icon: IconName; label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'pos' | 'neg' | 'warn'; dark?: boolean }) {
  return (
    <div className={`card kpi-pro ${dark ? 'dark' : ''} ${tone ? 'tone-' + tone : ''}`}>
      <div className="top"><div className="label"><span className="chip-icon"><Icon name={icon} /></span>{label}</div></div>
      <div className="value">{value}</div>
      <div className="foot">{sub}</div>
    </div>
  );
}

function Panel({ title, sub, icon, right, children, flush }: { title: React.ReactNode; sub?: string; icon?: IconName; right?: React.ReactNode; children: React.ReactNode; flush?: boolean }) {
  return (
    <div className="card" style={flush ? { overflow: 'hidden' } : undefined}>
      <div className="card-title">
        <div><h2 className="row gap-8">{icon && <Icon name={icon} size={18} />}{title}</h2>{sub && <div className="sub">{sub}</div>}</div>
        {right}
      </div>
      <div className={flush ? 'mt-12' : 'card-body-lg'}>{children}</div>
    </div>
  );
}

/** label + proportional bar + amount */
function BarRow({ label, value, max, color = PALETTE.green, onClick, sub }: { label: React.ReactNode; value: number; max: number; color?: string; onClick?: () => void; sub?: React.ReactNode }) {
  return (
    <div className="bar-row" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="bar-row-top"><span className="ellipsis">{label}{sub && <span className="muted small"> · {sub}</span>}</span><b className="tnum">{inr(value)}</b></div>
      <div className="bar-track"><i style={{ width: `${Math.max(2, Math.min(100, max ? (Math.abs(value) / max) * 100 : 0))}%`, background: color }} /></div>
    </div>
  );
}

const Row = ({ label, value, bold, tone, indent, onClick }: { label: React.ReactNode; value: React.ReactNode; bold?: boolean; tone?: string; indent?: boolean; onClick?: () => void }) => (
  <div className={`stmt-row ${bold ? 'bold' : ''} ${onClick ? 'click' : ''}`} style={{ paddingLeft: indent ? 14 : 0 }} onClick={onClick}><span>{label}</span><span className={`tnum ${tone || ''}`}>{value}</span></div>
);

export default function Reports() {
  useTitle('Reports');
  const [tab, setTab] = useState<Tab>('income');
  const [range, setRange] = useState<'month' | 'year' | 'all' | 'custom'>('year');
  const [from, setFrom] = useState(yearStartISO());
  const [to, setTo] = useState(todayISO());
  const pick = (r: typeof range) => { setRange(r); if (r === 'month') setFrom(monthStartISO()); if (r === 'year') setFrom(yearStartISO()); if (r === 'all') setFrom(''); if (r !== 'custom') setTo(todayISO()); };
  const f = range === 'all' ? '' : from;
  const needsRange = tab === 'income' || tab === 'trial' || tab === 'batches';
  const cur = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <div className="hero">
        <div><h1>Reports</h1><p>Profit, position, dues and how each batch performed.</p></div>
        <div className="page-actions"><Button icon="print" onClick={() => window.print()}>Print</Button></div>
      </div>

      <div className="rep-tabs no-print">
        {TABS.map((t) => (
          <button key={t.id} className={`rep-tab ${t.id === tab ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="ti"><Icon name={t.icon} /></span>
            <span><b>{t.label}</b><small>{t.hint}</small></span>
          </button>
        ))}
      </div>

      <div className="rep-bar no-print">
        {needsRange ? (
          <>
            <div className="seg">
              {([['month', 'This month'], ['year', 'This year'], ['all', 'All time'], ['custom', 'Custom']] as const).map(([k, l]) => <button key={k} className={range === k ? 'on' : ''} onClick={() => pick(k)}>{l}</button>)}
            </div>
            {range === 'custom' && <div className="row" style={{ gap: 8 }}><DateInput sm value={from} onChange={setFrom} style={{ width: 150 }} /><span className="muted">to</span><DateInput sm value={to} onChange={setTo} style={{ width: 150 }} /></div>}
          </>
        ) : <span className="small muted">{tab === 'balance' ? 'Position as of the date you choose.' : 'Live balances right now.'}</span>}
      </div>

      <div className="only-print"><h2>{cur.label}</h2><p className="small">{needsRange ? `${f ? fmtDate(f) + ' – ' : 'Up to '}${fmtDate(to)}` : ''}</p></div>
      {tab === 'income' && <Income from={f} to={to} />}
      {tab === 'balance' && <Balance />}
      {tab === 'trial' && <Trial from={f} to={to} />}
      {tab === 'outstanding' && <Outstanding />}
      {tab === 'batches' && <BatchPerf from={f} to={to} />}
    </>
  );
}

/* ───────────── Profit & Loss ───────────── */
function Income({ from, to }: { from: string; to: string }) {
  const q = useQuery<any>(['rep-income', from, to], () => api(`/reports/income-statement${qs({ from, to })}`));
  const d = q.data;
  if (q.error && !d) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!d) return <PageLoading />;
  const csv = () => downloadCSV('profit-and-loss.csv', [['Item', 'Amount'], ...d.sales.map((r: any) => [r.name, r.amount]), ['Total sales', d.totalSales], ...d.cogs.map((r: any) => [r.name, -r.amount]), ['Gross profit', d.grossProfit], ...d.expenses.map((r: any) => [r.name, -r.amount]), ['Net profit', d.netProfit]]);
  const netMargin = d.totalSales ? (d.netProfit / d.totalSales) * 100 : null;
  const top = d.expenses.slice(0, 7);
  const rest = d.expenses.slice(7).reduce((a: number, r: any) => a + r.amount, 0);
  const slices = [...top.map((r: any, i: number) => ({ name: r.name, value: r.amount, color: SLICES[i % SLICES.length] })), ...(rest > 0 ? [{ name: 'Others', value: rest, color: PALETTE.gray }] : [])];
  const flow = [
    { label: 'Sales', v: d.totalSales, c: PALETTE.green },
    { label: 'Cost of birds sold', v: d.totalCogs, c: PALETTE.amber },
    { label: 'Operating expenses', v: d.totalExpenses, c: PALETTE.orange },
    { label: d.netProfit >= 0 ? 'Net profit' : 'Net loss', v: Math.abs(d.netProfit), c: d.netProfit >= 0 ? PALETTE.teal : PALETTE.red },
  ];
  const fmax = Math.max(...flow.map((x) => x.v), 1);

  return (
    <>
      <div className="grid g4 kpi-grid">
        <Kpi dark icon="trend" label="Net profit" value={inr(d.netProfit)} sub={netMargin !== null ? `${netMargin.toFixed(1)}% net margin` : '—'} />
        <Kpi icon="receipt" label="Sales" value={inr(d.totalSales)} sub={`${inrShort(d.totalSales)} total income`} />
        <Kpi tone="pos" icon="coins" label="Gross profit" value={inr(d.grossProfit)} sub={d.grossMargin !== null ? `${d.grossMargin.toFixed(1)}% gross margin` : '—'} />
        <Kpi tone="warn" icon="wallet" label="Operating expenses" value={inr(d.totalExpenses)} sub={d.totalSales ? `${((d.totalExpenses / d.totalSales) * 100).toFixed(1)}% of sales` : '—'} />
      </div>

      <div className="dash">
        <div className="c7">
          <Panel title="Profit & Loss statement" sub={`${from ? fmtDate(from) : 'Beginning'} – ${fmtDate(to)}`} icon="file" right={<Button size="sm" icon="download" className="no-print" onClick={csv}>CSV</Button>}>
            <div className="stmt-head">Income</div>
            {d.sales.map((r: any) => <Row key={r.id} indent label={r.name} value={inr(r.amount)} />)}
            <Row bold label="Total sales" value={inr(d.totalSales)} />
            <div className="stmt-head">Cost of goods sold <span className="muted small">(batches closed in this period)</span></div>
            {d.cogs.length === 0 && <Row indent label="None" value="—" />}
            {d.cogs.map((r: any) => <Row key={r.id} indent label={r.name} value={inr(r.amount)} />)}
            <Row bold label="Gross profit" value={inr(d.grossProfit)} tone={d.grossProfit < 0 ? 'neg' : 'pos'} />
            <div className="stmt-head">Operating expenses</div>
            {d.expenses.map((r: any) => <Row key={r.id} indent label={r.name} value={inr(r.amount)} onClick={() => navigate(`/ledger/${r.id}`)} />)}
            <Row bold label="Total expenses" value={inr(d.totalExpenses)} />
            <div className="stmt-total"><span>Net profit</span><span className={`tnum ${d.netProfit < 0 ? 'neg' : 'pos'}`}>{inr(d.netProfit)}</span></div>
          </Panel>
        </div>
        <div className="c5 col" style={{ gap: 20 }}>
          <Panel title="Where the money goes" sub="From sales to profit" icon="chart">
            <div className="col" style={{ gap: 14 }}>{flow.map((x) => <BarRow key={x.label} label={x.label} value={x.v} max={fmax} color={x.c} />)}</div>
          </Panel>
          <Panel title="Expense mix" sub="Operating expenses by type" icon="layers">
            {slices.length === 0 ? <Empty title="No expenses" /> : (
              <div className="row" style={{ gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <Donut parts={slices} size={150} center={<div><div className="tiny muted">Total</div><b style={{ fontSize: 15 }}>{inrShort(d.totalExpenses)}</b></div>} />
                <div className="grow col" style={{ gap: 8, minWidth: 170 }}>
                  {slices.map((s) => <div key={s.name} className="row between small"><span className="row" style={{ gap: 8, minWidth: 0 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: 'none' }} /><span className="ellipsis">{s.name}</span></span><b className="tnum">{((s.value / d.totalExpenses) * 100).toFixed(0)}%</b></div>)}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

/* ───────────── Balance sheet ───────────── */
function Balance() {
  const [asOf, setAsOf] = useState(todayISO());
  const q = useQuery<any>(['rep-bs', asOf], () => api(`/reports/balance-sheet${qs({ asOf })}`));
  const d = q.data;
  if (q.error && !d) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!d) return <PageLoading />;
  const secMax = (secs: any[]) => Math.max(...secs.map((s) => Math.abs(s.total)), 1);
  const Sec = ({ s, max, color }: { s: any; max: number; color: string }) => (
    <div className="bs-sec">
      <div className="row between"><b>{s.title}</b><b className="tnum">{inr(s.total)}</b></div>
      <div className="bar-track" style={{ margin: '6px 0 8px' }}><i style={{ width: `${Math.max(2, (Math.abs(s.total) / max) * 100)}%`, background: color }} /></div>
      {s.rows.slice(0, 12).map((r: any, i: number) => <Row key={i} indent label={r.name} value={inr(r.amount)} onClick={r.id ? () => navigate(`/ledger/${r.id}`) : undefined} />)}
      {s.rows.length > 12 && <div className="tiny muted" style={{ paddingLeft: 14 }}>+ {s.rows.length - 12} more</div>}
    </div>
  );
  const aMax = secMax(d.assets), lMax = secMax([...d.liabilities, d.equity]);
  return (
    <>
      <div className="row no-print" style={{ marginBottom: 16, gap: 10 }}><span className="small muted">As of</span><DateInput sm value={asOf} onChange={(v) => v && setAsOf(v)} style={{ width: 160 }} /></div>
      {Math.abs(d.difference) > 1 && <div className="mb-16"><Alert>Assets and liabilities differ by {inr(Math.abs(d.difference))}. Check the Suspense account in Parties.</Alert></div>}
      <div className="grid g4 kpi-grid">
        <Kpi dark icon="layers" label="Total assets" value={inr(d.totalAssets)} sub="Everything you own" />
        <Kpi tone="neg" icon="arrowUp" label="Total liabilities" value={inr(d.totalLiabilities)} sub="Everything you owe" />
        <Kpi tone="pos" icon="coins" label="Owners’ equity" value={inr(d.totalEquity)} sub="Capital + profit to date" />
        <Kpi icon="scale" label="Check" value={Math.abs(d.difference) <= 1 ? 'Balanced ✓' : inr(d.difference)} sub="Assets = Liabilities + Equity" />
      </div>
      <div className="grid g2" style={{ marginTop: 20, alignItems: 'start' }}>
        <Panel title="Assets" icon="layers" sub="What the business owns">
          {d.assets.filter((s: any) => s.rows.length || s.total).map((s: any, i: number) => <Sec key={s.title} s={s} max={aMax} color={SLICES[i % SLICES.length]} />)}
          <div className="stmt-total"><span>Total assets</span><span className="tnum">{inr(d.totalAssets)}</span></div>
        </Panel>
        <Panel title="Liabilities & equity" icon="arrowUp" sub="What the business owes and the owners’ stake">
          {[...d.liabilities, d.equity].filter((s: any) => s.rows.length || s.total).map((s: any, i: number) => <Sec key={s.title} s={s} max={lMax} color={SLICES[(i + 2) % SLICES.length]} />)}
          <div className="stmt-total"><span>Total</span><span className="tnum">{inr(d.totalLiabilitiesAndEquity)}</span></div>
        </Panel>
      </div>
    </>
  );
}

/* ───────────── Trial balance ───────────── */
function Trial({ from, to }: { from: string; to: string }) {
  const q = useQuery<any>(['rep-tb', from, to], () => api(`/reports/trial-balance${qs({ from, to })}`));
  const d = q.data;
  if (q.error && !d) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!d) return <PageLoading />;
  const csv = () => downloadCSV('trial-balance.csv', [['Account', 'Type', 'Debit', 'Credit'], ...d.rows.map((r: any) => [r.name, r.category, r.debit, r.credit]), ['Total', '', d.totals.debit, d.totals.credit]]);
  const balanced = Math.abs(d.totals.debit - d.totals.credit) < 0.01;
  return (
    <>
      <div className="grid g3 kpi-grid">
        <Kpi icon="arrowDown" label="Total debits" value={inr(d.totals.debit)} sub={`${d.rows.length} accounts`} />
        <Kpi icon="arrowUp" label="Total credits" value={inr(d.totals.credit)} />
        <Kpi tone={balanced ? 'pos' : 'neg'} icon="scale" label="Status" value={balanced ? 'Balanced ✓' : 'Out of balance'} sub={balanced ? 'Debits equal credits' : `Difference ${inr(Math.abs(d.totals.debit - d.totals.credit))}`} />
      </div>
      <div style={{ marginTop: 20 }}>
        <Panel flush title="Trial balance" icon="scale" right={<Button size="sm" icon="download" className="no-print" onClick={csv}>CSV</Button>}>
          <Table rows={d.rows} rowKey={(r: any) => r.id} onRowClick={(r: any) => navigate(`/ledger/${r.id}`)} footer
            cols={[
              { key: 'n', header: 'Account', render: (r: any) => <><b>{r.name}</b>{r.children && r.children.map((c: any) => <span key={c.name} className="sub">↳ {c.name}: {inr(c.balance)}</span>)}</>, foot: 'Total' },
              { key: 'c', header: 'Type', hideSm: true, render: (r: any) => <Badge>{r.category.replace('_', ' ')}</Badge> },
              { key: 'd', header: 'Debit', num: true, render: (r: any) => (r.debit ? inr(r.debit) : <span className="muted">–</span>), foot: inr(d.totals.debit) },
              { key: 'cr', header: 'Credit', num: true, render: (r: any) => (r.credit ? inr(r.credit) : <span className="muted">–</span>), foot: inr(d.totals.credit) },
            ]} />
        </Panel>
      </div>
    </>
  );
}

/* ───────────── Outstanding ───────────── */
function Outstanding() {
  const [cat, setCat] = useState<'trader' | 'supplier' | 'farmer'>('trader');
  const q = useQuery<any>(['rep-out', cat], () => api(`/reports/outstanding${qs({ categories: cat })}`));
  const d = q.data;
  const rows: any[] = d?.rows ?? [];
  const total = cat === 'trader' ? d?.receivable : d?.payable;
  const max = useMemo(() => Math.max(...rows.map((r) => Math.abs(r.bal)), 1), [rows]);
  const col = cat === 'trader' ? PALETTE.green : PALETTE.red;
  const opts = [['trader', 'Traders owe us', 'arrowDown'], ['supplier', 'We owe suppliers', 'arrowUp'], ['farmer', 'We owe farmers', 'arrowUp']] as const;
  return (
    <>
      <div className="seg no-print" style={{ marginBottom: 16 }}>{opts.map(([k, l]) => <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{l}</button>)}</div>
      {!d ? <PageLoading /> : (
        <>
          <div className="grid g3 kpi-grid">
            <Kpi dark icon={cat === 'trader' ? 'arrowDown' : 'arrowUp'} label={cat === 'trader' ? 'Total receivable' : 'Total payable'} value={inr(total)} sub={`${rows.length} parties`} />
            <Kpi icon="users" label="Largest balance" value={rows[0] ? inr(Math.abs(rows[0].bal)) : '—'} sub={rows[0]?.name} />
            <Kpi icon="calendar" label="Average per party" value={rows.length ? inr((total || 0) / rows.length) : '—'} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Panel title={cat === 'trader' ? 'Who owes you' : 'Who you owe'} sub="Largest first — click a name to open the ledger" icon="users" flush>
              {rows.length === 0 ? <Empty title="Nothing outstanding" icon="check" /> : (
                <div style={{ padding: '0 24px 20px' }}>
                  {rows.map((r) => (
                    <div key={r.id} className="out-row" onClick={() => navigate(`/ledger/${r.id}`)}>
                      <span className="dot-lg">{r.name[0]}</span>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <div className="row between"><b className="ellipsis">{r.name}</b><b className="tnum" style={{ color: (cat === 'trader') === (r.bal > 0) ? col : 'var(--ink-2)' }}>{inr(Math.abs(r.bal))}{(cat === 'trader') === (r.bal < 0) && <span className="muted small"> advance</span>}</b></div>
                        <div className="bar-track" style={{ margin: '6px 0 4px' }}><i style={{ width: `${Math.max(2, (Math.abs(r.bal) / max) * 100)}%`, background: col }} /></div>
                        <div className="tiny muted">Last entry {fmtDate(r.last)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

/* ───────────── Batch performance ───────────── */
function BatchPerf({ from, to }: { from: string; to: string }) {
  const q = useQuery<any[]>(['rep-bp', from, to], () => api(`/reports/batch-performance${qs({ from, to })}`));
  if (q.error && !q.data) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageLoading />;
  const rows = q.data;
  const avg = (f: (b: any) => number | null) => { const v = rows.map(f).filter((x): x is number => x !== null && Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const totalProfit = rows.reduce((a, b) => a + b.profit, 0);
  const totalKg = rows.reduce((a, b) => a + b.soldKg, 0);
  const maxAbs = Math.max(...rows.map((b) => Math.abs(b.profit)), 1);
  const csv = () => downloadCSV('batch-performance.csv', [['Farm', 'Batch', 'Closed', 'Placed', 'Sold birds', 'Sold kg', 'Avg wt', 'FCR', 'CFCR', 'Livability %', 'Mean age', 'Cost/kg', 'Profit', 'Profit/kg'], ...rows.map((b) => [b.farm_name, b.batch_no, b.closed_date, b.placed_qty, b.soldBirds, b.soldKg, b.kpis.avgWeight, b.kpis.fcr, b.kpis.cfcr, b.kpis.livability, b.kpis.meanAge, b.kpis.costPerKg, b.profit, b.kpis.profitPerKg])]);
  const fcrTone = (v: number | null) => (v === null ? 'gray' : v <= 1.65 ? 'green' : v <= 1.8 ? 'amber' : 'red');
  return (
    <>
      <div className="grid g4 kpi-grid">
        <Kpi dark icon="trend" label="Total profit" value={inr(totalProfit)} sub={`${rows.length} closed batches`} />
        <Kpi icon="chart" label="Average FCR" value={fixed(avg((b) => b.kpis.fcr))} sub={`Corrected ${fixed(avg((b) => b.kpis.cfcr))}`} />
        <Kpi tone="pos" icon="bird" label="Average livability" value={pct(avg((b) => b.kpis.livability))} sub={`Avg weight ${fixed(avg((b) => b.kpis.avgWeight))} kg`} />
        <Kpi icon="coins" label="Profit per kg" value={totalKg ? inr(totalProfit / totalKg, 2) : '—'} sub={`${num(totalKg)} kg sold`} />
      </div>
      <div style={{ marginTop: 20 }}>
        <Panel flush title={`Closed batches (${rows.length})`} icon="egg" right={<Button size="sm" icon="download" className="no-print" onClick={csv}>CSV</Button>}>
          <Table rows={rows} rowKey={(b) => b.id} onRowClick={(b) => navigate(`/batches/${b.id}`)} empty={<Empty title="No closed batches in this period" icon="egg" />} defaultSort={{ key: 'p', dir: -1 }}
            cols={[
              { key: 'f', header: 'Batch', sort: (b) => b.farm_name, render: (b) => <><b>{b.farm_name} #{b.batch_no}</b><span className="sub">Closed {fmtDate(b.closed_date)}</span></> },
              { key: 'k', header: 'Sold kg', num: true, sort: (b) => b.soldKg, render: (b) => num(b.soldKg) },
              { key: 'w', header: 'Avg wt', num: true, hideSm: true, sort: (b) => b.kpis.avgWeight ?? 0, render: (b) => fixed(b.kpis.avgWeight) },
              { key: 'fcr', header: 'FCR', num: true, sort: (b) => b.kpis.fcr ?? 0, render: (b) => <Badge tone={fcrTone(b.kpis.fcr) as any}>{fixed(b.kpis.fcr)}</Badge> },
              { key: 'cf', header: 'CFCR', num: true, hideSm: true, sort: (b) => b.kpis.cfcr ?? 0, render: (b) => fixed(b.kpis.cfcr) },
              { key: 'l', header: 'Livability', num: true, hideSm: true, sort: (b) => b.kpis.livability ?? 0, render: (b) => pct(b.kpis.livability) },
              { key: 'ck', header: 'Cost/kg', num: true, hideSm: true, sort: (b) => b.kpis.costPerKg ?? 0, render: (b) => fixed(b.kpis.costPerKg) },
              { key: 'p', header: 'Profit', num: true, sort: (b) => b.profit, render: (b) => (
                <div style={{ minWidth: 130 }}>
                  <b className={b.profit < 0 ? 'neg' : 'pos'}>{inr(b.profit)}</b>
                  <div className="bar-track" style={{ height: 5, marginTop: 4 }}><i style={{ width: `${Math.max(3, (Math.abs(b.profit) / maxAbs) * 100)}%`, background: b.profit < 0 ? PALETTE.red : PALETTE.green }} /></div>
                </div>) },
              { key: 'pk', header: '₹/kg', num: true, sort: (b) => b.kpis.profitPerKg ?? 0, render: (b) => <b className={(b.kpis.profitPerKg ?? 0) < 0 ? 'neg' : ''}>{fixed(b.kpis.profitPerKg)}</b> },
            ]} />
        </Panel>
      </div>
    </>
  );
}
