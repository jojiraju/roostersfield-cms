import React from 'react';
import { api } from '../lib/api';
import { useQuery } from '../lib/query';
import { Link, navigate, useTitle } from '../lib/router';
import { useAuth } from '../lib/auth';
import { fixed, fmtDate, fmtMonth, inr, inrShort, num, pct, TYPE_LABELS, TYPE_TONE } from '../lib/format';
import { Alert, Badge, BarChart, Button, Empty, ErrorBox, Icon, Legend, PageLoading, PALETTE, Progress, Sparkline } from '../components/ui';
import type { IconName } from '../components/ui';
import { useEntry } from '../components/EntryModal';

function Kpi({ icon, label, value, foot, spark, tone, dark, onClick }: { icon: IconName; label: string; value: React.ReactNode; foot?: React.ReactNode; spark?: number[]; tone?: 'pos' | 'neg' | 'warn'; dark?: boolean; onClick?: () => void }) {
  return (
    <div className={`card kpi-pro ${dark ? 'dark' : ''} ${tone ? 'tone-' + tone : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="top">
        <div className="label"><span className="chip-icon"><Icon name={icon} /></span>{label}</div>
        {spark && <Sparkline values={spark} color={dark ? '#8fd19e' : PALETTE.green} />}
      </div>
      <div className="value">{value}</div>
      <div className="foot">{foot}</div>
    </div>
  );
}

function Title({ title, sub, icon, to, more = 'View all' }: { title: string; sub?: string; icon?: IconName; to?: string; more?: string }) {
  return (
    <div className="card-title">
      <div>
        <h2 className="row gap-8">{icon && <Icon name={icon} size={18} />}{title}</h2>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {to && <Link to={to} className="link-more">{more}<Icon name="chevR" /></Link>}
    </div>
  );
}

export default function Dashboard() {
  useTitle('Dashboard');
  const { user } = useAuth();
  const { open } = useEntry();
  const q = useQuery<any>(['dashboard'], () => api('/dashboard'));
  if (q.error && !q.data) return <ErrorBox error={q.error} retry={q.refetch} />;
  const d = q.data;
  if (!d) return <PageLoading />;

  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const delta = d.thisMonth.prevSales > 0 ? ((d.thisMonth.sales - d.thisMonth.prevSales) / d.thisMonth.prevSales) * 100 : null;
  const empty = d.runningCount === 0 && d.recent.length === 0 && d.series.every((s: any) => s.sales === 0);
  const due = d.alerts.filter((a: any) => a.level === 'warn');
  const info = d.alerts.filter((a: any) => a.level !== 'warn');
  const salesSpark = d.series.map((s: any) => s.sales);
  const payables = d.payablesSuppliers + d.payablesFarmers;
  const maxAge = 35;

  return (
    <>
      <div className="hero">
        <div>
          <h1>{hello}, {user?.name?.split(' ')[0]}</h1>
          <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · here’s how the farms and books look right now.</p>
        </div>
        <div className="page-actions">
          <Button icon="book" onClick={() => navigate('/reports')}>Reports</Button>
        </div>
      </div>

      {empty && (
        <div className="card onboard mb-16">
          <div className="l">
            <h2 style={{ fontSize: 22 }}>Let’s set up Rooster’s Field</h2>
            <p className="muted mt-4">Your books are empty. Bring in the Excel workbook or start fresh.</p>
            <ol>
              <li><span><b>Import your Excel workbook</b><br /><span className="muted small">Settings → Your data → Import from Excel. All entries, farms and batches come across.</span></span></li>
              <li><span><b>Check the dashboard</b><br /><span className="muted small">Running batches, dues and cash balances appear automatically.</span></span></li>
              <li><span><b>Start entering daily work</b><br /><span className="muted small">Use “New entry” for feed, medicine, payments and “New bill” for sales.</span></span></li>
            </ol>
            <div className="row mt-24"><Button variant="primary" size="lg" icon="upload" onClick={() => navigate('/settings')}>Import from Excel</Button><Button size="lg" icon="egg" onClick={() => open({ kind: 'batch' })}>Start a batch</Button></div>
          </div>
          <div className="r">
            <div className="row gap-12" style={{ gap: 12 }}><img src="/logo.png" alt="" width={56} height={56} style={{ borderRadius: '50%', background: '#fff' }} /><div><b style={{ fontSize: 17 }}>Rooster’s Field</b><div className="small" style={{ color: '#b9d0bd' }}>Embrace Nature, Nurture A Healthy Generation</div></div></div>
            <div className="mt-24 col" style={{ gap: 14, color: '#d6e6d9' }}>
              {['Batch-wise profit, FCR and livability', 'Trader bills with weighing and balances', 'Cash book, ledgers and balance sheet'].map((t) => <div key={t} className="row gap-8"><Icon name="check" size={18} />{t}</div>)}
            </div>
          </div>
        </div>
      )}

      {(due.length > 0 || info.length > 0) && (
        <div className="col gap-8 mb-16">
          {due.length > 0 && (
            <Alert tone="warn">
              <b>{due.length} {due.length === 1 ? 'batch is' : 'batches are'} ready for harvest</b>
              <div className="row wrap gap-8 mt-8">{due.map((a: any, i: number) => <Link key={i} to={a.href} className="chip">{a.text.replace(' FARM batch is ', ' · ').replace(' batch is ', ' · ').replace(' days old — harvest due', 'd')}</Link>)}</div>
            </Alert>
          )}
          {info.map((a: any, i: number) => <Alert key={i} tone="info">{a.href ? <Link to={a.href} className="strong">{a.text}</Link> : a.text}</Alert>)}
        </div>
      )}

      <div className="grid g4 kpi-grid">
        <Kpi dark icon="wallet" label="Cash & bank" value={inr(d.cash + d.bank)} foot={<span>Cash {inr(d.cash)} · Bank {inr(d.bank)}</span>} onClick={() => navigate('/cashbook')} />
        <Kpi icon="trend" label={`Sales · ${fmtMonth(d.thisMonth.month)}`} value={inr(d.thisMonth.sales)} spark={salesSpark}
          foot={<><span>{num(d.thisMonth.kg)} kg sold</span>{delta !== null && <span className={`pill ${delta >= 0 ? 'up' : 'down'}`}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% vs last month</span>}</>} />
        <Kpi tone="pos" icon="arrowDown" label="Traders owe you" value={inr(d.receivables)} foot={<span>{d.topDebtors.length > 0 ? `${d.topDebtors.length}+ parties outstanding` : 'All settled'}</span>} onClick={() => navigate('/reports')} />
        <Kpi tone="neg" icon="arrowUp" label="You owe" value={inr(payables)} foot={<span>Suppliers {inrShort(d.payablesSuppliers)} · Farmers {inrShort(d.payablesFarmers)}</span>} onClick={() => navigate('/reports')} />
      </div>

      <div className="dash">
        <div className="card c8">
          <Title title="Sales & profit" sub="Last 12 months" icon="chart" />
          <div className="card-body-lg">
            <div className="row between mb-8"><Legend items={[{ name: 'Sales', color: PALETTE.green }, { name: 'Profit', color: PALETTE.orange }]} /></div>
            <BarChart height={260}
              labels={d.series.map((s: any) => fmtMonth(s.month).split(' ')[0])}
              series={[{ name: 'Sales', color: PALETTE.green, values: d.series.map((s: any) => s.sales) }, { name: 'Profit', color: PALETTE.orange, values: d.series.map((s: any) => s.profit) }]}
              fmt={(v) => inr(v)} />
          </div>
          <div className="summary-strip">
            <div><small>Sales this year</small><b>{inr(d.ytd.sales)}</b></div>
            <div><small>Gross profit</small><b>{inr(d.ytd.grossProfit)}</b></div>
            <div><small>Net profit</small><b className={d.ytd.net < 0 ? 'neg' : 'pos'}>{inr(d.ytd.net)}</b></div>
          </div>
        </div>

        <div className="card c4">
          <Title title="Flock performance" sub={d.performance.batches ? `Average of last ${d.performance.batches} closed batches` : 'Closed batches appear here'} icon="bird" to="/reports" more="Reports" />
          <div className="card-body-lg">
            {d.performance.batches === 0 ? <Empty title="No closed batches yet" icon="egg" /> : (
              <div className="metric-grid">
                <div className="metric"><small>FCR</small><b>{fixed(d.performance.fcr)}</b></div>
                <div className="metric"><small>Livability</small><b>{pct(d.performance.livability)}</b></div>
                <div className="metric"><small>Avg weight</small><b>{d.performance.avgWeight ? `${d.performance.avgWeight.toFixed(2)} kg` : '—'}</b></div>
                <div className="metric"><small>Profit / kg</small><b className={(d.performance.profitPerKg ?? 0) < 0 ? 'neg' : 'pos'}>{d.performance.profitPerKg !== null ? inr(d.performance.profitPerKg, 2) : '—'}</b></div>
              </div>
            )}
            <div className="row between mt-16 small"><span className="muted">Birds currently growing</span><b className="tnum">{num(d.runningBirds)}</b></div>
            <div className="row between mt-8 small"><span className="muted">Running batches</span><b className="tnum">{d.runningCount}</b></div>
          </div>
        </div>

        <div className="card c8" style={{ overflow: 'hidden' }}>
          <Title title="Running batches" sub={`${d.runningCount} flocks on the farms`} icon="egg" to="/batches" />
          <div className="mt-12">
            {d.running.length === 0 ? <Empty title="No batches are running" icon="egg"><div className="mt-12"><Button variant="primary" icon="plus" onClick={() => open({ kind: 'batch' })}>Start a batch</Button></div></Empty> : (
              <>
                <div className="batch-row head"><span>Farm</span><span className="hide-sm2">Age</span><span className="hide-md">Chicks</span><span className="hide-md right">Spent</span><span className="right">Status</span></div>
                {d.running.map((b: any) => {
                  const age = b.ageDays ?? 0;
                  const dueNow = age >= 33;
                  return (
                    <div key={b.id} className="batch-row" onClick={() => navigate(`/batches/${b.id}`)}>
                      <div className="row gap-8" style={{ gap: 12, minWidth: 0 }}><span className="dot-lg"><Icon name="barn" /></span><div style={{ minWidth: 0 }}><div className="medium ellipsis">{b.farm_name}</div><div className="tiny muted">Batch #{b.batch_no} · {fmtDate(b.placement_date, false)}</div></div></div>
                      <div className="hide-sm2"><div className="row between tiny muted mb-4"><span>Day {age}</span><span>{maxAge}</span></div><Progress value={age} max={maxAge} tone={age >= maxAge ? 'alert' : dueNow ? 'warn' : undefined} /></div>
                      <div className="hide-md tnum">{num(b.placed_qty)}</div>
                      <div className="hide-md right tnum strong">{inr(b.cost)}</div>
                      <div className="right">{dueNow ? <Badge tone="orange">Harvest due</Badge> : <Badge tone="green" dot>Growing</Badge>}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="card c4">
          <Title title="Cash & bank" sub="Current balances" icon="wallet" to="/cashbook" more="Cash book" />
          <div className="card-body-lg">
            {d.liquid.length === 0 ? <Empty title="No accounts" /> : d.liquid.map((a: any) => (
              <div key={a.id} className="acct">
                <span className="dot-lg"><Icon name={a.category === 'cash' ? 'wallet' : 'database'} /></span>
                <div className="grow"><div className="medium ellipsis">{a.name}</div><div className="tiny muted">{a.category === 'cash' ? 'Cash in hand' : 'Bank account'}</div></div>
                <b className={`tnum ${a.bal < 0 ? 'neg' : ''}`}>{inr(a.bal)}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="card c4">
          <Title title="Who owes you" sub="Top outstanding traders" icon="arrowDown" to="/parties" />
          <div className="card-body-lg">
            {d.topDebtors.length === 0 ? <Empty title="All settled" icon="check" /> : d.topDebtors.map((r: any) => (
              <Link key={r.id} to={`/ledger/${r.id}`} className="acct">
                <span className="dot-lg">{r.name[0]}</span>
                <div className="grow"><div className="medium ellipsis">{r.name}</div><div className="tiny muted">Last entry {fmtDate(r.last)}</div></div>
                <b className="tnum pos">{inr(r.bal)}</b>
              </Link>
            ))}
          </div>
        </div>

        <div className="card c4">
          <Title title="You owe suppliers" sub="Biggest payables" icon="arrowUp" to="/parties" />
          <div className="card-body-lg">
            {d.topCreditors.length === 0 ? <Empty title="Nothing due" icon="check" /> : d.topCreditors.map((r: any) => (
              <Link key={r.id} to={`/ledger/${r.id}`} className="acct">
                <span className="dot-lg">{r.name[0]}</span>
                <div className="grow"><div className="medium ellipsis">{r.name}</div><div className="tiny muted">Last entry {fmtDate(r.last)}</div></div>
                <b className="tnum neg">{inr(r.bal)}</b>
              </Link>
            ))}
          </div>
        </div>

        <div className="card c4">
          <Title title="Latest activity" sub="Most recent entries" icon="list" to="/transactions" />
          <div className="card-body-lg">
            {d.recent.length === 0 ? <Empty title="No entries yet" /> : d.recent.map((v: any) => (
              <Link key={v.id} to={`/transactions?id=${v.id}`} className="acct">
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="medium ellipsis">{v.description}</div>
                  <div className="tiny muted row gap-6" style={{ gap: 6 }}><Badge tone={(TYPE_TONE[v.type] as any) || 'gray'}>{TYPE_LABELS[v.type] || v.type}</Badge>{fmtDate(v.date)}</div>
                </div>
                <b className="tnum">{inr(v.amount)}</b>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
