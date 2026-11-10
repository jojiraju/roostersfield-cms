import React, { useEffect, useMemo, useState } from 'react';
import { api, qs } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { navigate, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { addDaysISO, fixed, fmtDate, num, todayISO, toNum } from '../lib/format';
import { Badge, Button, Card, CardHead, DateInput, Empty, ErrorBox, Icon, NumInput, PageHeader, PageLoading, Stat } from '../components/ui';

export interface DailyRow {
  batchId: number; farm: string; farmer: string | null; batchNo: number; placementDate: string; placed: number | null; received: number | null; status: string;
  age: number; alive: number | null; cumMortality: number; mortalityPct: number | null; stock: number; cumFeedUsed: number; cumStdFeedBags: number | null; feedGap: number | null; stdWeight: number | null;
  today: { mortality: number | null; saleQty: number | null; saleWeight: number | null; feedIn: number | null; feedUsed: number | null; note: string | null } | null;
  lastReport: string | null; daysSince: number | null;
}
type Draft = { mortality: string; feedIn: string; feedUsed: string; saleQty: string; saleWeight: string };
const FIELDS: Array<keyof Draft> = ['mortality', 'feedIn', 'feedUsed', 'saleQty', 'saleWeight'];
const s = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const toDraft = (r: DailyRow): Draft => ({ mortality: s(r.today?.mortality), feedIn: s(r.today?.feedIn), feedUsed: s(r.today?.feedUsed), saleQty: s(r.today?.saleQty), saleWeight: s(r.today?.saleWeight) });
const numOrNull = (v: string) => (v.trim() === '' ? null : toNum(v));

export default function Daily() {
  useTitle('Daily reports');
  const toast = useToast();
  const [picked, setDate] = useState('');
  const q = useQuery<{ date: string; rows: DailyRow[] }>(['daily', picked], () => api(`/daily${qs({ date: picked || undefined })}`));
  const date = picked || q.data?.date || todayISO();
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const rows = q.data?.rows ?? [];

  useEffect(() => { // fresh data (or another day) → reset the editable copy
    const d: Record<number, Draft> = {};
    for (const r of rows) d[r.batchId] = toDraft(r);
    setDrafts(d); setDirty(new Set());
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (id: number, k: keyof Draft, v: string) => { setDrafts((d) => ({ ...d, [id]: { ...d[id], [k]: v } })); setDirty((x) => new Set(x).add(id)); };
  const save = async () => {
    setBusy(true);
    try {
      const items = [...dirty].map((id) => ({ batchId: id, mortality: numOrNull(drafts[id].mortality), feedIn: numOrNull(drafts[id].feedIn), feedUsed: numOrNull(drafts[id].feedUsed), saleQty: numOrNull(drafts[id].saleQty), saleWeight: numOrNull(drafts[id].saleWeight) }));
      await api('/daily/bulk', { method: 'POST', body: { date, items } });
      invalidate(); toast(`Saved ${items.length} report${items.length === 1 ? '' : 's'}`);
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  };

  const stats = useMemo(() => {
    const live = rows.map((r) => ({ r, d: drafts[r.batchId] })).filter((x) => x.d);
    const done = live.filter((x) => FIELDS.some((f) => x.d[f] !== '')).length;
    return { total: rows.length, done, mort: live.reduce((a, x) => a + toNum(x.d.mortality), 0), used: live.reduce((a, x) => a + toNum(x.d.feedUsed), 0), alive: rows.reduce((a, r) => a + (r.alive ?? 0), 0) };
  }, [rows, drafts]);

  return (
    <>
      <PageHeader title="Daily reports" sub="Mortality, feed and sales from every running farm, one day at a time.">
        <button className="icon-btn" onClick={() => setDate(addDaysISO(date, -1))} aria-label="Previous day"><Icon name="chevL" /></button>
        <DateInput value={date} onChange={(v) => v && setDate(v)} style={{ width: 160 }} />
        <button className="icon-btn" onClick={() => setDate(addDaysISO(date, 1))} aria-label="Next day"><Icon name="chevR" /></button>
        {date !== todayISO() && <Button size="sm" onClick={() => setDate(todayISO())}>Today</Button>}
      </PageHeader>

      {q.error && !q.data ? <ErrorBox error={q.error} retry={q.refetch} /> : !q.data ? <PageLoading /> : (
        <>
          <div className="grid g4 kpi-grid">
            <Stat accent icon="barn" label="Running flocks" value={num(stats.total)} sub={`${num(stats.alive)} birds alive`} />
            <Stat icon="check" label="Reports in" value={`${stats.done} / ${stats.total}`} sub={stats.done === stats.total ? 'All farms reported' : `${stats.total - stats.done} still to report`} />
            <Stat icon="bird" tone={stats.mort > 0 ? 'neg' : undefined} label="Mortality today" value={num(stats.mort)} sub="Birds lost on this day" />
            <Stat icon="wheat" label="Feed used today" value={`${fixed(stats.used, 1)} bags`} sub={`≈ ${num(stats.used * 50)} kg`} />
          </div>

          <Card flush className="mt-16">
            <div className="daily-bar">
              <div className="daily-bar-title">
                <span className="daily-bar-ico"><Icon name="list" size={18} /></span>
                <div>
                  <h2>Farm reports</h2>
                  <div className="small muted">{fmtDate(date)} · {stats.done} of {stats.total} farms reported</div>
                </div>
              </div>
              <div className="daily-bar-actions">
                {dirty.size > 0
                  ? <Badge tone="orange" dot>{dirty.size} unsaved</Badge>
                  : <Badge tone="green"><Icon name="check" size={13} /> All saved</Badge>}
                <Button variant="primary" icon="check" loading={busy} disabled={!dirty.size} onClick={save}>{dirty.size ? `Save ${dirty.size} change${dirty.size === 1 ? '' : 's'}` : 'Save'}</Button>
              </div>
            </div>
            {rows.length === 0 ? <Empty title="No running flocks on this date" icon="egg" /> : (
              <div className="table-wrap">
                <table className="table daily-table">
                  <thead>
                    <tr className="group-row">
                      <th colSpan={2} />
                      <th colSpan={5} className="group in-group">Today's entry</th>
                      <th colSpan={3} className="group">Running totals</th>
                    </tr>
                    <tr>
                      <th>Farm / batch</th><th className="num">Age</th>
                      <th className="num in">Mortality</th><th className="num in">Feed in</th><th className="num in">Feed used</th><th className="num in">Sold birds</th><th className="num in">Sold kg</th>
                      <th className="num">Mortality %</th><th className="num">Feed stock</th><th className="num">Feed vs std</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const d = drafts[r.batchId] ?? toDraft(r);
                      const reported = FIELDS.some((f) => d[f] !== '');
                      return (
                        <tr key={r.batchId} className={dirty.has(r.batchId) ? 'row-dirty' : ''}>
                          <td>
                            <span className={`state-dot ${dirty.has(r.batchId) ? 'edit' : reported ? 'done' : ''}`} title={dirty.has(r.batchId) ? 'Unsaved changes' : reported ? 'Reported' : 'Not reported yet'} />
                            <a className="strong link" onClick={() => navigate(`/daily/${r.batchId}`)}>{r.farm}</a> <span className="muted small">#{r.batchNo}</span>
                            <span className="sub">{num(r.received ?? 0)} birds · {fmtDate(r.placementDate)}{!reported && r.daysSince !== null && r.daysSince > 0 ? ` · last report ${r.daysSince}d ago` : ''}</span>
                          </td>
                          <td className="num"><Badge tone={r.age >= 33 ? 'orange' : 'gray'}>Day {r.age}</Badge></td>
                          {FIELDS.map((f) => <td key={f} className="num in"><NumInput sm value={d[f]} onChange={(v) => edit(r.batchId, f, v)} decimals={f !== 'mortality' && f !== 'saleQty'} /></td>)}
                          <td className="num"><span className={(r.mortalityPct ?? 0) > 4 ? 'neg strong' : ''}>{r.mortalityPct !== null ? `${fixed(r.mortalityPct, 2)}%` : '—'}</span><span className="sub">{num(r.cumMortality)} birds</span></td>
                          <td className="num">{fixed(r.stock, 1)}<span className="sub">{fixed(r.cumFeedUsed, 1)} used</span></td>
                          <td className="num">{r.feedGap === null ? '—' : <span className={`gap-pill ${r.feedGap > 2 ? 'high' : r.feedGap < -2 ? 'low' : 'ok'}`}>{r.feedGap > 0 ? '+' : ''}{fixed(r.feedGap, 1)} bags</span>}<span className="sub">{r.feedGap === null ? '' : r.feedGap > 2 ? 'over standard' : r.feedGap < -2 ? 'under standard' : 'on standard'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
