import React, { useState } from 'react';
import { api, qs } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { Link, navigate, useParams, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/data';
import { fixed, fmtDate, inr, num, pct, TYPE_LABELS, TYPE_TONE, todayISO } from '../lib/format';
import type { BatchDetail as BD, VoucherRow } from '../lib/types';
import { DateInput, Alert, Badge, Button, Card, CardHead, Confirm, Empty, ErrorBox, Field, Input, Modal, PageHeader, PageLoading, PALETTE, Progress, Stat, StackBar, Table, Tabs } from '../components/ui';
import { useEntry } from '../components/EntryModal';

const COST_ROWS: Array<{ key: keyof BD['costs']; label: string; color: string; unit?: string }> = [
  { key: 'chicks', label: 'Chicks', color: PALETTE.amber, unit: 'birds' },
  { key: 'feed', label: 'Feed', color: PALETTE.green, unit: 'bags' },
  { key: 'feed_return', label: 'Feed returned / transferred', color: PALETTE.gray, unit: 'bags' },
  { key: 'medicine', label: 'Medicine & vaccines', color: PALETTE.purple },
  { key: 'integration', label: 'Integration (farmer)', color: PALETTE.blue },
  { key: 'misc', label: 'Other farm expenses', color: PALETTE.orange },
  { key: 'opening', label: 'Brought forward', color: PALETTE.teal },
];

export default function BatchDetail() {
  const { id } = useParams();
  const q = useQuery<BD>(['batch', id], () => api(`/batches/${id}`));
  const txq = useQuery<{ rows: VoucherRow[] }>(['vouchers', 'batch', id], () => api(`/vouchers${qs({ batchId: id, limit: 300 })}`));
  const settings = useSettings().data;
  const { user } = useAuth();
  const toast = useToast();
  const { open } = useEntry();
  const [tab, setTab] = useState<'overview' | 'sales' | 'entries'>('overview');
  const [closing, setClosing] = useState(false);
  const [reopen, setReopen] = useState(false);
  const b = q.data;
  useTitle(b ? `${b.farm_name} #${b.batch_no}` : 'Batch');
  if (q.error && !b) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!b) return <PageLoading />;

  const k = b.kpis;
  const running = b.status === 'running';
  const harvestDays = Number(settings?.harvest_alert_days || 33);
  const parts = COST_ROWS.map((r) => ({ name: r.label, value: b.costs[r.key].amount, color: r.color }));

  return (
    <>
      <div className="no-print mb-8"><Link to="/batches" className="small muted">← All batches</Link></div>
      <PageHeader
        title={<span className="row gap-8 wrap">{b.farm_name} <span className="muted">#{b.batch_no}</span> {running ? <Badge tone="green" dot>Running · Day {b.ageDays ?? 0}</Badge> : <Badge>Closed {fmtDate(b.closed_date)}</Badge>}{b.partial ? <Badge tone="amber">Partial history</Badge> : null}</span>}
        sub={`${b.farmer_name || 'Farmer not set'} · placed ${fmtDate(b.placement_date)} · ${num(b.placed_qty)} chicks`}>
        <Button icon="print" onClick={() => window.print()}>Print P&amp;L</Button>
        {running && <><Button icon="scale" onClick={() => navigate(`/sales/new?batch=${b.id}`)}>Sale bill</Button><Button icon="plus" onClick={() => open({ batchId: b.id })}>Add entry</Button><Button variant="dark" icon="lock" onClick={() => setClosing(true)}>Close batch</Button></>}
        {!running && user?.role === 'admin' && <Button icon="unlock" onClick={() => setReopen(true)}>Re-open</Button>}
      </PageHeader>

      {b.partial ? <div className="mb-16"><Alert tone="info">This batch started before the data in the system, so some earlier costs are summarised as “Brought forward” and per-bird KPIs may not be exact.</Alert></div> : null}
      {running && b.ageDays !== null && b.ageDays >= harvestDays && <div className="mb-16"><Alert>This flock is {b.ageDays} days old — it’s time to plan harvest.</Alert></div>}

      <div className="grid g4 kpi-grid">
        <Stat icon="coins" label="Total cost" value={inr(b.cost)} sub={k.costPerKg !== null ? `${inr(k.costPerKg, 2)} per kg` : 'No sales yet'} />
        <Stat icon="receipt" label="Sales" value={inr(b.salesAmount)} sub={`${num(b.soldBirds)} birds · ${num(b.soldKg)} kg`} />
        <Stat accent icon="trend" label={running ? 'Profit so far' : 'Profit'} value={inr(b.profit)} sub={k.profitPerKg !== null ? `${inr(k.profitPerKg, 2)} per kg · ${inr(k.profitPerBird, 2)} per bird` : '—'} />
        <Stat icon="bird" label="Average weight" value={k.avgWeight ? `${k.avgWeight.toFixed(2)} kg` : '—'} sub={`Mean age ${k.meanAge ? k.meanAge.toFixed(1) : '—'} days`} />
      </div>

      <Tabs value={tab} onChange={setTab} options={[{ value: 'overview', label: 'Overview' }, { value: 'sales', label: `Sales (${b.salesLines.length})` }, { value: 'entries', label: `All entries (${txq.data?.rows.length ?? '…'})` }]} />

      {tab === 'overview' && (
        <div className="grid g-main">
          <Card pad={false}>
            <CardHead title="Where the money went" icon="coins" />
            <div className="card-body">
              <StackBar parts={parts} />
              <div className="mt-16">
                {COST_ROWS.filter((r) => Math.abs(b.costs[r.key].amount) > 0.5).map((r) => (
                  <div className="stat-row" key={r.key}>
                    <span className="row gap-8"><i style={{ width: 10, height: 10, borderRadius: 3, background: r.color, display: 'inline-block' }} />{r.label}{r.unit && b.costs[r.key].qty ? <span className="muted small">· {num(b.costs[r.key].qty)} {r.unit}</span> : null}</span>
                    <b className="tnum">{inr(b.costs[r.key].amount)}</b>
                  </div>
                ))}
                <div className="stat-row" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}><b>Total</b><b className="tnum">{inr(b.cost)}</b></div>
              </div>
              {b.bySupplier.length > 0 && (<>
                <div className="label mt-16 mb-8">By supplier</div>
                {b.bySupplier.map((s, i) => <div className="stat-row" key={i}><span>{s.party || '—'} <span className="muted small">· {s.category}</span></span><b className="tnum">{inr(s.amount)}</b></div>)}
              </>)}
            </div>
          </Card>
          <Card pad={false}>
            <CardHead title="Performance" icon="chart" />
            <div className="card-body">
              <div className="stat-row"><span>FCR</span><b className="tnum">{fixed(k.fcr)}</b></div>
              <div className="stat-row"><span>Corrected FCR (at 2 kg)</span><b className="tnum">{fixed(k.cfcr)}</b></div>
              <div className="stat-row"><span>Livability</span><b className="tnum">{running ? '—' : pct(k.livability)}</b></div>
              <div className="stat-row"><span>Mortality</span><b className="tnum">{running ? '—' : pct(k.mortality)}</b></div>
              <div className="stat-row"><span>Feed used</span><b className="tnum">{num(b.feedBags)} bags</b></div>
              <div className="stat-row"><span>Cost per bird</span><b className="tnum">{k.costPerBird !== null ? inr(k.costPerBird, 2) : '—'}</b></div>
              <div className="stat-row"><span>Sale per bird</span><b className="tnum">{k.salePerBird !== null ? inr(k.salePerBird, 2) : '—'}</b></div>
              <div className="stat-row"><span>BPI</span><b className="tnum">{k.bpi !== null ? k.bpi.toFixed(0) : '—'}</b></div>
              {running && b.ageDays !== null && (<div className="mt-16"><div className="row between small muted mb-8"><span>Age</span><span>{b.ageDays} / {harvestDays + 2} days</span></div><Progress value={b.ageDays} max={harvestDays + 2} tone={b.ageDays >= harvestDays ? 'warn' : undefined} /></div>)}
            </div>
          </Card>
        </div>
      )}

      {tab === 'sales' && (
        <Card pad={false} flush>
          <Table rows={b.salesLines} rowKey={(s) => s.id} onRowClick={(s) => s.billNo && navigate(`/sales/${s.voucherId}`)}
            empty={<Empty title="No sales yet" icon="receipt">Bills for this batch will appear here.</Empty>}
            cols={[
              { key: 'date', header: 'Date', render: (s) => fmtDate(s.date) },
              { key: 'bill', header: 'Bill', render: (s) => (s.billNo ? `#${s.billNo}` : '—') },
              { key: 'trader', header: 'Trader', render: (s) => <>{s.trader || '—'}{s.category !== 'live' && <span className="sub">{s.category}</span>}</> },
              { key: 'birds', header: 'Birds', num: true, render: (s) => num(s.birds), hideSm: true },
              { key: 'kg', header: 'Kg', num: true, render: (s) => num(s.kg, 1) },
              { key: 'avg', header: 'Avg wt', num: true, render: (s) => (s.avgWeight ? s.avgWeight.toFixed(2) : '—'), hideSm: true },
              { key: 'rate', header: 'Rate', num: true, render: (s) => (s.rate ? inr(s.rate, 2) : '—'), hideSm: true },
              { key: 'amt', header: 'Amount', num: true, render: (s) => <b>{inr(s.amount)}</b> },
            ]} />
        </Card>
      )}

      {tab === 'entries' && (
        <Card pad={false} flush>
          <Table rows={txq.data?.rows ?? []} rowKey={(v) => v.id}
            empty={<Empty title="No entries" />}
            cols={[
              { key: 'date', header: 'Date', render: (v) => fmtDate(v.date) },
              { key: 'type', header: 'Type', render: (v) => <Badge tone={(TYPE_TONE[v.type] as any) || 'gray'}>{TYPE_LABELS[v.type] || v.type}</Badge> },
              { key: 'desc', header: 'Details', render: (v) => <>{v.description}{v.party_name && <span className="sub">{v.party_name}</span>}</> },
              { key: 'amt', header: 'Amount', num: true, render: (v) => inr(v.amount) },
            ]} />
        </Card>
      )}

      {/* Printable Farm P&L */}
      <div className="only-print">
        <PrintPnl b={b} company={settings?.company_name || "Rooster's Field"} />
      </div>

      {closing && <CloseDialog b={b} onClose={() => setClosing(false)} onDone={() => { invalidate(); toast('Batch closed'); }} />}
      {reopen && <Confirm title="Re-open this batch?" message="The cost-of-goods entry made when closing will be removed so you can add or change entries." confirmLabel="Re-open" onClose={() => setReopen(false)} onConfirm={async () => { await api(`/batches/${b.id}/reopen`, { method: 'POST' }); invalidate(); toast('Batch re-opened'); }} />}
    </>
  );
}

function CloseDialog({ b, onClose, onDone }: { b: BD; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(b.lastSale || todayISO());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const unsold = b.placed_qty ? b.placed_qty - b.soldBirds : 0;
  return (
    <Modal title="Close this batch" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={async () => {
      setBusy(true); setErr('');
      try { await api(`/batches/${b.id}/close`, { method: 'POST', body: { date } }); onDone(); onClose(); } catch (e) { setErr((e as Error).message); setBusy(false); }
    }}>Close batch</Button></>}>
      <p className="ink2 mb-16">Closing moves the full batch cost of <b>{inr(b.cost)}</b> into <i>cost of goods sold</i>, so profit shows in your reports. New feed or sales can’t be added afterwards (you can re-open it if needed).</p>
      {unsold > 50 && <div className="mb-16"><Alert>{num(unsold)} of {num(b.placed_qty)} placed birds haven’t been billed yet. Make sure every sale is entered first.</Alert></div>}
      {!b.salesAmount && <div className="mb-16"><Alert>No sales are recorded for this batch.</Alert></div>}
      <Field label="Closing date"><DateInput value={date} onChange={(v) => setDate(v)} /></Field>
      {err && <div className="form-error mt-12">{err}</div>}
    </Modal>
  );
}

function PrintPnl({ b, company }: { b: BD; company: string }) {
  const k = b.kpis;
  return (
    <div className="doc">
      <div className="doc-head"><img src="/logo.png" alt="" /><div><h2>{company}</h2><p>Farm P&amp;L report</p></div></div>
      <div className="meta">
        <div><span>Farm</span><b>{b.farm_name} #{b.batch_no}</b></div><div><span>Farmer</span><b>{b.farmer_name || '—'}</b></div>
        <div><span>Placed</span><b>{fmtDate(b.placement_date)} · {num(b.placed_qty)} chicks</b></div><div><span>Closed</span><b>{b.closed_date ? fmtDate(b.closed_date) : 'Running'}</b></div>
      </div>
      <h4>Costs</h4>
      <table><tbody>
        {COST_ROWS.filter((r) => Math.abs(b.costs[r.key].amount) > 0.5).map((r) => <tr key={r.key}><td className="l">{r.label}</td><td>{b.costs[r.key].qty ? num(b.costs[r.key].qty) : ''}</td><td>{inr(b.costs[r.key].amount)}</td></tr>)}
        <tr><td className="l"><b>Total cost</b></td><td></td><td><b>{inr(b.cost)}</b></td></tr>
      </tbody></table>
      <h4>Sales</h4>
      <table>
        <thead><tr><th className="l">Date</th><th className="l">Trader</th><th>Birds</th><th>Kg</th><th>Amount</th></tr></thead>
        <tbody>{b.salesLines.map((s) => <tr key={s.id}><td className="l">{fmtDate(s.date)}</td><td className="l">{s.trader}</td><td>{num(s.birds)}</td><td>{num(s.kg, 1)}</td><td>{inr(s.amount)}</td></tr>)}
          <tr><td className="l" colSpan={2}><b>Total</b></td><td><b>{num(b.soldBirds)}</b></td><td><b>{num(b.soldKg, 1)}</b></td><td><b>{inr(b.salesAmount)}</b></td></tr></tbody>
      </table>
      <h4>Result</h4>
      <table><tbody>
        <tr><td className="l">Profit</td><td><b>{inr(b.profit)}</b></td><td className="l">Profit / kg</td><td>{k.profitPerKg !== null ? inr(k.profitPerKg, 2) : '—'}</td></tr>
        <tr><td className="l">FCR</td><td>{fixed(k.fcr)}</td><td className="l">Corrected FCR</td><td>{fixed(k.cfcr)}</td></tr>
        <tr><td className="l">Average weight</td><td>{k.avgWeight ? k.avgWeight.toFixed(2) + ' kg' : '—'}</td><td className="l">Livability</td><td>{pct(k.livability)}</td></tr>
        <tr><td className="l">Cost / bird</td><td>{k.costPerBird !== null ? inr(k.costPerBird, 2) : '—'}</td><td className="l">Mean age</td><td>{k.meanAge ? k.meanAge.toFixed(1) : '—'} days</td></tr>
      </tbody></table>
    </div>
  );
}
