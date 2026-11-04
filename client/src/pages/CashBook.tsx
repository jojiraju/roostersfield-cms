import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { addDaysISO, fmtDate, inr, todayISO, toNum } from '../lib/format';
import { useTitle, navigate } from '../lib/router';
import { useToast } from '../lib/toast';
import { DateInput, Alert, Badge, Button, Card, CardHead, ErrorBox, Icon, Input, NumInput, PageHeader, PageLoading, Stat } from '../components/ui';

const FACES = [500, 200, 100, 50, 20, 10, 5, 2, 1];

function Kpi({ icon, label, value, sub, tone, dark }: { icon: any; label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'pos' | 'neg' | 'warn'; dark?: boolean }) {
  return (
    <div className={`card kpi-pro ${dark ? 'dark' : ''} ${tone ? 'tone-' + tone : ''}`}>
      <div className="top"><div className="label"><span className="chip-icon"><Icon name={icon} /></span>{label}</div></div>
      <div className="value">{value}</div>
      <div className="foot">{sub}</div>
    </div>
  );
}

export default function CashBook() {
  useTitle('Cash book');
  const [date, setDate] = useState(todayISO());
  const q = useQuery<any>(['cashbook', date], () => api(`/cashbook?date=${date}`));
  const d = q.data;
  const sum = (k: string) => (d ? d.books.reduce((a: number, b: any) => a + b[k], 0) : 0);
  const cashClosing = d ? d.books.filter((b: any) => b.category === 'cash').reduce((a: number, b: any) => a + b.closing, 0) : 0;
  const bankClosing = d ? d.books.filter((b: any) => b.category !== 'cash').reduce((a: number, b: any) => a + b.closing, 0) : 0;
  return (
    <>
      <div className="hero">
        <div><h1>Cash book</h1><p>Daily cash and bank movement, with your physical cash count.</p></div>
        <div className="date-nav">
          <button className="icon-btn" onClick={() => setDate(addDaysISO(date, -1))} aria-label="Previous day"><Icon name="chevL" /></button>
          <DateInput value={date} onChange={(v) => v && setDate(v)} style={{ width: 160 }} />
          <button className="icon-btn" onClick={() => setDate(addDaysISO(date, 1))} aria-label="Next day"><Icon name="chevR" /></button>
          {date !== todayISO() && <Button size="sm" onClick={() => setDate(todayISO())}>Today</Button>}
        </div>
      </div>
      {q.error && !d ? <ErrorBox error={q.error} retry={q.refetch} /> : !d ? <PageLoading /> : (
        <>
          <div className="grid g4 kpi-grid">
            <Kpi dark icon="wallet" label="Cash in hand" value={inr(cashClosing)} sub={`Bank & others ${inr(bankClosing)}`} />
            <Kpi icon="database" label="Opening balance" value={inr(sum('opening'))} sub="Start of the day" />
            <Kpi tone="pos" icon="arrowDown" label="Money in" value={inr(sum('totalReceipts'))} sub="Receipts today" />
            <Kpi tone="neg" icon="arrowUp" label="Money out" value={inr(sum('totalPayments'))} sub="Payments today" />
          </div>
          <div className="cash-grid">
            <div className="col" style={{ gap: 20 }}>
              {d.books.map((b: any) => <BookCard key={b.id} b={b} />)}
              {d.books.length === 0 && <Card>No cash or bank accounts yet.</Card>}
            </div>
            <CountCard date={date} d={d} />
          </div>
        </>
      )}
    </>
  );
}

function BookCard({ b }: { b: any }) {
  const rows = [...b.receipts.map((l: any) => ({ ...l, dir: 'in', amount: l.debit })), ...b.payments.map((l: any) => ({ ...l, dir: 'out', amount: l.credit }))].sort((x, y) => x.id - y.id);
  const tot = (b.totalReceipts + b.totalPayments) || 1;
  return (
    <Card pad={false}>
      <div className="book-head">
        <span className={`book-ico ${b.category === 'cash' ? 'cash' : 'bank'}`}><Icon name={b.category === 'cash' ? 'wallet' : 'database'} size={22} /></span>
        <div className="grow"><h3>{b.name}</h3><div className="tiny muted">Opening {inr(b.opening)}</div></div>
        <div className="right"><div className="tiny muted">Closing</div><div className="book-close tnum">{inr(b.closing)}</div></div>
      </div>
      <div className="flow-bar" title="Money in vs out">
        <i style={{ width: `${(b.totalReceipts / tot) * 100}%`, background: 'var(--pos)' }} />
        <i style={{ width: `${(b.totalPayments / tot) * 100}%`, background: 'var(--neg)' }} />
      </div>
      <div className="flow-legend"><span><i style={{ background: 'var(--pos)' }} />In <b className="tnum pos">{inr(b.totalReceipts)}</b></span><span><i style={{ background: 'var(--neg)' }} />Out <b className="tnum neg">{inr(b.totalPayments)}</b></span></div>
      <div className="card-body" style={{ paddingTop: 4 }}>
        {rows.length === 0 ? <div className="muted small" style={{ padding: '18px 0', textAlign: 'center' }}>No movement on this day.</div> : rows.map((r: any) => (
          <div key={r.id + r.dir} className="list-row click" onClick={() => navigate(`/transactions?id=${r.voucher_id}`)}>
            <span className="dot-lg" style={{ background: r.dir === 'in' ? 'var(--pos-bg)' : 'var(--neg-bg)', color: r.dir === 'in' ? 'var(--pos)' : 'var(--neg)' }}><Icon name={r.dir === 'in' ? 'arrowDown' : 'arrowUp'} /></span>
            <div className="grow" style={{ minWidth: 0 }}><div className="medium ellipsis">{r.counter || r.description}</div><div className="tiny muted ellipsis">{r.description}</div></div>
            <b className={`tnum ${r.dir === 'in' ? 'pos' : 'neg'}`}>{r.dir === 'in' ? '+' : '−'}{inr(r.amount)}</b>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CountCard({ date, d }: { date: string; d: any }) {
  const toast = useToast();
  const cash = d.books.filter((b: any) => b.category === 'cash').reduce((a: number, b: any) => a + b.closing, 0);
  const saved = d.count;
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [damage, setDamage] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const c: Record<number, string> = {};
    for (const f of FACES) { const v = saved?.denominations?.[f]; c[f] = v ? String(v) : ''; }
    setCounts(c); setDamage(saved?.damage ? String(saved.damage) : ''); setNote(saved?.note ?? '');
  }, [date, saved]);
  const total = FACES.reduce((a, f) => a + f * toNum(counts[f]), 0) + toNum(damage);
  const diff = total - cash;
  const touched = FACES.some((f) => counts[f]) || !!damage;
  const save = async () => {
    setBusy(true);
    try {
      const denominations: Record<string, number> = {};
      for (const f of FACES) if (toNum(counts[f]) > 0) denominations[f] = toNum(counts[f]);
      await api('/cashbook/count', { method: 'PUT', body: { date, denominations, damage: toNum(damage), note: note || null } });
      invalidate(); toast('Cash count saved');
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Card pad={false}>
      <div className="book-head"><span className="book-ico cash"><Icon name="coins" size={22} /></span><div className="grow"><h3>Cash count</h3><div className="tiny muted">Tally notes against the book</div></div></div>
      <div className="card-body">
        <div className="col" style={{ gap: 8 }}>
          {FACES.map((f) => (
            <div key={f} className="row">
              <div style={{ width: 62 }} className="strong">₹{f}</div>
              <span className="muted">×</span>
              <div style={{ width: 96 }}><NumInput sm value={counts[f] ?? ''} onChange={(v) => setCounts((c) => ({ ...c, [f]: v }))} decimals={false} /></div>
              <div className="grow right tnum">{toNum(counts[f]) ? inr(f * toNum(counts[f])) : ''}</div>
            </div>
          ))}
          <div className="row"><div style={{ width: 62 }} className="strong">Other</div><span className="muted"> </span><div style={{ width: 96 }}><NumInput sm value={damage} onChange={setDamage} prefix="₹" /></div><div className="grow right small muted">torn / coins / other</div></div>
        </div>
        <div className={`count-total mt-16 ${touched ? (Math.abs(diff) < 1 ? "ok" : "bad") : ""}`}>
          <div className="stat-row"><span>Counted</span><b className="tnum">{inr(total)}</b></div>
          <div className="stat-row"><span>Cash book says</span><b className="tnum">{inr(cash)}</b></div>
          <div className="row between mt-8"><span className="strong">Difference</span><b className={`tnum ${Math.abs(diff) < 1 ? 'pos' : 'neg'}`} style={{ fontSize: 18 }}>{touched ? (Math.abs(diff) < 1 ? 'Tallied ✓' : `${diff > 0 ? '+' : '−'}${inr(Math.abs(diff))}`) : '—'}</b></div>
        </div>
        {touched && Math.abs(diff) >= 1 && <div className="mt-12"><Alert>{diff > 0 ? 'You have more cash than the book shows — a receipt may be missing.' : 'You have less cash than the book shows — a payment may be missing.'}</Alert></div>}
        <div className="mt-12"><Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div className="row between mt-12"><span className="tiny muted">{saved ? `Saved count for ${fmtDate(date)}` : 'Not saved yet'}</span><Button variant="primary" loading={busy} disabled={!touched} onClick={save}>Save count</Button></div>
      </div>
    </Card>
  );
}
