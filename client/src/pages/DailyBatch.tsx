import React, { useState } from 'react';
import { api } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { Link, navigate, useParams, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { fixed, fmtDate, num, todayISO } from '../lib/format';
import { Badge, Button, Card, CardHead, Empty, ErrorBox, Field, Modal, NumInput, PageHeader, PageLoading, PALETTE, Stat } from '../components/ui';

const s = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

/** Small two-line chart: actual vs standard, drawn as plain SVG. */
function Lines({ labels, a, b, aName, bName, unit }: { labels: string[]; a: Array<number | null>; b: Array<number | null>; aName: string; bName: string; unit: string }) {
  const W = 640, H = 200, L = 40, R = 24, T = 12, B = 24;
  const vals = [...a, ...b].filter((x): x is number => x !== null);
  if (vals.length < 2) return <div className="muted small" style={{ padding: 20 }}>Not enough data yet.</div>;
  const max = Math.max(...vals) * 1.08 || 1;
  const X = (i: number) => L + (i / Math.max(1, labels.length - 1)) * (W - L - R);
  const Y = (v: number) => T + (1 - v / max) * (H - T - B);
  const path = (arr: Array<number | null>) => arr.map((v, i) => (v === null ? null : `${X(i)},${Y(v)}`)).filter(Boolean).join(' ');
  const ticks = [0, 0.5, 1].map((t) => t * max);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${aName} vs ${bName}`}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="var(--line-soft)" /><text x={L - 6} y={Y(t) + 4} fontSize="10" textAnchor="end" fill="var(--ink-3)">{t >= 100 ? Math.round(t) : fixed(t, 1)}</text></g>)}
        <polyline points={path(b)} fill="none" stroke={PALETTE.gray} strokeWidth="2" strokeDasharray="5 4" />
        <polyline points={path(a)} fill="none" stroke={PALETTE.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {[0, Math.floor((labels.length - 1) / 2), labels.length - 1].map((i) => <text key={i} x={X(i)} y={H - 6} fontSize="10" textAnchor={i === labels.length - 1 ? "end" : "middle"} fill="var(--ink-3)">{labels[i]}</text>)}
      </svg>
      <div className="row small muted" style={{ gap: 16 }}><span className="row" style={{ gap: 6 }}><i style={{ width: 14, height: 3, background: PALETTE.green, borderRadius: 2 }} />{aName}</span>{bName && <span className="row" style={{ gap: 6 }}><i style={{ width: 14, height: 3, background: PALETTE.gray, borderRadius: 2 }} />{bName}</span>}<span>({unit})</span></div>
    </div>
  );
}

export default function DailyBatch() {
  const { id } = useParams();
  const toast = useToast();
  const q = useQuery<any>(['daily-batch', id], () => api(`/daily/batch/${id}`));
  const d = q.data;
  useTitle(d ? `${d.batch.farm_name} daily` : 'Daily report');
  const [edit, setEdit] = useState<string | null>(null);
  const [f, setF] = useState({ mortality: '', feedIn: '', feedUsed: '', saleQty: '', saleWeight: '', note: '' });
  const [busy, setBusy] = useState(false);
  if (q.error && !d) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!d) return <PageLoading />;
  const b = d.batch, t = d.totals;
  const open = (r: any) => { setEdit(r.date); setF({ mortality: s(r.mortality), feedIn: s(r.feedIn), feedUsed: s(r.feedUsed), saleQty: s(r.saleQty), saleWeight: s(r.saleWeight), note: r.note ?? '' }); };
  const nn = (v: string) => (v.trim() === '' ? null : Number(v));
  const save = async () => {
    setBusy(true);
    try {
      await api(`/daily/${b.id}/${edit}`, { method: 'PUT', body: { mortality: nn(f.mortality), feedIn: nn(f.feedIn), feedUsed: nn(f.feedUsed), saleQty: nn(f.saleQty), saleWeight: nn(f.saleWeight), note: f.note || null } });
      invalidate(); toast('Day saved'); setEdit(null);
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  const rows: any[] = d.rows;
  const last = rows[rows.length - 1];
  const gap = last?.cumStdFeedBags != null ? t.feedUsed - last.cumStdFeedBags : null;

  return (
    <>
      <Link to="/daily" className="muted small">← Daily reports</Link>
      <PageHeader title={<>{b.farm_name} <span className="muted" style={{ fontWeight: 500 }}>#{b.batch_no}</span></>} sub={<>Placed {b.placement_date ? fmtDate(b.placement_date) : '—'} · {t?.received ? `${num(t.received)} birds incl. free chicks` : 'quantity not recorded'} · <Badge tone={b.status === 'running' ? 'green' : 'gray'}>{b.status}</Badge></>}>
        <Button onClick={() => navigate(`/batches/${b.id}`)}>Batch accounts</Button>
      </PageHeader>

      {!t || !rows.length ? <Empty title="No daily reports yet" icon="egg"><div className="muted small">Add them from the Daily reports page.</div></Empty> : (
        <>
          <div className="grid g4 kpi-grid">
            <Stat accent icon="calendar" label="Age" value={`Day ${last.day}`} sub={`${num(t.alive ?? 0)} birds alive`} />
            <Stat tone={(t.mortalityPct ?? 0) > 4 ? 'neg' : undefined} icon="bird" label="Mortality" value={t.mortalityPct !== null ? `${fixed(t.mortalityPct, 2)}%` : '—'} sub={`${num(t.mortality)} birds lost`} />
            <Stat icon="wheat" label="Feed used" value={`${fixed(t.feedUsed, 1)} bags`} sub={`Stock ${fixed(t.stock, 1)} of ${fixed(t.feedIn, 1)} received`} />
            <Stat tone={gap === null ? undefined : gap > 2 ? 'neg' : 'pos'} icon="scale" label="Feed vs standard" value={gap === null ? '—' : `${gap > 0 ? '+' : ''}${fixed(gap, 1)} bags`} sub={t.sold ? `${num(t.sold)} birds sold · ${num(t.soldKg)} kg` : 'Over (+) or under (−) the chart'} />
          </div>

          {d.hasStd && (
            <div className="grid g2" style={{ marginTop: 20 }}>
              <Card><CardHead title="Cumulative feed" /><div><Lines labels={rows.map((r) => fmtDate(r.date).slice(0, 6))} a={rows.map((r) => (r.hasLog || r.day === 0 ? r.cumFeedUsed : r.cumFeedUsed))} b={rows.map((r) => r.cumStdFeedBags)} aName="Used" bName="Standard" unit="bags" /></div></Card>
              <Card><CardHead title="Mortality" /><div><Lines labels={rows.map((r) => fmtDate(r.date).slice(0, 6))} a={rows.map((r) => r.cumMortality)} b={rows.map(() => null)} aName="Cumulative birds lost" bName="" unit="birds" /></div></Card>
            </div>
          )}

          <Card flush className="mt-16">
            <CardHead icon="list" title="Day by day" right={<span className="muted small">Click a day to correct it</span>} />
            <div className="table-wrap">
              <table className="table compact">
                <thead><tr><th>Date</th><th className="num">Day</th><th className="num">Mortality</th><th className="num">Cum.</th><th className="num">Sold</th><th className="num">Feed in</th><th className="num">Feed used</th><th className="num">Stock</th><th className="num">Std bags</th><th className="num">Alive</th><th className="num">Std wt (g)</th></tr></thead>
                <tbody>
                  {[...rows].reverse().map((r) => (
                    <tr key={r.date} className="click" onClick={() => open(r)} style={!r.hasLog ? { opacity: 0.55 } : undefined}>
                      <td>{fmtDate(r.date)}{r.date === todayISO() && <> <Badge tone="green">today</Badge></>}</td>
                      <td className="num">{r.day}</td>
                      <td className="num">{r.mortality ?? <span className="muted">–</span>}</td>
                      <td className="num">{r.cumMortality}<span className="sub">{r.mortalityPct !== null ? `${fixed(r.mortalityPct, 2)}%` : ''}</span></td>
                      <td className="num">{r.saleQty ? `${num(r.saleQty)}${r.saleWeight ? ` · ${fixed(r.saleWeight, 0)} kg` : ''}` : <span className="muted">–</span>}</td>
                      <td className="num">{r.feedIn ?? <span className="muted">–</span>}</td>
                      <td className="num">{r.feedUsed ?? <span className="muted">–</span>}</td>
                      <td className="num">{fixed(r.stock, 1)}</td>
                      <td className="num">{r.stdFeedBags !== null ? <span className={r.feedDiff !== null && r.feedDiff > 1 ? 'neg' : ''}>{fixed(r.stdFeedBags, 1)}</span> : <span className="muted">–</span>}</td>
                      <td className="num">{r.alive !== null ? num(r.alive) : '—'}</td>
                      <td className="num">{r.stdWeight ?? <span className="muted">–</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {edit && (
        <Modal title={fmtDate(edit)} onClose={() => setEdit(null)} footer={<><Button onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save day</Button></>}>
          <div className="grid g2">
            <Field label="Mortality"><NumInput value={f.mortality} onChange={(v) => setF({ ...f, mortality: v })} decimals={false} suffix="birds" /></Field>
            <Field label="Feed received"><NumInput value={f.feedIn} onChange={(v) => setF({ ...f, feedIn: v })} suffix="bags" /></Field>
            <Field label="Feed used"><NumInput value={f.feedUsed} onChange={(v) => setF({ ...f, feedUsed: v })} suffix="bags" /></Field>
            <Field label="Birds sold"><NumInput value={f.saleQty} onChange={(v) => setF({ ...f, saleQty: v })} decimals={false} /></Field>
            <Field label="Sold weight"><NumInput value={f.saleWeight} onChange={(v) => setF({ ...f, saleWeight: v })} suffix="kg" /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}
