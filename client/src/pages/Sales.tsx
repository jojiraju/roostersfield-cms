import React, { useMemo, useState } from 'react';
import { api, qs } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { Link, navigate, useLocation, useParams, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { batchLabel, useAccounts, useBatches, useSettings } from '../lib/data';
import { fmtDate, inr, monthStartISO, num, todayISO, toNum, yearStartISO } from '../lib/format';
import { DateInput, Alert, Badge, Button, Card, Combo, Confirm, Empty, ErrorBox, Field, Icon, Input, NumInput, PageHeader, PageLoading, SearchBox, Segmented, Stat, Table } from '../components/ui';
import type { ComboOption } from '../components/ui';

/* ───────────── List ───────────── */
export function SalesList() {
  useTitle('Sales bills');
  const [range, setRange] = useState<'month' | 'year' | 'all'>('month');
  const [text, setText] = useState('');
  const from = range === 'month' ? monthStartISO() : range === 'year' ? yearStartISO() : '';
  const q = useQuery<any>(['sales', from, text], () => api(`/sales${qs({ from, q: text })}`));
  return (
    <>
      <PageHeader title="Sales bills" sub="Weighing bills issued to traders.">
        <Button variant="primary" icon="plus" onClick={() => navigate('/sales/new')}>New bill</Button>
      </PageHeader>
      <div className="row wrap between mb-16">
        <Segmented value={range} onChange={setRange} options={[{ value: 'month', label: 'This month' }, { value: 'year', label: 'This year' }, { value: 'all', label: 'All time' }]} />
        <SearchBox value={text} onChange={setText} placeholder="Trader, farm or bill no…" />
      </div>
      {q.error && !q.data ? <ErrorBox error={q.error} retry={q.refetch} /> : !q.data ? <PageLoading /> : (
        <>
          <div className="grid g3 kpi-grid mb-16">
            <Stat small label="Bills" value={num(q.data.rows.length)} />
            <Stat small label="Live weight" value={`${num(q.data.totals.kg)} kg`} sub={`${num(q.data.totals.birds)} birds`} />
            <Stat small label="Sales value" value={inr(q.data.totals.amount)} />
          </div>
          <Card pad={false} flush>
            <Table rows={q.data.rows} rowKey={(r: any) => r.id} onRowClick={(r: any) => navigate(`/sales/${r.id}`)} empty={<Empty title="No bills found" icon="receipt" />}
              cols={[
                { key: 'bill', header: 'Bill', render: (r: any) => (r.bill_no ? <b>#{r.bill_no}</b> : <span className="muted">V{r.voucher_no}</span>) },
                { key: 'date', header: 'Date', render: (r: any) => fmtDate(r.date) },
                { key: 'trader', header: 'Trader', render: (r: any) => <>{r.trader}<span className="sub">{r.farm}{r.batch_no ? ` #${r.batch_no}` : ''}</span></> },
                { key: 'birds', header: 'Birds', num: true, hideSm: true, render: (r: any) => num(r.birds) },
                { key: 'kg', header: 'Kg', num: true, render: (r: any) => num(r.kg, 1) },
                { key: 'avg', header: 'Avg wt', num: true, hideSm: true, render: (r: any) => (r.avgWeight ? r.avgWeight.toFixed(2) : '—') },
                { key: 'rate', header: '₹/kg', num: true, hideSm: true, render: (r: any) => (r.rate ? r.rate.toFixed(2) : '—') },
                { key: 'amt', header: 'Amount', num: true, render: (r: any) => <b>{inr(r.amount)}</b> },
              ]} />
          </Card>
        </>
      )}
    </>
  );
}

/* ───────────── Bill form ───────────── */
interface Box { emptyBoxes: string; emptyWeight: string; loadedBoxes: string; loadedWeight: string }
const blankBox = (): Box => ({ emptyBoxes: '', emptyWeight: '', loadedBoxes: '', loadedWeight: '' });

export function BillForm() {
  const loc = useLocation();
  const editId = loc.search.get('edit');
  const presetBatch = loc.search.get('batch');
  useTitle(editId ? 'Edit bill' : 'New sale bill');
  const toast = useToast();
  const traders = useAccounts('trader').data ?? [];
  const liquid = (useAccounts().data ?? []).filter((a) => a.category === 'cash' || a.category === 'bank');
  const batches = useBatches().data ?? [];
  const next = useQuery<{ billNo: number }>(['next-bill'], () => api('/sales/next-bill-no'));
  const existing = useQuery<any>(['sale', editId], () => api(`/sales/${editId}`), { enabled: !!editId });

  const [f, setF] = useState({ date: todayISO(), traderId: '', batchId: presetBatch ?? '', billNo: '', vehicleNo: '', isBroast: false, birds: '', damageKg: '', rate: '', weakBirds: '', weakKg: '', weakRate: '', received: '', receivedAccountId: '', narration: '', grossKg: '' });
  const [boxes, setBoxes] = useState<Box[]>([blankBox(), blankBox(), blankBox()]);
  const [useBoxes, setUseBoxes] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (v: any) => setF((x) => ({ ...x, [k]: v }));

  // pre-fill when editing
  React.useEffect(() => {
    const p = existing.data?.meta?.payload;
    if (!p || loaded) return;
    setLoaded(true);
    const s = (v: any) => (v ? String(v) : '');
    setF({ date: p.date, traderId: s(p.traderId), batchId: s(p.batchId), billNo: s(existing.data.bill_no), vehicleNo: p.vehicleNo || '', isBroast: !!p.isBroast, birds: s(p.birds), damageKg: s(p.damageKg), rate: s(p.rate), weakBirds: s(p.weakBirds), weakKg: s(p.weakKg), weakRate: s(p.weakRate), received: '', receivedAccountId: '', narration: p.narration || '', grossKg: s(p.grossKg) });
    if (p.boxes?.length) setBoxes([...p.boxes.map((b: any) => ({ emptyBoxes: s(b.emptyBoxes), emptyWeight: s(b.emptyWeight), loadedBoxes: s(b.loadedBoxes), loadedWeight: s(b.loadedWeight) })), blankBox()]);
    else setUseBoxes(false);
  }, [existing.data, loaded]);

  const calc = useMemo(() => {
    const rows = useBoxes ? boxes : [];
    const emptyW = rows.reduce((a, b) => a + toNum(b.emptyWeight), 0);
    const loadedW = rows.reduce((a, b) => a + toNum(b.loadedWeight), 0);
    const eb = rows.reduce((a, b) => a + toNum(b.emptyBoxes), 0);
    const lb = rows.reduce((a, b) => a + toNum(b.loadedBoxes), 0);
    const gross = useBoxes ? loadedW - emptyW : toNum(f.grossKg);
    const net = gross - toNum(f.damageKg);
    const live = net * toNum(f.rate);
    const weak = toNum(f.weakKg) * toNum(f.weakRate);
    const birds = toNum(f.birds);
    return { emptyW, loadedW, eb, lb, gross, net, live, weak, total: live + weak, avg: birds > 0 ? net / birds : 0 };
  }, [boxes, useBoxes, f]);

  const traderOpts: ComboOption[] = traders.map((t) => ({ value: t.id, label: t.name, hint: t.balance > 0.5 ? `owes ${inr(t.balance)}` : undefined }));
  const batchOpts: ComboOption[] = batches.filter((b) => b.status === 'running' || String(b.id) === f.batchId).map((b) => ({ value: b.id, label: batchLabel(b), hint: b.status === 'running' ? `Day ${b.ageDays ?? 0}` : 'Closed' }));
  const setBox = (i: number, k: keyof Box, v: string) => setBoxes((x) => { const n = x.map((b, j) => (j === i ? { ...b, [k]: v } : b)); if (i === n.length - 1 && v) n.push(blankBox()); return n; });

  const save = async () => {
    setErr(''); setBusy(true);
    try {
      const body: any = {
        date: f.date, traderId: Number(f.traderId) || undefined, batchId: Number(f.batchId) || undefined, billNo: f.billNo && !editId ? Number(f.billNo) : undefined,
        vehicleNo: f.vehicleNo, isBroast: f.isBroast, birds: toNum(f.birds), damageKg: toNum(f.damageKg), rate: toNum(f.rate),
        weakBirds: toNum(f.weakBirds), weakKg: toNum(f.weakKg), weakRate: toNum(f.weakRate), narration: f.narration,
        boxes: useBoxes ? boxes.filter((b) => b.emptyWeight || b.loadedWeight || b.emptyBoxes || b.loadedBoxes).map((b) => ({ emptyBoxes: toNum(b.emptyBoxes), emptyWeight: toNum(b.emptyWeight), loadedBoxes: toNum(b.loadedBoxes), loadedWeight: toNum(b.loadedWeight) })) : [],
        grossKg: useBoxes ? 0 : toNum(f.grossKg),
      };
      if (!editId && toNum(f.received) > 0) { body.receivedAmount = toNum(f.received); body.receivedAccountId = Number(f.receivedAccountId) || undefined; }
      const r = editId ? await api(`/vouchers/${editId}`, { method: 'PUT', body }) : await api('/sales', { method: 'POST', body });
      invalidate(); toast(`Bill ${r.billNo ?? ''} saved`.replace('  ', ' '));
      navigate(`/sales/${r.id ?? editId}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  if (editId && !existing.data) return <PageLoading />;

  return (
    <>
      <div className="mb-8"><Link to="/sales" className="small muted">← Sales bills</Link></div>
      <PageHeader title={editId ? `Edit bill ${existing.data?.bill_no ?? ''}` : 'New sale bill'} sub="Weigh the boxes, set the rate — the bill is calculated as you type." />
      <div className="grid g-bill">
        <div className="col gap-16">
          <Card>
            <div className="form-grid">
              <Field label="Trader / buyer" className="full"><Combo value={f.traderId} onChange={set('traderId')} options={traderOpts} placeholder="Choose trader" autoFocus={!editId} /></Field>
              <Field label="Farm / batch" className="full"><Combo value={f.batchId} onChange={set('batchId')} options={batchOpts} placeholder="Which farm are the birds from?" /></Field>
              <Field label="Date"><DateInput value={f.date} onChange={(v) => set('date')(v)} /></Field>
              <Field label="Bill no." help={editId ? undefined : 'Leave as suggested for the next number'}><NumInput value={f.billNo || (editId ? '' : String(next.data?.billNo ?? ''))} onChange={set('billNo')} decimals={false} /></Field>
              <Field label="Vehicle no. (optional)"><Input value={f.vehicleNo} onChange={(e) => set('vehicleNo')(e.target.value.toUpperCase())} placeholder="KL 00 A 0000" /></Field>
              <label className="checkbox" style={{ alignSelf: 'end', height: 44 }}><input type="checkbox" checked={f.isBroast} onChange={(e) => set('isBroast')(e.target.checked)} />Broast size lot</label>
            </div>
          </Card>

          <Card pad={false}>
            <div className="card-head">
              <h2><Icon name="scale" size={18} />Weighing</h2>
              <Segmented value={useBoxes ? 'boxes' : 'gross'} onChange={(v) => setUseBoxes(v === 'boxes')} options={[{ value: 'boxes', label: 'Box by box' }, { value: 'gross', label: 'Total only' }]} />
            </div>
            <div className="card-body">
              {useBoxes ? (
                <div className="table-wrap">
                  <table className="weigh">
                    <thead><tr><th className="sl">#</th><th className="num">Empty boxes</th><th className="num">Empty kg</th><th className="num">Loaded boxes</th><th className="num">Loaded kg</th><th style={{ width: 40 }}></th></tr></thead>
                    <tbody>
                      {boxes.map((b, i) => (
                        <tr key={i}>
                          <td className="sl">{i + 1}</td>
                          <td><NumInput value={b.emptyBoxes} onChange={(v) => setBox(i, 'emptyBoxes', v)} decimals={false} /></td>
                          <td><NumInput value={b.emptyWeight} onChange={(v) => setBox(i, 'emptyWeight', v)} /></td>
                          <td><NumInput value={b.loadedBoxes} onChange={(v) => setBox(i, 'loadedBoxes', v)} decimals={false} /></td>
                          <td><NumInput value={b.loadedWeight} onChange={(v) => setBox(i, 'loadedWeight', v)} /></td>
                          <td><button type="button" className="icon-btn" title="Remove row" aria-label="Remove row" onClick={() => setBoxes((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : [blankBox()]))}><Icon name="x" size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td className="sl"></td><td className="num strong">{calc.eb}</td><td className="num strong tnum">{calc.emptyW.toFixed(2)}</td><td className="num strong">{calc.lb}</td><td className="num strong tnum">{calc.loadedW.toFixed(2)}</td><td></td></tr>
                    </tfoot>
                  </table>
                  <div className="row mt-8"><Button size="sm" icon="plus" onClick={() => setBoxes((x) => [...x, blankBox()])}>Add row</Button><Button size="sm" variant="ghost" onClick={() => setBoxes((x) => [...x, ...Array.from({ length: 5 }, blankBox)])}>Add 5 rows</Button></div>
                </div>
              ) : (
                <Field label="Net weight before damage (kg)"><NumInput value={f.grossKg} onChange={set('grossKg')} suffix="kg" /></Field>
              )}
              <div className="form-grid mt-16">
                <Field label="Number of birds"><NumInput value={f.birds} onChange={set('birds')} decimals={false} suffix="birds" /></Field>
                <Field label="Damage / deduction"><NumInput value={f.damageKg} onChange={set('damageKg')} suffix="kg" /></Field>
                <Field label="Rate per kg"><NumInput value={f.rate} onChange={set('rate')} prefix="₹" /></Field>
              </div>
            </div>
          </Card>

          <Card pad={false}>
            <div className="card-head"><h2>Weak / small birds <span className="muted small" style={{ fontWeight: 400 }}>(optional)</span></h2></div>
            <div className="card-body"><div className="form-grid" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
              <Field label="Birds"><NumInput value={f.weakBirds} onChange={set('weakBirds')} decimals={false} /></Field>
              <Field label="Weight"><NumInput value={f.weakKg} onChange={set('weakKg')} suffix="kg" /></Field>
              <Field label="Rate"><NumInput value={f.weakRate} onChange={set('weakRate')} prefix="₹" /></Field>
            </div></div>
          </Card>
        </div>

        <div className="col gap-16 bill-side">
          <div className="totals">
            <div className="stat-row"><span>Loaded weight</span><b className="tnum">{calc.loadedW.toFixed(2)} kg</b></div>
            <div className="stat-row"><span>Empty boxes weight</span><b className="tnum">− {calc.emptyW.toFixed(2)} kg</b></div>
            <div className="stat-row"><span>Damage</span><b className="tnum">− {toNum(f.damageKg).toFixed(2)} kg</b></div>
            <div className="stat-row"><span>Net weight</span><b className="tnum">{calc.net.toFixed(2)} kg</b></div>
            <div className="stat-row"><span>Average weight</span><b className="tnum">{calc.avg ? calc.avg.toFixed(3) : '—'} kg</b></div>
            <div className="stat-row"><span>Live birds</span><b className="tnum">{inr(calc.live, 2)}</b></div>
            {calc.weak > 0 && <div className="stat-row"><span>Weak birds</span><b className="tnum">{inr(calc.weak, 2)}</b></div>}
            <div className="row between mt-12"><span className="strong">Bill total</span><span className="grand tnum">{inr(calc.total, 2)}</span></div>
          </div>
          {!editId && (
            <Card>
              <div className="col gap-12" style={{ gap: 12 }}>
                <Field label="Received now (optional)"><NumInput value={f.received} onChange={set('received')} prefix="₹" /></Field>
                {toNum(f.received) > 0 && <Field label="Into account"><Combo value={f.receivedAccountId} onChange={set('receivedAccountId')} options={liquid.map((a) => ({ value: a.id, label: a.name }))} placeholder="Cash (default)" allowClear /></Field>}
                <Field label="Note"><Input value={f.narration} onChange={(e) => set('narration')(e.target.value)} /></Field>
              </div>
            </Card>
          )}
          {err && <Alert tone="err">{err}</Alert>}
          <Button variant="primary" size="lg" loading={busy} onClick={save}>{editId ? 'Save changes' : 'Save bill'}</Button>
        </div>
      </div>
    </>
  );
}

/* ───────────── Bill view / print ───────────── */
export function BillView() {
  const { id } = useParams();
  const q = useQuery<any>(['sale', id], () => api(`/sales/${id}`));
  const s = useSettings().data;
  const { user } = useAuth();
  const toast = useToast();
  const [del, setDel] = useState(false);
  const v = q.data;
  useTitle(v ? `Bill ${v.bill_no ?? ''}` : 'Bill');
  if (q.error && !v) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!v) return <PageLoading />;
  const calc = v.meta?.calc, bill = v.meta?.bill;
  const live = v.lines.find((l: any) => l.category === 'live');
  const weak = v.lines.find((l: any) => l.category === 'weak');
  const total = v.lines.reduce((a: number, l: any) => a + l.amount, 0);
  const boxes: any[] = bill?.boxes ?? [];

  return (
    <>
      <div className="mb-8 no-print"><Link to="/sales" className="small muted">← Sales bills</Link></div>
      <PageHeader title={`Bill ${v.bill_no ?? '#' + v.voucher_no}`} sub={`${v.trader} · ${fmtDate(v.date)}`}>
        <Button icon="print" onClick={() => window.print()}>Print</Button>
        {v.meta?.payload && <Button icon="edit" onClick={() => navigate(`/sales/new?edit=${v.id}`)}>Edit</Button>}
        {user?.role === 'admin' && <Button variant="danger" icon="trash" onClick={() => setDel(true)}>Delete</Button>}
      </PageHeader>

      <div className="doc">
        <div className="doc-head">
          <img src="/logo.png" alt="" />
          <div>
            <h2>{s?.company_name || "ROOSTER'S FIELD"}</h2>
            <p>{s?.address}</p>
            <p>{s?.phones}{s?.gstin ? ` · GSTIN ${s.gstin}` : ''}</p>
          </div>
          <div className="doc-tag"><small>Sales bill</small><b>#{v.bill_no ?? v.voucher_no}</b><span>{fmtDate(v.date)}</span></div>
        </div>
        <div className="meta">
          <div><span>Billed to</span><b>{v.trader}</b></div>
          <div><span>Farm / batch</span><b>{v.farm}{v.batch_no ? ` #${v.batch_no}` : ''}</b></div>
          {bill?.vehicleNo ? <div><span>Vehicle</span><b>{bill.vehicleNo}</b></div> : null}
        </div>
        {boxes.length > 0 && <div className="doc-sec">Weighing</div>}
        {boxes.length > 0 && (
          <table>
            <thead><tr><th className="l">#</th><th>Empty boxes</th><th>Empty kg</th><th>Loaded boxes</th><th>Loaded kg</th></tr></thead>
            <tbody>
              {boxes.map((b, i) => <tr key={i}><td className="l">{i + 1}</td><td>{b.emptyBoxes || ''}</td><td>{b.emptyWeight ? b.emptyWeight.toFixed(2) : ''}</td><td>{b.loadedBoxes || ''}</td><td>{b.loadedWeight ? b.loadedWeight.toFixed(2) : ''}</td></tr>)}
              {calc && <tr><td className="l"><b>Total</b></td><td><b>{calc.emptyBoxes}</b></td><td><b>{calc.emptyWeight.toFixed(2)}</b></td><td><b>{calc.loadedBoxes}</b></td><td><b>{calc.loadedWeight.toFixed(2)}</b></td></tr>}
            </tbody>
          </table>
        )}
        <div className="doc-sec">Items</div>
        <table>
          <thead><tr><th className="l">Item</th><th>Birds</th><th>Weight (kg)</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>
            {live && <tr><td className="l">Live birds{calc ? ` (gross ${calc.gross.toFixed(2)} kg)` : ''}</td><td>{num(live.qty)}</td><td>{live.weight.toFixed(2)}</td><td>{live.rate?.toFixed(2)}</td><td>{inr(live.amount, 2)}</td></tr>}
            {weak && <tr><td className="l">Weak birds</td><td>{num(weak.qty)}</td><td>{weak.weight.toFixed(2)}</td><td>{weak.rate?.toFixed(2)}</td><td>{inr(weak.amount, 2)}</td></tr>}
          </tbody>
        </table>
        <div className="sum">
          {live && live.qty > 0 && <div><span>Average weight</span><b>{(live.weight / live.qty).toFixed(3)} kg</b></div>}
          <div><span>Previous balance</span><span>{inr(v.partyBalanceBefore, 2)}</span></div>
          <div><span>This bill</span><span>{inr(total, 2)}</span></div>
          <div className="big"><span>Balance due</span><span>{inr(v.partyBalanceAfter, 2)}</span></div>
        </div>
        <div className="sign"><span>Receiver’s signature</span><span>For {s?.company_name || "Rooster's Field"}</span></div>
      </div>
      {del && <Confirm danger title="Delete this bill?" message="The bill and its sales entries will be removed from the books." confirmLabel="Delete bill" onClose={() => setDel(false)} onConfirm={async () => { await api(`/vouchers/${v.id}`, { method: 'DELETE' }); invalidate(); toast('Bill deleted'); navigate('/sales'); }} />}
    </>
  );
}
