import React, { useState } from 'react';
import { api, qs } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { navigate, useLocation, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { fmtDate, inr, num, TYPE_LABELS, TYPE_TONE } from '../lib/format';
import type { VoucherDetail, VoucherRow } from '../lib/types';
import { DateInput, Badge, Button, Card, Confirm, Drawer, Empty, ErrorBox, Icon, Input, PageHeader, PageLoading, SearchBox, Select, Table } from '../components/ui';
import { useEntry } from '../components/EntryModal';

const PAGE = 50;
const TYPES = ['sale', 'feed', 'chicks', 'medicine', 'feed_return', 'integration', 'misc', 'receipt', 'payment', 'expense', 'transfer', 'journal', 'close', 'opening'];

export default function Transactions() {
  useTitle('Transactions');
  const loc = useLocation();
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(loc.search.get('id') ? Number(loc.search.get('id')) : null);
  const accountId = loc.search.get('accountId');
  const q = useQuery<{ total: number; rows: VoucherRow[] }>(['vouchers', type, from, to, text, page, accountId], () => api(`/vouchers${qs({ type, from, to, q: text, accountId, limit: PAGE, offset: page * PAGE })}`));
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  return (
    <>
      <PageHeader title="Transactions" sub="Every entry in the books, newest first." />
      <Card pad={false}>
        <div className="row wrap" style={{ padding: 16, borderBottom: '1px solid var(--line-soft)' }}>
          <SearchBox value={text} onChange={reset(setText)} placeholder="Search party, farm, bill no…" />
          <Select sm value={type} onChange={(e) => reset(setType)(e.target.value)} style={{ width: 190 }}>
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
          </Select>
          <DateInput sm value={from} onChange={(v) => reset(setFrom)(v)} style={{ width: 150 }} aria-label="From date" />
          <span className="muted">to</span>
          <DateInput sm value={to} onChange={(v) => reset(setTo)(v)} style={{ width: 150 }} aria-label="To date" />
          {(type || from || to || text) && <Button size="sm" variant="ghost" onClick={() => { setType(''); setFrom(''); setTo(''); setText(''); setPage(0); }}>Clear</Button>}
        </div>
        {q.error && !q.data ? <ErrorBox error={q.error} retry={q.refetch} /> : !q.data ? <PageLoading /> : (
          <>
            <Table rows={q.data.rows} rowKey={(v) => v.id} onRowClick={(v) => setOpenId(v.id)} empty={<Empty title="No entries match" icon="search" />}
              cols={[
                { key: 'date', header: 'Date', render: (v) => <span className="nowrap">{fmtDate(v.date)}</span> },
                { key: 'type', header: 'Type', render: (v) => <Badge tone={(TYPE_TONE[v.type] as any) || 'gray'}>{TYPE_LABELS[v.type] || v.type}</Badge> },
                { key: 'desc', header: 'Details', render: (v) => <><span className="ellipsis" style={{ display: 'block', maxWidth: 420 }}>{v.description}</span><span className="sub">{[v.party_name, v.farm_name && `${v.farm_name}${v.batch_no ? ' #' + v.batch_no : ''}`].filter(Boolean).join(' · ')}</span></> },
                { key: 'no', header: 'No.', hideSm: true, render: (v) => <span className="muted">{v.bill_no ? `Bill ${v.bill_no}` : `V${v.voucher_no}`}</span> },
                { key: 'amt', header: 'Amount', num: true, render: (v) => <b>{inr(v.amount)}</b> },
              ]} />
            <div className="row between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line-soft)' }}>
              <span className="small muted">{q.data.total ? `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, q.data.total)} of ${num(q.data.total)}` : '0 entries'}</span>
              <div className="row gap-8">
                <Button size="sm" icon="chevL" disabled={page === 0} onClick={() => setPage(page - 1)}>Newer</Button>
                <Button size="sm" disabled={(page + 1) * PAGE >= q.data.total} onClick={() => setPage(page + 1)}>Older<Icon name="chevR" /></Button>
              </div>
            </div>
          </>
        )}
      </Card>
      {openId && <VoucherDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

export function VoucherDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const q = useQuery<VoucherDetail>(['voucher', id], () => api(`/vouchers/${id}`));
  const { user } = useAuth();
  const toast = useToast();
  const { open } = useEntry();
  const [del, setDel] = useState(false);
  const v = q.data;
  const editable = !!v?.meta?.payload;
  return (
    <Drawer title={v ? <span className="row gap-8"><Badge tone={(TYPE_TONE[v.type] as any) || 'gray'}>{TYPE_LABELS[v.type] || v.type}</Badge> {v.bill_no ? `Bill ${v.bill_no}` : `Voucher ${v.voucher_no}`}</span> : 'Entry'} onClose={onClose}
      footer={v && <>
        {v.type === 'sale' && <Button icon="eye" onClick={() => { onClose(); navigate(`/sales/${v.id}`); }}>View bill</Button>}
        {editable && <Button icon="edit" onClick={() => { onClose(); open({ editId: v.id }); }}>Edit</Button>}
        {user?.role === 'admin' && <Button variant="danger" icon="trash" onClick={() => setDel(true)}>Delete</Button>}
      </>}>
      {!v ? <div style={{ padding: 30, textAlign: 'center' }}><span className="spin" /></div> : (
        <>
          <dl className="kv mb-16">
            <dt>Date</dt><dd>{fmtDate(v.date)}</dd>
            <dt>Details</dt><dd>{v.description}</dd>
            {v.party_name && <><dt>Party</dt><dd>{v.party_name}</dd></>}
            {v.farm_name && <><dt>Farm</dt><dd>{v.farm_name}{v.batch_no ? ` #${v.batch_no}` : ''}</dd></>}
            <dt>Source</dt><dd>{v.source === 'app' ? 'Entered in software' : 'Imported from Excel'}</dd>
          </dl>
          <div className="label mb-8">Accounting entries</div>
          <div className="table-wrap card" style={{ boxShadow: 'none' }}>
            <table className="table compact">
              <thead><tr><th>Account</th><th className="num">Debit</th><th className="num">Credit</th></tr></thead>
              <tbody>
                {v.entries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.account_name}<span className="sub">{[e.item, e.qty ? `${num(e.qty, 1)}${e.weight ? '' : ' qty'}` : '', e.weight ? `${num(e.weight, 1)} kg` : '', e.rate ? `@ ${e.rate}` : '', e.farm_name].filter(Boolean).join(' · ')}</span></td>
                    <td className="num">{e.debit ? inr(e.debit, 2) : ''}</td><td className="num">{e.credit ? inr(e.credit, 2) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!editable && <p className="small muted mt-12">Imported entries can’t be edited. Delete and re-enter, or post a journal adjustment.</p>}
        </>
      )}
      {del && v && <Confirm danger title="Delete this entry?" message="This removes it from the books permanently. Reports and balances will update." confirmLabel="Delete" onClose={() => setDel(false)} onConfirm={async () => { await api(`/vouchers/${v.id}`, { method: 'DELETE' }); invalidate(); toast('Entry deleted'); onClose(); }} />}
    </Drawer>
  );
}
