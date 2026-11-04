import React, { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { Link, navigate, useParams, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { downloadCSV, fixed, fmtDate, num, pct, toNum, todayISO } from '../lib/format';
import { Alert, Badge, Button, Card, CardHead, Combo, DateInput, Drawer, Empty, ErrorBox, Field, Icon, Legend, Modal, NumInput, PageHeader, PageLoading, PALETTE, SearchBox, Stat, Table, Tabs } from '../components/ui';

/* ───────────── Shapes returned by /api/daily ───────────── */
interface Check {
  farm: string | null; batchId: number | null; batchNo: number | null; batchStatus: string | null; placed: number | null;
  daily: { birds: number; kg: number; bags: number }; ledger: { birds: number; kg: number; bags: number } | null; differs: string[];
}
interface Flock {
  id: number; name: string; placement_date: string; placed_qty: number | null; gross_qty: number; status: 'running' | 'closed'; source: string; notes: string | null;
  age: number; mortalityOnDay: number; totalMortality: number; mortalityPct: number; sold: number; soldKg: number; avgSoldKg: number | null; balanceQty: number; soldOut: boolean;
  feedIn: number; feedUsed: number; feedStock: number; chartFeed: number; chartDiff: number; feedForBroast: number; feedForFull: number; balanceForBroast: number;
  feedAge: number | null; expectedWeightG: number | null; ageWeightG: number | null; ageDiff: number | null; feedNeed: number; lastEntry: string | null; lastWeighedG: number | null;
  enteredOnDay?: boolean; issues: string[]; check: Check;
}
interface Report { asOf: string; today: string; ledgerThrough: string | null; bagKg: number; flocks: Flock[] }
interface Day { date: string; mortality: number; sale_qty: number; sale_kg: number; feed_in: number; feed_used: number; avg_weight_g: number | null; source: string }
interface ChartPoint { day: number; date: string; live: number; stdFeedG: number; stdWeightG: number; stdFcr: number; stdBags: number; cumStdBags: number }
interface Detail extends Flock { days: Day[]; chart: ChartPoint[] }

const bags = (n: number) => (Number.isInteger(n) ? num(n) : num(n, 1));
const signed = (n: number | null, d = 0) => (n === null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${num(Math.abs(n), d)}`);

/* ───────────── Day entry ───────────── */
interface DayTarget { flockId?: number; date?: string; day?: Day }
function DayDrawer({ target, flocks, onClose }: { target: DayTarget; flocks: Array<{ id: number; name: string; placement_date: string }>; onClose: () => void }) {
  const toast = useToast();
  const d = target.day;
  const [flockId, setFlockId] = useState<number | ''>(target.flockId ?? '');
  const [date, setDate] = useState(target.date ?? todayISO());
  const str = (n: number | null | undefined) => (n ? String(n) : '');
  const [f, setF] = useState({ mortality: str(d?.mortality), feedUsed: str(d?.feed_used), feedIn: str(d?.feed_in), saleQty: str(d?.sale_qty), saleKg: str(d?.sale_kg), avgWeightG: str(d?.avg_weight_g) });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const save = async (clear = false) => {
    if (!flockId) { setErr('Choose the flock'); return; }
    if (!date) { setErr('Choose the date'); return; }
    setBusy(true); setErr('');
    try {
      const body = clear ? {} : { mortality: toNum(f.mortality), feedUsed: toNum(f.feedUsed), feedIn: toNum(f.feedIn), saleQty: toNum(f.saleQty), saleKg: toNum(f.saleKg), avgWeightG: f.avgWeightG ? toNum(f.avgWeightG) : null };
      await api(`/daily/flocks/${flockId}/days/${date}`, { method: 'PUT', body });
      invalidate(); toast(clear ? 'Entry removed' : 'Saved'); onClose();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Drawer title={d ? 'Edit day' : 'Add daily entry'} onClose={onClose} footer={
      <>
        {d && <Button variant="ghost" onClick={() => save(true)} disabled={busy}>Remove entry</Button>}
        <span className="grow" />
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={busy} onClick={() => save()}>Save</Button>
      </>
    }>
      <div className="col gap-16">
        <Field label="Flock"><Combo value={flockId} onChange={(v) => setFlockId(v === '' ? '' : Number(v))} placeholder="Choose the flock…" options={flocks.map((x) => ({ value: x.id, label: x.name, hint: `placed ${fmtDate(x.placement_date, false)}` }))} /></Field>
        <Field label="Date"><DateInput value={date} onChange={setDate} /></Field>
        <div className="grid g2">
          <Field label="Mortality" help="Birds"><NumInput value={f.mortality} onChange={set('mortality')} decimals={false} /></Field>
          <Field label="Feed taken" help="Bags"><NumInput value={f.feedUsed} onChange={set('feedUsed')} /></Field>
          <Field label="Feed received" help="Bags; use minus for bags sent back"><NumInput value={f.feedIn} onChange={set('feedIn')} /></Field>
          <Field label="Sample weight" help="Grams per bird, if weighed"><NumInput value={f.avgWeightG} onChange={set('avgWeightG')} /></Field>
          <Field label="Birds sold"><NumInput value={f.saleQty} onChange={set('saleQty')} decimals={false} /></Field>
          <Field label="Weight sold" help="Kg"><NumInput value={f.saleKg} onChange={set('saleKg')} /></Field>
        </div>
        {err && <div className="form-error">{err}</div>}
      </div>
    </Drawer>
  );
}

/* ───────────── New flock ───────────── */
function FlockModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const farms = useQuery<Array<{ id: number; name: string }>>(['farms', 'names'], () => api('/farms'));
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayISO());
  const [placed, setPlaced] = useState('');
  const [gross, setGross] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const suggested = placed ? Math.round(toNum(placed) * 1.02 * 100) / 100 : 0;
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api<{ id: number }>('/daily/flocks', { body: { name, placementDate: date, placedQty: toNum(placed), grossQty: gross ? toNum(gross) : suggested } });
      invalidate(); toast('Flock added'); onClose(); navigate(`/daily/${r.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Modal title="New flock" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Add flock</Button></>}>
      <div className="col gap-16">
        <Field label="Farm"><Combo value={name} onChange={(v) => setName(String(v))} placeholder="Choose the farm…" options={(farms.data ?? []).map((f) => ({ value: f.name, label: f.name }))} /></Field>
        <Field label="Placement date"><DateInput value={date} onChange={setDate} /></Field>
        <div className="grid g2">
          <Field label="Chicks billed"><NumInput value={placed} onChange={setPlaced} decimals={false} /></Field>
          <Field label="Chicks counted" help={suggested ? `Leave empty for ${num(suggested, 2)} (billed + 2%)` : 'Billed + 2% if left empty'}><NumInput value={gross} onChange={setGross} /></Field>
        </div>
        {err && <div className="form-error">{err}</div>}
      </div>
    </Modal>
  );
}

/* ───────────── Daily report page ───────────── */
type Tab = 'farms' | 'orders' | 'check' | 'finished';
export default function DailyReport() {
  useTitle('Daily report');
  const q = useQuery<Report>(['daily'], () => api('/daily'));
  const [tab, setTab] = useState<Tab>('farms');
  const [s, setS] = useState('');
  const [entry, setEntry] = useState<DayTarget | null>(null);
  const [newFlock, setNewFlock] = useState(false);
  const all = q.data?.flocks ?? [];
  const running = useMemo(() => all.filter((f) => f.status === 'running'), [all]);
  const growing = useMemo(() => running.filter((f) => !f.soldOut), [running]);
  const orders = useMemo(() => growing.filter((f) => f.feedNeed > 0).sort((a, b) => b.feedNeed - a.feedNeed), [growing]);
  const list = (rows: Flock[]) => rows.filter((f) => !s || f.name.toLowerCase().includes(s.toLowerCase()));

  if (q.error && !q.data) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageLoading />;
  const r = q.data;
  const open = (f: Flock) => navigate(`/daily/${f.id}`);
  const missing = growing.filter((f) => !f.enteredOnDay).length;
  const checks = all.filter((f) => f.issues.length || f.check.differs.length).length;

  const csv = () => downloadCSV(`daily-report-${r.asOf}.csv`, [
    ['Farm', 'Placed on', 'Chicks', 'Age', 'Mortality on day', 'Total mortality', 'Mortality %', 'Birds sold', 'Kg sold', 'Birds left', 'Feed taken', 'Feed in stock', 'Chart feed', 'Weight by feed (g)', 'Weight by age (g)', 'Age difference', 'Feed to order'],
    ...running.map((f) => [f.name, f.placement_date, f.gross_qty, f.age, f.mortalityOnDay, f.totalMortality, f.mortalityPct.toFixed(2), f.sold, f.soldKg, f.balanceQty.toFixed(0), f.feedUsed, f.feedStock, f.chartFeed.toFixed(1), f.expectedWeightG, f.ageWeightG, f.ageDiff, f.feedNeed.toFixed(1)]),
  ]);

  if (!all.length) {
    return (
      <>
        <PageHeader title="Daily report" sub="Mortality, feed and growth for every flock, day by day." />
        <Card><Empty title="No flocks yet" icon="egg">Import the daily report workbook under Settings, or add a flock.<div className="mt-12"><Button icon="plus" onClick={() => setNewFlock(true)}>New flock</Button></div></Empty></Card>
        {newFlock && <FlockModal onClose={() => setNewFlock(false)} />}
      </>
    );
  }

  return (
    <>
      <PageHeader title="Daily report" sub={<>Figures as of <b>{fmtDate(r.asOf)}</b>{r.asOf !== r.today ? ' (the last day with entries)' : ''}.</>}>
        <Button icon="download" onClick={csv}>Export</Button>
        <Button icon="egg" onClick={() => setNewFlock(true)}>New flock</Button>
        <Button variant="primary" icon="plus" onClick={() => setEntry({ date: r.today })}>Add entry</Button>
      </PageHeader>

      <div className="grid g4 mb-16">
        <Stat icon="barn" label="Flocks growing" value={num(growing.length)} sub={`${num(running.length - growing.length)} sold out, not closed yet`} />
        <Stat icon="bird" label="Birds on farms" value={num(growing.reduce((t, f) => t + f.balanceQty, 0))} sub="Growing flocks only" />
        <Stat icon="alert" label="Mortality on the day" value={num(running.reduce((t, f) => t + f.mortalityOnDay, 0))} tone="warn" sub={missing ? `${missing} ${missing === 1 ? 'flock' : 'flocks'} with no entry` : 'All flocks entered'} />
        <Stat icon="wheat" label="Feed to order" value={`${num(orders.reduce((t, f) => t + f.feedNeed, 0))} bags`} sub={`${orders.length} ${orders.length === 1 ? 'flock' : 'flocks'}, next 5 days`} />
      </div>

      <div className="row wrap between">
        <Tabs value={tab} onChange={setTab} options={[{ value: 'farms', label: 'Farm base' }, { value: 'orders', label: `Feed orders (${orders.length})` }, { value: 'check', label: `Check (${checks})` }, { value: 'finished', label: 'Finished flocks' }]} />
        <SearchBox value={s} onChange={setS} placeholder="Search farm…" />
      </div>

      {tab === 'farms' && (
        <Card pad={false} flush>
          <Table rows={list(running)} rowKey={(f) => f.id} onRowClick={open} defaultSort={{ key: 'age', dir: -1 }} empty={<Empty title="No running flocks" icon="egg" />}
            cols={[
              { key: 'farm', header: 'Farm', sort: (f) => f.name, render: (f) => <><b>{f.name}</b><span className="sub">{f.soldOut ? 'Sold out' : `${num(f.gross_qty)} placed ${fmtDate(f.placement_date, false)}`}</span></> },
              { key: 'age', header: 'Age', num: true, sort: (f) => f.age, render: (f) => f.age },
              { key: 'live', header: 'Birds left', num: true, sort: (f) => f.balanceQty, render: (f) => num(f.balanceQty), hideSm: true },
              { key: 'day', header: 'Deaths', num: true, sort: (f) => f.mortalityOnDay, render: (f) => (f.enteredOnDay ? num(f.mortalityOnDay) : <span className="muted" title={`Last entry ${fmtDate(f.lastEntry)}`}>—</span>) },
              { key: 'mort', header: 'Mortality', num: true, sort: (f) => f.mortalityPct, render: (f) => <>{pct(f.mortalityPct)}<span className="sub">{num(f.totalMortality)} birds</span></>, hideSm: true },
              { key: 'feed', header: 'Feed taken', num: true, sort: (f) => f.feedUsed, render: (f) => <>{bags(f.feedUsed)}<span className="sub">chart {num(f.chartFeed)}</span></>, hideSm: true },
              { key: 'stock', header: 'In stock', num: true, sort: (f) => f.feedStock, render: (f) => bags(f.feedStock) },
              { key: 'w', header: 'Weight (g)', num: true, sort: (f) => f.expectedWeightG ?? 0, render: (f) => <>{num(f.expectedWeightG)}<span className="sub">age {num(f.ageWeightG)}</span></>, hideSm: true },
              { key: 'diff', header: 'Days vs age', num: true, sort: (f) => f.ageDiff ?? 0, render: (f) => <Badge tone={f.ageDiff === null ? 'gray' : f.ageDiff >= 0 ? 'green' : f.ageDiff >= -2 ? 'amber' : 'red'}>{signed(f.ageDiff)}</Badge>, hideSm: true },
              { key: 'sold', header: 'Sold', num: true, sort: (f) => f.sold, render: (f) => <>{num(f.sold)}{f.avgSoldKg !== null && <span className="sub">{fixed(f.avgSoldKg)} kg avg</span>}</>, hideSm: true },
            ]} />
        </Card>
      )}

      {tab === 'orders' && (
        <Card pad={false} flush>
          <Table rows={list(orders)} rowKey={(f) => f.id} onRowClick={open} defaultSort={{ key: 'need', dir: -1 }} empty={<Empty title="Nothing to order" icon="wheat">Every growing flock has enough feed for the next five days.</Empty>}
            cols={[
              { key: 'farm', header: 'Farm', sort: (f) => f.name, render: (f) => <b>{f.name}</b> },
              { key: 'age', header: 'Age', num: true, sort: (f) => f.age, render: (f) => f.age },
              { key: 'live', header: 'Birds left', num: true, sort: (f) => f.balanceQty, render: (f) => num(f.balanceQty), hideSm: true },
              { key: 'in', header: 'Received', num: true, sort: (f) => f.feedIn, render: (f) => bags(f.feedIn), hideSm: true },
              { key: 'stock', header: 'In stock', num: true, sort: (f) => f.feedStock, render: (f) => bags(f.feedStock) },
              { key: 'need', header: 'Bags to order', num: true, sort: (f) => f.feedNeed, render: (f) => <b>{num(Math.ceil(f.feedNeed))}</b> },
            ]} />
        </Card>
      )}

      {tab === 'check' && <CheckTab flocks={list(all)} through={r.ledgerThrough} open={open} />}

      {tab === 'finished' && (
        <Card pad={false} flush>
          <Table rows={list(all.filter((f) => f.status === 'closed'))} rowKey={(f) => f.id} onRowClick={open} defaultSort={{ key: 'placed', dir: -1 }} empty={<Empty title="No finished flocks" icon="egg" />}
            cols={[
              { key: 'farm', header: 'Farm', sort: (f) => f.name, render: (f) => <b>{f.name}</b> },
              { key: 'placed', header: 'Placed', sort: (f) => f.placement_date, render: (f) => fmtDate(f.placement_date) },
              { key: 'qty', header: 'Chicks', num: true, sort: (f) => f.gross_qty, render: (f) => num(f.gross_qty), hideSm: true },
              { key: 'mort', header: 'Mortality', num: true, sort: (f) => f.mortalityPct, render: (f) => pct(f.mortalityPct) },
              { key: 'sold', header: 'Sold', num: true, sort: (f) => f.sold, render: (f) => num(f.sold) },
              { key: 'avg', header: 'Avg kg', num: true, sort: (f) => f.avgSoldKg ?? 0, render: (f) => fixed(f.avgSoldKg), hideSm: true },
              { key: 'feed', header: 'Feed taken', num: true, sort: (f) => f.feedUsed, render: (f) => bags(f.feedUsed), hideSm: true },
            ]} />
        </Card>
      )}

      {entry && <DayDrawer target={entry} flocks={running} onClose={() => setEntry(null)} />}
      {newFlock && <FlockModal onClose={() => setNewFlock(false)} />}
    </>
  );
}

/** Colour for an issue message: red = numbers that cannot be right, amber = missing data, blue = date problems. */
function issueTone(msg: string): 'red' | 'amber' | 'blue' {
  if (/more than the birds placed/i.test(msg)) return 'red';
  if (/no weight/i.test(msg)) return 'amber';
  return 'blue';
}

function CheckTab({ flocks, through, open }: { flocks: Flock[]; through: string | null; open: (f: Flock) => void }) {
  const issues = flocks.filter((f) => f.issues.length);
  const diffs = flocks.filter((f) => f.check.differs.length).sort((a, b) => (a.placement_date < b.placement_date ? 1 : -1));
  const cell = (daily: number, ledger: number | null | undefined, d = 0) => {
    const off = ledger === null || ledger === undefined || Math.abs(daily - ledger) >= (d ? 1 : 0.5);
    return <span className={off ? 'neg' : ''}>{num(daily, d)}<span className="sub">{num(ledger, d)}</span></span>;
  };
  return (
    <div className="col gap-16">
      <Card pad={false}>
        <CardHead title="Entries to correct" icon="alert" right={issues.length > 0 ? <Badge tone="red">{issues.length} flock{issues.length === 1 ? '' : 's'}</Badge> : undefined} />
        {issues.length === 0 ? <Empty title="No problems found" icon="check" /> : (
          <div className="card-body issue-list">
            {issues.map((f) => {
              const parts = f.issues.flatMap((s) => s.split(' · '));
              const tones = parts.map(issueTone);
              const worst = tones.includes('red') ? 'red' : tones.includes('amber') ? 'amber' : 'blue';
              return (
                <Link key={f.id} to={`/daily/${f.id}`} className="issue-row">
                  <span className={`issue-ico ${worst}`}><Icon name={worst === 'blue' ? 'calendar' : worst === 'amber' ? 'scale' : 'alert'} size={18} /></span>
                  <span className="issue-main">
                    <b>{f.name}</b>
                    <span className="issue-tags">
                      {parts.map((p, i) => <span key={i} className={`issue-tag ${tones[i]}`}>{p}</span>)}
                    </span>
                  </span>
                  <span className="issue-go"><Icon name="chevR" size={18} /></span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
      <Card pad={false} flush>
        <CardHead title="Daily report against the accounts" icon="scale" />
        <div className="card-body small muted" style={{ paddingTop: 0 }}>Top figure: daily report. Lower figure: accounts. Both count only days up to {fmtDate(through)}, the last date in the imported accounts. Bills entered in the app after that are left out, and flocks placed after that are not listed.</div>
        <Table rows={diffs} rowKey={(f) => f.id} onRowClick={open} empty={<Empty title="Everything agrees" icon="check" />}
          cols={[
            { key: 'farm', header: 'Flock', render: (f) => <><b>{f.name}</b><span className="sub">{fmtDate(f.placement_date)}{f.check.batchNo ? ` · batch #${f.check.batchNo}` : ''}</span></> },
            { key: 'placed', header: 'Chicks billed', num: true, render: (f) => cell(f.placed_qty ?? 0, f.check.placed) },
            { key: 'birds', header: 'Birds sold', num: true, render: (f) => cell(f.check.daily.birds, f.check.ledger?.birds) },
            { key: 'kg', header: 'Kg sold', num: true, render: (f) => cell(f.check.daily.kg, f.check.ledger?.kg, 1), hideSm: true },
            { key: 'bags', header: 'Feed bags', num: true, render: (f) => cell(f.check.daily.bags, f.check.ledger?.bags), hideSm: true },
            { key: 'note', header: 'Note', render: (f) => (f.check.ledger ? `${f.check.differs.length} to check` : f.check.differs[0]), hideSm: true },
          ]} />
      </Card>
    </div>
  );
}

/* ───────────── Feed line chart ───────────── */
function FeedChart({ flock }: { flock: Detail }) {
  const W = 720, H = 240, L = 46, R = 10, T = 12, B = 26;
  let used = 0;
  const end = Math.min(Math.max(flock.age, 7), flock.chart.length - 1);
  const actual: Array<[number, number]> = [];
  for (const p of flock.chart.slice(0, end + 1)) {
    if (p.day > flock.age) break;
    used += flock.days.filter((d) => d.date === p.date).reduce((s, d) => s + d.feed_used, 0);
    actual.push([p.day, used]);
  }
  const std = flock.chart.slice(0, end + 1).map((p): [number, number] => [p.day, p.cumStdBags]);
  const max = Math.max(1, ...std.map((p) => p[1]), ...actual.map((p) => p[1]));
  const x = (d: number) => L + (d / Math.max(end, 1)) * (W - L - R);
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const line = (pts: Array<[number, number]>) => pts.map(([a, b]) => `${x(a)},${y(b)}`).join(' ');
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label="Cumulative feed taken compared with the standard chart">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line className="grid-line" x1={L} x2={W - R} y1={y(max * t)} y2={y(max * t)} /><text x={L - 8} y={y(max * t) + 4} textAnchor="end">{Math.round(max * t)}</text></g>)}
        {Array.from({ length: Math.floor(end / 7) + 1 }, (_, i) => i * 7).map((d) => <text key={d} x={x(d)} y={H - 8} textAnchor="middle">{d}</text>)}
        <polyline points={line(std)} fill="none" stroke={PALETTE.gray} strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={line(actual)} fill="none" stroke={PALETTE.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Legend items={[{ name: 'Feed taken (bags)', color: PALETTE.orange }, { name: 'Standard chart', color: PALETTE.gray }]} />
    </>
  );
}

/* ───────────── Day-by-day table ───────────── */
/** Deaths at or above this share of the birds alive that morning are highlighted. */
const HIGH_DEATHS_SHARE = 0.005;
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dash = <span className="dbd-none">–</span>;
const orDash = (n: number, text: string) => (n ? text : dash);

interface DayRow extends Day { age: number; totalDeaths: number; birdsLeft: number; totalTaken: number; stock: number; chartBags: number | null; highDeaths: boolean }
interface WeekGroup { week: number; rows: DayRow[]; deaths: number; received: number; taken: number; sold: number; kg: number }

function buildWeeks(f: Detail): WeekGroup[] {
  const chart = new Map(f.chart.map((p) => [p.date, p.cumStdBags]));
  let totalDeaths = 0, gone = 0, totalTaken = 0, stock = 0;
  const weeks = new Map<number, WeekGroup>();
  for (const d of f.days) {
    const aliveBefore = f.gross_qty - gone;
    totalDeaths += d.mortality; gone += d.mortality + d.sale_qty; totalTaken += d.feed_used; stock += d.feed_in - d.feed_used;
    const age = Math.round((Date.parse(d.date) - Date.parse(f.placement_date)) / 86400000);
    const week = Math.floor(age / 7) + 1;
    let g = weeks.get(week);
    if (!g) { g = { week, rows: [], deaths: 0, received: 0, taken: 0, sold: 0, kg: 0 }; weeks.set(week, g); }
    g.rows.unshift({ ...d, age, totalDeaths, birdsLeft: f.gross_qty - gone, totalTaken, stock, chartBags: chart.get(d.date) ?? null, highDeaths: aliveBefore > 0 && d.mortality >= aliveBefore * HIGH_DEATHS_SHARE && d.mortality > 0 });
    g.deaths += d.mortality; g.received += d.feed_in; g.taken += d.feed_used; g.sold += d.sale_qty; g.kg += d.sale_kg;
  }
  return [...weeks.values()].sort((a, b) => b.week - a.week); // newest first
}

const avgKg = (qty: number, kg: number) => (qty > 0 && kg > 0 ? fixed(kg / qty) : null);

function ChartGap({ taken, chart }: { taken: number; chart: number | null }) {
  if (chart === null) return <span className="dbd-none" title="The standard chart ends at day 41">–</span>;
  const gap = taken - chart;
  const short = gap < 0 && Math.abs(gap) > chart * 0.1; // more than 10% behind the chart
  return <span className={short ? 'warn' : undefined} title={`${bags(taken)} bags taken, chart ${num(chart, 1)}`}>{signed(gap, Math.abs(gap) < 10 ? 1 : 0)}</span>;
}

function DayByDay({ flock: f, onEdit }: { flock: Detail; onEdit?: (d: Day) => void }) {
  const weeks = useMemo(() => buildWeeks(f), [f]);
  const newest = weeks[0]?.week;
  const [open, setOpen] = useState<Set<number> | 'all' | null>(null); // null = only the newest week
  const isOpen = (w: number) => (open === 'all' ? true : open === null ? w === newest : open.has(w));
  const toggle = (w: number) => {
    const cur = open === 'all' ? new Set(weeks.map((x) => x.week)) : open === null ? new Set(newest === undefined ? [] : [newest]) : new Set(open);
    if (cur.has(w)) cur.delete(w); else cur.add(w);
    setOpen(cur);
  };
  const allOpen = weeks.length > 0 && weeks.every((w) => isOpen(w.week));
  const today = todayISO();
  const csv = () => downloadCSV(`${f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-day-by-day.csv`, [
    ['Date', 'Day', 'Deaths', 'Total deaths', 'Birds left', 'Feed received', 'Feed taken', 'Total taken', 'Chart', 'Stock', 'Birds sold', 'Kg sold', 'Avg kg'],
    ...weeks.flatMap((w) => w.rows).sort((a, b) => (a.date < b.date ? -1 : 1)).map((d) => [d.date, d.age, d.mortality, d.totalDeaths, d.birdsLeft, d.feed_in, d.feed_used, d.totalTaken, d.chartBags === null ? '' : d.chartBags.toFixed(1), d.stock, d.sale_qty, d.sale_kg, avgKg(d.sale_qty, d.sale_kg)]),
  ]);

  return (
    <Card pad={false} flush>
      <CardHead title="Day by day" icon="calendar" right={weeks.length > 0 && (
        <div className="row gap-8 no-print">
          <Button size="sm" variant="ghost" onClick={() => setOpen(allOpen ? new Set() : 'all')}>{allOpen ? 'Collapse all' : 'Expand all'}</Button>
          <Button size="sm" icon="download" className="hide-sm" onClick={csv}>Export</Button>
        </div>
      )} />
      {weeks.length === 0 ? <Empty title="No entries yet" icon="calendar">Daily entries for this flock will appear here.</Empty> : (
        <>
          <div className="table-wrap dbd-wrap">
            <table className="dbd">
              <thead>
                <tr className="dbd-groups">
                  <th colSpan={2} className="dbd-sticky" />
                  {/* Fewer columns show on a phone, so each heading has a span for each width. */}
                  <th colSpan={3} className="dbd-group hide-sm">Birds</th>
                  <th className="dbd-group dbd-show-sm">Birds</th>
                  <th colSpan={5} className="dbd-group hide-sm">Feed (bags)</th>
                  <th colSpan={3} className="dbd-group dbd-show-sm">Feed (bags)</th>
                  <th colSpan={3} className="dbd-group hide-sm">Sales</th>
                  <th className="dbd-group dbd-show-sm">Sales</th>
                  {onEdit && <th className="hide-sm" />}
                </tr>
                <tr>
                  <th className="dbd-sticky">Date</th>
                  <th className="num">Day</th>
                  <th className="num dbd-start">Deaths</th>
                  <th className="num hide-sm">Total</th>
                  <th className="num hide-sm">Left</th>
                  <th className="num dbd-start">Received</th>
                  <th className="num">Taken</th>
                  <th className="num hide-sm">Total</th>
                  <th className="num hide-sm" title="Total taken compared with the standard chart">Vs chart</th>
                  <th className="num">Stock</th>
                  <th className="num dbd-start">Birds</th>
                  <th className="num hide-sm">Kg</th>
                  <th className="num hide-sm">Avg kg</th>
                  {onEdit && <th className="hide-sm" aria-label="Edit" />}
                </tr>
              </thead>
              {weeks.map((w) => {
                const expanded = isOpen(w.week);
                const last = w.rows[0], first = w.rows[w.rows.length - 1];
                return (
                  <tbody key={w.week}>
                    <tr className="dbd-week" onClick={() => toggle(w.week)}>
                      <td colSpan={2} className="dbd-sticky">
                        <button type="button" className="dbd-toggle" aria-expanded={expanded} onClick={(e) => { e.stopPropagation(); toggle(w.week); }}>
                          <Icon name="chevR" size={15} className={expanded ? 'dbd-chev on' : 'dbd-chev'} />
                          <b>Week {w.week}</b>
                          <span className="dbd-span">Day {first.age === last.age ? first.age : `${first.age}–${last.age}`}</span>
                        </button>
                      </td>
                      <td className="num dbd-start">{orDash(w.deaths, num(w.deaths))}</td>
                      <td className="num hide-sm">{num(last.totalDeaths)}</td>
                      <td className={`num hide-sm${last.birdsLeft < 0 ? ' neg' : ''}`}>{num(last.birdsLeft)}</td>
                      <td className="num dbd-start">{orDash(w.received, bags(w.received))}</td>
                      <td className="num">{orDash(w.taken, bags(w.taken))}</td>
                      <td className="num hide-sm">{bags(last.totalTaken)}</td>
                      <td className="num hide-sm"><ChartGap taken={last.totalTaken} chart={last.chartBags} /></td>
                      <td className={`num${last.stock < 0 ? ' neg' : ''}`}>{bags(last.stock)}</td>
                      <td className="num dbd-start">{orDash(w.sold, num(w.sold))}</td>
                      <td className="num hide-sm">{orDash(w.kg, num(w.kg, 1))}</td>
                      <td className="num hide-sm">{avgKg(w.sold, w.kg) ?? dash}</td>
                      {onEdit && <td className="hide-sm" />}
                    </tr>
                    {expanded && w.rows.map((d) => (
                      <tr key={d.date} className={onEdit ? 'dbd-day click' : 'dbd-day'} onClick={onEdit ? () => onEdit(d) : undefined}>
                        <td className="dbd-sticky">
                          <span className="dbd-date"><span className="dbd-dow">{WEEKDAY[new Date(`${d.date}T00:00:00Z`).getUTCDay()]}</span>{fmtDate(d.date, false)}</span>
                          {d.date > today && <Badge tone="red">Future</Badge>}
                        </td>
                        <td className="num dbd-age">{d.age}</td>
                        <td className="num dbd-start">{d.highDeaths ? <span className="dbd-alert" title={`${pct((d.mortality * 100) / (d.birdsLeft + d.mortality + d.sale_qty), 1)} of the birds alive that morning`}>{num(d.mortality)}</span> : orDash(d.mortality, num(d.mortality))}</td>
                        <td className="num hide-sm dbd-soft">{num(d.totalDeaths)}</td>
                        <td className={`num hide-sm${d.birdsLeft < 0 ? ' neg' : ' dbd-soft'}`}>{num(d.birdsLeft)}</td>
                        <td className={`num dbd-start${d.feed_in < 0 ? ' neg' : ''}`}>{orDash(d.feed_in, d.feed_in < 0 ? `−${bags(-d.feed_in)}` : bags(d.feed_in))}</td>
                        <td className="num">{orDash(d.feed_used, bags(d.feed_used))}</td>
                        <td className="num hide-sm dbd-soft">{bags(d.totalTaken)}</td>
                        <td className="num hide-sm"><ChartGap taken={d.totalTaken} chart={d.chartBags} /></td>
                        <td className={`num${d.stock < 0 ? ' neg' : ''}`}>{bags(d.stock)}</td>
                        <td className="num dbd-start">{orDash(d.sale_qty, num(d.sale_qty))}</td>
                        <td className="num hide-sm">{d.sale_qty && !d.sale_kg ? <span className="neg" title="Birds sold with no weight">Missing</span> : orDash(d.sale_kg, num(d.sale_kg, 1))}</td>
                        <td className="num hide-sm">{avgKg(d.sale_qty, d.sale_kg) ?? dash}</td>
                        {onEdit && <td className="hide-sm dbd-edit"><button type="button" className="icon-btn" aria-label={`Edit ${fmtDate(d.date, false)}`} title="Edit this day" onClick={(e) => { e.stopPropagation(); onEdit(d); }}><Icon name="edit" size={15} /></button></td>}
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
          <div className="dbd-note"><span className="dbd-alert">0</span> Deaths of 0.5% or more of the birds alive that morning. <span className="warn">Vs chart</span> turns amber when feed is over 10% behind; the chart ends at day 41.</div>
        </>
      )}
    </Card>
  );
}

/* ───────────── One flock ───────────── */
export function FlockDetail() {
  const { id } = useParams();
  const toast = useToast();
  const q = useQuery<Detail>(['daily', id], () => api(`/daily/flocks/${id}`));
  const [entry, setEntry] = useState<DayTarget | null>(null);
  useTitle(q.data?.name ?? 'Flock');
  if (q.error && !q.data) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageLoading />;
  const f = q.data;
  const setStatus = async (status: 'running' | 'closed') => {
    try { await api(`/daily/flocks/${f.id}`, { method: 'PATCH', body: { status } }); invalidate(); toast(status === 'closed' ? 'Flock closed' : 'Flock reopened'); }
    catch (e) { toast((e as Error).message, 'error'); }
  };

  return (
    <>
      <div className="small muted mb-8"><Link to="/daily">Daily report</Link> / {f.name}</div>
      <PageHeader title={<>{f.name} {f.status === 'closed' ? <Badge>Closed</Badge> : f.soldOut ? <Badge tone="orange">Sold out</Badge> : <Badge tone="green" dot>Day {f.age}</Badge>}</>}
        sub={<>Placed {fmtDate(f.placement_date)}: {num(f.placed_qty)} chicks billed, {num(f.gross_qty, f.gross_qty % 1 ? 2 : 0)} counted.{f.check.batchId && <> <Link to={`/batches/${f.check.batchId}`}>Batch #{f.check.batchNo} in the accounts</Link>.</>}</>}>
        {f.status === 'running'
          ? <Button icon="check" onClick={() => setStatus('closed')}>Close flock</Button>
          : <Button icon="unlock" onClick={() => setStatus('running')}>Reopen</Button>}
        {f.status === 'running' && <Button variant="primary" icon="plus" onClick={() => setEntry({ flockId: f.id, date: todayISO() })}>Add entry</Button>}
      </PageHeader>

      {f.issues.length > 0 && <div className="mb-16"><Alert><b>Entries to correct:</b> {f.issues.join(' · ')}</Alert></div>}

      <div className="grid g4 mb-16">
        <Stat icon="bird" label="Birds left" value={num(f.balanceQty)} sub={`${num(f.sold)} sold`} />
        <Stat icon="alert" label="Mortality" value={pct(f.mortalityPct, 2)} sub={`${num(f.totalMortality)} birds`} tone={f.mortalityPct > 8 ? 'neg' : undefined} />
        <Stat icon="wheat" label="Feed taken" value={`${bags(f.feedUsed)} bags`} sub={`Chart ${num(f.chartFeed)} · ${bags(f.feedStock)} in stock`} />
        <Stat icon="scale" label="Weight by feed" value={f.expectedWeightG ? `${num(f.expectedWeightG)} g` : '—'} sub={f.ageWeightG ? `${num(f.ageWeightG)} g by age · ${signed(f.ageDiff)} days` : `${signed(f.ageDiff)} days against age`} />
      </div>

      <div className="grid g2 mb-16">
        <Card pad={false}><CardHead title="Feed against the chart" icon="chart" /><div className="card-body"><FeedChart flock={f} /></div></Card>
        <Card pad={false}>
          <CardHead title="Feed plan" icon="wheat" />
          <div className="card-body">
            <div className="stat-row"><span>Total for broast size (day 27)</span><b className="tnum">{num(f.feedForBroast)} bags</b></div>
            <div className="stat-row"><span>Total for full size (day 35)</span><b className="tnum">{num(f.feedForFull)} bags</b></div>
            <div className="stat-row"><span>Left to feed for broast size</span><b className="tnum">{num(f.balanceForBroast)} bags</b></div>
            <div className="stat-row"><span>Received so far</span><b className="tnum">{bags(f.feedIn)} bags</b></div>
            <div className="stat-row"><span>To order for the next 5 days</span><b className="tnum">{f.soldOut || f.feedNeed <= 0 ? 'None' : `${num(Math.ceil(f.feedNeed))} bags`}</b></div>
            {f.lastWeighedG !== null && <div className="stat-row"><span>Last sample weight</span><b className="tnum">{num(f.lastWeighedG)} g</b></div>}
          </div>
        </Card>
      </div>

      <DayByDay flock={f} onEdit={f.status === 'running' ? (day) => setEntry({ flockId: f.id, date: day.date, day }) : undefined} />

      {entry && <DayDrawer target={entry} flocks={[f]} onClose={() => setEntry(null)} />}
    </>
  );
}
