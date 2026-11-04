import React, { useMemo, useState } from 'react';
import { api, qs } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { Link, navigate, useParams, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { useAccounts } from '../lib/data';
import { downloadCSV, fmtDate, inr, owes, todayISO, yearStartISO } from '../lib/format';
import type { Account } from '../lib/types';
import { Confirm, DateInput, Icon, Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageHeader, PageLoading, SearchBox, Segmented, Select, Stat, Table } from '../components/ui';
import { useEntry } from '../components/EntryModal';

type Group = 'trader' | 'supplier' | 'farmer' | 'other';
const GROUPS: Record<Group, string[]> = { trader: ['trader'], supplier: ['supplier'], farmer: ['farmer'], other: ['loan', 'other_asset', 'other_liability', 'equity', 'fixed_asset', 'cash', 'bank', 'expense', 'income'] };
const CAT_LABEL: Record<string, string> = { trader: 'Trader', supplier: 'Supplier', farmer: 'Farmer', loan: 'Loan', other_asset: 'Other asset', other_liability: 'Other liability', equity: 'Equity', fixed_asset: 'Fixed asset', cash: 'Cash', bank: 'Bank', expense: 'Expense', income: 'Income' };

export function Parties() {
  useTitle('Parties');
  const [showInactive, setShowInactive] = useState(false);
  const q = useQuery<Account[]>(['accounts', '', showInactive ? 'all' : 'act'], () => api(`/accounts${qs({ active: showInactive ? 'all' : undefined })}`));
  const { open } = useEntry();
  const [g, setG] = useState<Group>('trader');
  const [s, setS] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const all = (q.data ?? []).filter((a) => !a.sys_key);
  const list = useMemo(() => all.filter((a) => GROUPS[g].includes(a.category) && (!s || a.name.toLowerCase().includes(s.toLowerCase()))), [all, g, s]);
  if (q.error && !q.data) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageLoading />;
  const sum = (pos: boolean) => list.filter((a) => (pos ? a.balance > 0 : a.balance < 0)).reduce((t, a) => t + Math.abs(a.balance), 0);
  const count = (k: Group) => all.filter((a) => GROUPS[k].includes(a.category)).length;
  return (
    <>
      <PageHeader title="Parties & accounts" sub="Traders, suppliers, farmers and every other account.">
        <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>Add party</Button>
      </PageHeader>
      <div className="row wrap between mb-16">
        <Segmented value={g} onChange={setG} options={[{ value: 'trader', label: 'Traders', count: count('trader') }, { value: 'supplier', label: 'Suppliers', count: count('supplier') }, { value: 'farmer', label: 'Farmers', count: count('farmer') }, { value: 'other', label: 'Other', count: count('other') }]} />
        <div className="row wrap" style={{ gap: 14 }}>
          <label className="checkbox"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />Show inactive</label>
          <SearchBox value={s} onChange={setS} placeholder="Search name…" />
        </div>
      </div>
      <div className="grid g3 kpi-grid mb-16">
        <Stat small label="Accounts" value={String(list.length)} />
        <Stat small label="To receive" value={inr(sum(true))} tone="pos" />
        <Stat small label="To pay" value={inr(sum(false))} />
      </div>
      <Card pad={false} flush>
        <Table rows={list} rowKey={(a) => a.id} onRowClick={(a) => navigate(`/ledger/${a.id}`)} empty={<Empty title="No accounts" icon="users" />} defaultSort={{ key: 'bal', dir: -1 }}
          cols={[
            { key: 'name', header: 'Name', sort: (a) => a.name, render: (a) => <><b>{a.name}</b>{!a.active && <> <Badge>Inactive</Badge></>}<span className="sub">{[CAT_LABEL[a.category], a.subtype && a.subtype !== 'other' ? a.subtype : '', a.phone].filter(Boolean).join(' · ')}</span></> },
            { key: 'last', header: 'Last entry', hideSm: true, sort: (a) => a.last_activity || '', render: (a) => (a.last_activity ? fmtDate(a.last_activity) : '—') },
            { key: 'bal', header: 'Balance', num: true, sort: (a) => Math.abs(a.balance), render: (a: Account) => { const o = owes(a.balance); return o.amount ? <><b className={o.tone === 'green' ? 'pos' : 'neg'}>{inr(o.amount)}</b><span className="sub">{o.text}</span></> : <span className="muted">Settled</span>; } },
            { key: 'act', header: '', width: 170, render: (a) => (
              <div className="row gap-6" style={{ justifyContent: 'flex-end', gap: 6 }}>
                {['trader', 'supplier', 'farmer'].includes(a.category) && <Button size="sm" onClick={(e) => { e.stopPropagation(); open({ kind: a.category === 'trader' ? 'receipt' : 'payment', partyId: a.id }); }}>{a.category === 'trader' ? 'Receive' : 'Pay'}</Button>}
                <button className="icon-btn" title="Edit / delete" aria-label="Edit or delete" onClick={(e) => { e.stopPropagation(); setEditing(a); }}><Icon name="edit" size={17} /></button>
              </div>) },
          ]} />
      </Card>
      {adding && <AddParty group={g} onClose={() => setAdding(false)} />}
      {editing && <EditParty a={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditParty({ a, onClose }: { a: Account; onClose: () => void }) {
  const toast = useToast();
  const { user } = useAuth();
  const [f, setF] = useState({ name: a.name, phone: a.phone ?? '', notes: a.notes ?? '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const used = a.entries > 0;
  const save = async (extra: Record<string, unknown> = {}) => {
    setBusy(true); setErr('');
    try { await api(`/accounts/${a.id}`, { method: 'PUT', body: { name: f.name, phone: f.phone || null, notes: f.notes || null, ...extra } }); invalidate(); toast(extra.active === false ? 'Party made inactive' : extra.active === true ? 'Party reactivated' : 'Party updated'); onClose(); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <>
      <Modal title={`Edit ${a.name}`} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={() => save()}>Save</Button></>}>
        <div className="form-grid">
          <Field label="Name" className="full"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Notes"><Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
        {err && <div className="form-error mt-16">{err}</div>}
        <div className="mt-24" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
          <div className="label mb-8">Remove this party</div>
          {used ? (
            <>
              <p className="small muted mb-8">{a.name} has {a.entries} entries in the books. <b>Make inactive</b> hides it from lists and forms but keeps the history (recommended). <b>Delete with entries</b> permanently removes the party and every transaction it appears in, which changes your totals and reports.</p>
              <div className="row wrap" style={{ gap: 10 }}>
                {a.active ? <Button onClick={() => save({ active: false })} loading={busy}>Make inactive</Button> : <Button variant="primary" onClick={() => save({ active: true })} loading={busy}>Reactivate</Button>}
                {user?.role === 'admin' && <Button variant="danger" icon="trash" onClick={() => setConfirmDel(true)}>Delete with entries</Button>}
              </div>
            </>
          ) : user?.role === 'admin' ? (
            <>
              <p className="small muted mb-8">No entries use this party, so it can be deleted permanently.</p>
              {!a.active && <Button variant="primary" onClick={() => save({ active: true })} loading={busy} style={{ marginRight: 10 }}>Reactivate</Button>}
              <Button variant="danger" icon="trash" onClick={() => setConfirmDel(true)}>Delete party</Button>
            </>
          ) : <p className="small muted">Only an admin can delete a party. You can make it inactive instead.</p>}
        </div>
      </Modal>
      {confirmDel && <Confirm danger title={`Delete ${a.name}?`} message={used ? <>This will permanently delete <b>{a.name}</b> and <b>every transaction</b> it appears in (bills, receipts, payments, entries). Balances and reports will change. A backup of the database is saved first, but this can’t be undone from the app.</> : 'This permanently removes the party. This can’t be undone.'} confirmLabel={used ? 'Delete everything' : 'Delete'} onClose={() => setConfirmDel(false)} onConfirm={async () => { const r = await api(`/accounts/${a.id}${used ? '?force=1' : ''}`, { method: 'DELETE' }); invalidate(); toast(used ? `Party and ${r?.deletedVouchers ?? ''} transactions deleted` : 'Party deleted'); onClose(); }} />}
    </>
  );
}

function AddParty({ group, onClose }: { group: Group; onClose: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', category: group === 'other' ? 'other_asset' : group, subtype: 'feed', phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Add party" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={async () => {
      setBusy(true); setErr('');
      try { await api('/accounts', { method: 'POST', body: { name: f.name, category: f.category, subtype: f.category === 'supplier' ? f.subtype : null, phone: f.phone || null } }); invalidate(); toast('Party added'); onClose(); } catch (e) { setErr((e as Error).message); setBusy(false); }
    }}>Add</Button></>}>
      <div className="form-grid">
        <Field label="Name" className="full"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Type"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{['trader', 'supplier', 'farmer', 'loan', 'other_asset', 'other_liability', 'expense', 'equity', 'fixed_asset', 'bank', 'cash'].map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}</Select></Field>
        {f.category === 'supplier' ? <Field label="Supplies"><Select value={f.subtype} onChange={(e) => setF({ ...f, subtype: e.target.value })}><option value="feed">Feed</option><option value="chicks">Chicks</option><option value="medicine">Medicine</option><option value="other">Other</option></Select></Field> : <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>}
      </div>
      {err && <div className="form-error mt-16">{err}</div>}
    </Modal>
  );
}

export function Ledger() {
  const { id } = useParams();
  const [from, setFrom] = useState(yearStartISO());
  const [to, setTo] = useState(todayISO());
  const [all, setAll] = useState(false);
  const q = useQuery<any>(['ledger', id, from, to, all], () => api(`/reports/ledger/${id}${qs({ from: all ? '' : from, to: all ? '' : to })}`));
  const d = q.data;
  useTitle(d ? d.account.name : 'Ledger');
  if (q.error && !d) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!d) return <PageLoading />;
  const csv = () => downloadCSV(`${d.account.name}-ledger.csv`, [['Date', 'Voucher', 'Details', 'Against', 'Debit', 'Credit', 'Balance'], ['', '', 'Opening balance', '', '', '', d.opening], ...d.rows.map((r: any) => [r.date, r.voucher_no, r.description, r.counter, r.debit || '', r.credit || '', r.balance]), ['', '', 'Closing balance', '', d.totals.debit, d.totals.credit, d.closing]]);
  const o = owes(d.closing);
  return (
    <>
      <div className="mb-8 no-print"><Link to="/parties" className="small muted">← Parties</Link></div>
      <PageHeader title={d.account.name} sub={`Ledger · ${CAT_LABEL[d.account.category] || d.account.category}`}>
        <Button icon="download" onClick={csv}>CSV</Button>
        <Button icon="print" onClick={() => window.print()}>Print</Button>
      </PageHeader>
      <div className="row wrap mb-16 no-print">
        <Segmented value={all ? 'all' : 'range'} onChange={(v) => setAll(v === 'all')} options={[{ value: 'range', label: 'Date range' }, { value: 'all', label: 'Everything' }]} />
        {!all && <><DateInput sm value={from} onChange={(v) => setFrom(v)} style={{ width: 150 }} /><span className="muted">to</span><DateInput sm value={to} onChange={(v) => setTo(v)} style={{ width: 150 }} /></>}
      </div>
      <div className="grid g3 kpi-grid mb-16">
        <Stat small label="Opening" value={inr(d.opening)} />
        <Stat small label="Debit / Credit" value={`${inr(d.totals.debit)} / ${inr(d.totals.credit)}`} />
        <Stat small accent label="Closing balance" value={inr(Math.abs(d.closing))} sub={o.amount ? o.text : 'Settled'} />
      </div>
      <Card pad={false} flush>
        <Table rows={d.rows} rowKey={(r: any) => r.id} onRowClick={(r: any) => navigate(`/transactions?id=${r.voucher_id}`)} empty={<Empty title="No entries in this period" />}
          cols={[
            { key: 'date', header: 'Date', render: (r: any) => <span className="nowrap">{fmtDate(r.date)}</span> },
            { key: 'det', header: 'Details', render: (r: any) => <><span className="ellipsis" style={{ display: 'block', maxWidth: 380 }}>{r.item || r.description}</span><span className="sub">{[r.counter, r.farm, r.qty ? `${r.qty} × ${r.rate ?? ''}` : ''].filter(Boolean).join(' · ')}</span></> },
            { key: 'dr', header: 'Debit', num: true, render: (r: any) => (r.debit ? inr(r.debit, 2) : '') },
            { key: 'cr', header: 'Credit', num: true, render: (r: any) => (r.credit ? inr(r.credit, 2) : '') },
            { key: 'bal', header: 'Balance', num: true, render: (r: any) => <b>{inr(r.balance, 2)}</b> },
          ]} />
      </Card>
    </>
  );
}
