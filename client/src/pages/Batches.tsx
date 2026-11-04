import React, { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useQuery } from '../lib/query';
import { navigate, useTitle } from '../lib/router';
import { fixed, fmtDate, inr, num, pct } from '../lib/format';
import type { BatchSummary } from '../lib/types';
import { Badge, Button, Card, Empty, ErrorBox, Icon, PageHeader, PageLoading, Progress, SearchBox, Segmented, Table } from '../components/ui';
import { useEntry } from '../components/EntryModal';

export default function Batches() {
  useTitle('Batches');
  const { open } = useEntry();
  const q = useQuery<BatchSummary[]>(['batches', ''], () => api('/batches'));
  const [tab, setTab] = useState<'running' | 'closed'>('running');
  const [s, setS] = useState('');
  const all = q.data ?? [];
  const list = useMemo(() => all.filter((b) => b.status === tab && (!s || `${b.farm_name} ${b.farmer_name ?? ''} ${b.batch_no}`.toLowerCase().includes(s.toLowerCase()))), [all, tab, s]);
  if (q.error && !q.data) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageLoading />;
  const running = all.filter((b) => b.status === 'running').length;

  return (
    <>
      <PageHeader title="Batches" sub="Every flock placed at a farm — from chicks to the final profit.">
        <Button variant="primary" icon="plus" onClick={() => open({ kind: 'batch' })}>New batch</Button>
      </PageHeader>
      <div className="row wrap between mb-16">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'running', label: 'Running', count: running }, { value: 'closed', label: 'Closed', count: all.length - running }]} />
        <SearchBox value={s} onChange={setS} placeholder="Search farm or farmer…" />
      </div>

      {tab === 'running' ? (
        list.length === 0 ? <Card><Empty title="No running batches" icon="egg">Start one when chicks arrive at a farm.</Empty></Card> : (
          <div className="grid g-farms">
            {list.map((b) => {
              const age = b.ageDays ?? 0;
              return (
                <Card key={b.id} className="farm-card" onClick={() => navigate(`/batches/${b.id}`)}>
                  <div className="top">
                    <span className="dot-lg"><Icon name="barn" /></span>
                    <div className="grow"><h3>{b.farm_name} <span className="muted">#{b.batch_no}</span></h3><div className="small muted">{b.farmer_name || 'Farmer not set'} · placed {fmtDate(b.placement_date, false)}</div></div>
                    {age >= 33 ? <Badge tone="orange">Harvest due</Badge> : <Badge tone="green" dot>Day {age}</Badge>}
                  </div>
                  <Progress value={age} max={35} tone={age >= 35 ? 'alert' : age >= 33 ? 'warn' : undefined} />
                  <div className="mini-stats">
                    <div><small>Chicks</small><b>{num(b.placed_qty)}</b></div>
                    <div><small>Spent</small><b>{inr(b.cost)}</b></div>
                    <div><small>Sold</small><b>{num(b.soldBirds)}</b></div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <Card pad={false} flush>
          <Table rows={list} rowKey={(b) => b.id} onRowClick={(b) => navigate(`/batches/${b.id}`)} defaultSort={{ key: 'closed', dir: -1 }}
            empty={<Empty title="No closed batches" />}
            cols={[
              { key: 'farm', header: 'Farm', sort: (b) => b.farm_name, render: (b) => <><b>{b.farm_name} #{b.batch_no}</b><span className="sub">{b.farmer_name}</span></> },
              { key: 'closed', header: 'Closed', sort: (b) => b.closed_date || '', render: (b) => fmtDate(b.closed_date), hideSm: true },
              { key: 'placed', header: 'Placed', num: true, sort: (b) => b.placed_qty ?? 0, render: (b) => num(b.placed_qty), hideSm: true },
              { key: 'kg', header: 'Sold kg', num: true, sort: (b) => b.soldKg, render: (b) => num(b.soldKg), hideSm: true },
              { key: 'fcr', header: 'FCR', num: true, sort: (b) => b.kpis.fcr ?? 0, render: (b) => fixed(b.kpis.fcr), hideSm: true },
              { key: 'liv', header: 'Livability', num: true, sort: (b) => b.kpis.livability ?? 0, render: (b) => pct(b.kpis.livability), hideSm: true },
              { key: 'profit', header: 'Profit', num: true, sort: (b) => b.profit, render: (b) => <b className={b.profit < 0 ? 'neg' : 'pos'}>{inr(b.profit)}</b> },
              { key: 'ppk', header: '₹/kg', num: true, sort: (b) => b.kpis.profitPerKg ?? 0, render: (b) => (b.kpis.profitPerKg === null ? '—' : fixed(b.kpis.profitPerKg)) },
            ]} />
        </Card>
      )}
    </>
  );
}
