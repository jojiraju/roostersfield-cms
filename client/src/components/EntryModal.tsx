import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { useToast } from '../lib/toast';
import { navigate } from '../lib/router';
import { batchLabel, useAccounts, useBatches, useFarms, useSettings } from '../lib/data';
import { inr, owes, todayISO, toNum } from '../lib/format';
import type { VoucherDetail } from '../lib/types';
import { Button, Combo, Field, Icon, Input, Modal, NumInput, Select , DateInput } from './ui';
import type { ComboOption, IconName } from './ui';

export type EntryKind = 'batch' | 'feed' | 'medicine' | 'feed_return' | 'integration' | 'misc' | 'receipt' | 'payment' | 'expense' | 'transfer' | 'journal';
export interface OpenOpts { kind?: EntryKind; batchId?: number; partyId?: number; editId?: number; farmId?: number }

const Ctx = createContext<{ open: (o?: OpenOpts) => void }>({ open: () => {} });
export const useEntry = () => useContext(Ctx);

export function EntryProvider({ children }: { children: React.ReactNode }) {
  const [o, setO] = useState<OpenOpts | null>(null);
  const open = (x: OpenOpts = {}) => setO(x);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {o && <EntryModal opts={o} onClose={() => setO(null)} onPick={(k) => setO({ ...o, kind: k })} />}
    </Ctx.Provider>
  );
}

const TILES: Array<{ group: string; items: Array<{ kind: EntryKind | 'sale'; icon: IconName; title: string; sub: string; tone?: string }> }> = [
  { group: 'Sell', items: [{ kind: 'sale', icon: 'scale', title: 'Sale bill', sub: 'Weigh boxes and bill a trader', tone: 'in' }] },
  {
    group: 'Farm & batch', items: [
      { kind: 'batch', icon: 'egg', title: 'New batch', sub: 'Place chicks at a farm', tone: 'hot' },
      { kind: 'feed', icon: 'wheat', title: 'Feed', sub: 'Feed bags sent to a farm' },
      { kind: 'medicine', icon: 'pill', title: 'Medicine', sub: 'Medicines & vaccines' },
      { kind: 'feed_return', icon: 'swap', title: 'Feed return / transfer', sub: 'Back to supplier or to another farm' },
      { kind: 'integration', icon: 'coins', title: 'Integration', sub: 'Farmer growing charges' },
      { kind: 'misc', icon: 'truck', title: 'Farm expense', sub: 'Labour, transport, other' },
    ],
  },
  {
    group: 'Money', items: [
      { kind: 'receipt', icon: 'arrowDown', title: 'Receipt', sub: 'Money received from a party', tone: 'in' },
      { kind: 'payment', icon: 'arrowUp', title: 'Payment', sub: 'Money paid to a party', tone: 'out' },
      { kind: 'expense', icon: 'receipt', title: 'Expense', sub: 'Rent, fuel, salary…', tone: 'out' },
      { kind: 'transfer', icon: 'swap', title: 'Cash ⇄ Bank', sub: 'Move money between accounts' },
      { kind: 'journal', icon: 'book', title: 'Journal', sub: 'Advanced debit / credit entry' },
    ],
  },
];

const TITLES: Record<EntryKind, string> = {
  batch: 'New batch', feed: 'Feed to farm', medicine: 'Medicine / vaccine', feed_return: 'Feed return / transfer', integration: 'Integration (farmer charges)',
  misc: 'Farm expense', receipt: 'Receipt', payment: 'Payment', expense: 'Expense', transfer: 'Cash ⇄ Bank transfer', journal: 'Journal entry',
};

function EntryModal({ opts, onClose, onPick }: { opts: OpenOpts; onClose: () => void; onPick: (k: EntryKind) => void }) {
  const edit = useQuery<VoucherDetail>(['voucher', opts.editId], () => api(`/vouchers/${opts.editId}`), { enabled: !!opts.editId });

  if (opts.editId) {
    if (edit.loading || !edit.data) return <Modal title="Edit entry" onClose={onClose}><div style={{ padding: 30, textAlign: 'center' }}><span className="spin" /></div></Modal>;
    const payload = edit.data.meta?.payload;
    if (!payload) return <Modal title="Edit entry" onClose={onClose}><p className="ink2">This entry was imported from Excel and can’t be edited here. You can delete it and enter it again, or post a journal adjustment.</p></Modal>;
    if (payload.type === 'sale') { navigate(`/sales/new?edit=${opts.editId}`); onClose(); return null; }
    return <EntryForm kind={payload.type} init={payload} editId={opts.editId} onClose={onClose} />;
  }
  if (!opts.kind) {
    return (
      <Modal title="What would you like to record?" onClose={onClose} wide>
        {TILES.map((g) => (
          <div key={g.group} className="mb-16">
            <div className="label mb-8" style={{ textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 11 }}>{g.group}</div>
            <div className="tiles">
              {g.items.map((t) => (
                <button key={t.kind} className={`tile ${t.tone || ''}`} onClick={() => { if (t.kind === 'sale') { navigate('/sales/new'); onClose(); } else onPick(t.kind); }}>
                  <span className="ti"><Icon name={t.icon} /></span>
                  <b>{t.title}</b>
                  <span>{t.sub}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </Modal>
    );
  }
  return <EntryForm kind={opts.kind} preset={opts} onClose={onClose} />;
}

/* ───────────── Form ───────────── */
type Str = Record<string, string>;
interface JLine { accountId: string; debit: string; credit: string }

function EntryForm({ kind, init, preset, editId, onClose }: { kind: EntryKind; init?: any; preset?: OpenOpts; editId?: number; onClose: () => void }) {
  const toast = useToast();
  const settings = useSettings().data;
  const accounts = useAccounts().data ?? [];
  const batchesQ = useBatches().data ?? [];
  const farms = useFarms().data ?? [];
  const s = (v: unknown) => (v === undefined || v === null ? '' : String(v));

  const [f, setF] = useState<Str>(() => ({
    date: s(init?.date) || todayISO(),
    batchId: s(init?.batchId ?? preset?.batchId),
    farmId: s(preset?.farmId),
    supplierId: s(init?.supplierId), toBatchId: s(init?.toBatchId), to: s(init?.to) || 'supplier',
    feedType: s(init?.feedType), bags: s(init?.bags), qty: s(init?.qty), rate: s(init?.rate), item: s(init?.item),
    amount: s(init?.amount), partyId: s(init?.partyId ?? preset?.partyId), accountId: s(init?.accountId),
    expenseAccountId: s(init?.expenseAccountId), farmBatchId: s(init?.farmBatchId), paidFromId: s(init?.paidFromId),
    fromAccountId: s(init?.fromAccountId), toAccountId: s(init?.toAccountId),
    placedQty: s(init?.placedQty), billedQty: '', placementDate: s(init?.placementDate) || todayISO(), notes: '',
    narration: s(init?.narration),
  }));
  const [lines, setLines] = useState<JLine[]>(() => init?.lines ? init.lines.map((l: any) => ({ accountId: s(l.accountId), debit: l.debit ? s(l.debit) : '', credit: l.credit ? s(l.credit) : '' })) : [{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const liquid = accounts.filter((a) => a.category === 'cash' || a.category === 'bank');
  useEffect(() => { // default money account → Cash
    if (!f.accountId && ['receipt', 'payment', 'expense'].includes(kind) && liquid.length) setF((x) => ({ ...x, accountId: String(liquid[0].id) }));
    if (!f.paidFromId && kind === 'misc' && liquid.length) setF((x) => ({ ...x, paidFromId: String(liquid[0].id) }));
    if (!f.fromAccountId && kind === 'transfer' && liquid.length > 1) setF((x) => ({ ...x, fromAccountId: String(liquid[0].id), toAccountId: String(liquid[1].id) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liquid.length]);

  const batchOpts: ComboOption[] = useMemo(() => {
    const cur = Number(f.batchId);
    return [...batchesQ]
      .filter((b) => b.status === 'running' || b.id === cur || b.id === Number(f.toBatchId))
      .sort((a, b) => (a.status === b.status ? a.farm_name.localeCompare(b.farm_name) : a.status === 'running' ? -1 : 1))
      .map((b) => ({ value: b.id, label: batchLabel(b), hint: b.status === 'running' ? (b.ageDays !== null ? `Day ${b.ageDays}` : 'Running') : 'Closed' }));
  }, [batchesQ, f.batchId, f.toBatchId]);
  const supplierOpts = (sub?: string): ComboOption[] =>
    accounts.filter((a) => a.category === 'supplier').sort((a, b) => Number(b.subtype === sub) - Number(a.subtype === sub) || a.name.localeCompare(b.name)).map((a) => ({ value: a.id, label: a.name, hint: a.subtype && a.subtype !== 'other' ? a.subtype : undefined }));
  const liquidOpts: ComboOption[] = liquid.map((a) => ({ value: a.id, label: a.name, hint: inr(a.balance) }));
  const partyOpts: ComboOption[] = accounts
    .filter((a) => ['trader', 'supplier', 'farmer', 'other_asset', 'other_liability', 'loan', 'equity'].includes(a.category))
    .map((a) => { const o = owes(a.balance); return { value: a.id, label: a.name, hint: o.amount ? `${o.text} ${inr(o.amount)}` : a.category.replace('_', ' ') }; });
  const allOpts: ComboOption[] = accounts.map((a) => ({ value: a.id, label: a.name, hint: a.category.replace('_', ' ') }));
  const feedTypes = settings?.feed_types ?? [];

  const suggestion = useQuery<any>(['int-sugg', f.batchId], () => api(`/batches/${f.batchId}/integration-suggestion`), { enabled: kind === 'integration' && !!f.batchId });

  const total = toNum(f.bags) * toNum(f.rate) || toNum(f.qty) * toNum(f.rate);
  const jDebit = lines.reduce((a, l) => a + toNum(l.debit), 0), jCredit = lines.reduce((a, l) => a + toNum(l.credit), 0);

  const build = (): { path: string; body: any } => {
    const n = toNum, id = (v: string) => (v ? Number(v) : undefined);
    const common = { date: f.date, narration: f.narration };
    switch (kind) {
      case 'batch': return { path: '/batches', body: { farmId: id(f.farmId), placementDate: f.placementDate, placedQty: n(f.placedQty), supplierId: id(f.supplierId) ?? null, billedQty: f.supplierId ? (n(f.billedQty) || n(f.placedQty)) : null, rate: f.supplierId ? n(f.rate) : null, notes: f.notes } };
      case 'feed': return { path: 'feed', body: { ...common, supplierId: id(f.supplierId), batchId: id(f.batchId), feedType: f.feedType, bags: n(f.bags), rate: n(f.rate) } };
      case 'medicine': return { path: 'medicine', body: { ...common, supplierId: id(f.supplierId), batchId: id(f.batchId), item: f.item, qty: n(f.qty) || 1, rate: n(f.rate) } };
      case 'feed_return': return { path: 'feed_return', body: { ...common, batchId: id(f.batchId), to: f.to, supplierId: id(f.supplierId), toBatchId: id(f.toBatchId), feedType: f.feedType, bags: n(f.bags), rate: n(f.rate) } };
      case 'integration': return { path: 'integration', body: { ...common, batchId: id(f.batchId), amount: n(f.amount) } };
      case 'misc': return { path: 'misc', body: { ...common, batchId: id(f.batchId), amount: n(f.amount), paidFromId: id(f.paidFromId) } };
      case 'receipt': case 'payment': return { path: kind, body: { ...common, partyId: id(f.partyId), accountId: id(f.accountId), amount: n(f.amount) } };
      case 'expense': return { path: 'expense', body: { ...common, expenseAccountId: id(f.expenseAccountId), accountId: id(f.accountId), amount: n(f.amount), farmBatchId: id(f.farmBatchId) } };
      case 'transfer': return { path: 'transfer', body: { ...common, fromAccountId: id(f.fromAccountId), toAccountId: id(f.toAccountId), amount: n(f.amount) } };
      case 'journal': return { path: 'journal', body: { ...common, lines: lines.filter((l) => l.accountId || l.debit || l.credit).map((l) => ({ accountId: id(l.accountId), debit: n(l.debit), credit: n(l.credit) })) } };
    }
  };

  const submit = async () => {
    setErr('');
    if (kind === 'journal' && Math.abs(jDebit - jCredit) > 0.005) { setErr('Debits and credits must be equal.'); return; }
    setBusy(true);
    try {
      const { path, body } = build();
      if (editId) await api(`/vouchers/${editId}`, { method: 'PUT', body: { ...body, type: kind } });
      else if (kind === 'batch') await api(path, { method: 'POST', body });
      else await api(`/vouchers/${path}`, { method: 'POST', body });
      invalidate();
      toast(editId ? 'Entry updated' : kind === 'batch' ? 'Batch started' : 'Saved');
      onClose();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const bagKg = Number(settings?.feed_bag_kg || 50);
  const batchField = (k = 'batchId', label = 'Farm / batch') => (
    <Field label={label} className="full"><Combo value={f[k]} onChange={set(k)} options={batchOpts} placeholder="Choose the farm batch" autoFocus={!f[k] && !editId} /></Field>
  );
  const dateField = <Field label="Date"><DateInput value={f.date} onChange={(v) => set('date')(v)} /></Field>;
  const narr = <Field label="Note (optional)" className="full"><Input value={f.narration} onChange={(e) => set('narration')(e.target.value)} placeholder="Anything worth remembering" /></Field>;

  const body = (() => {
    switch (kind) {
      case 'batch': return (<>
        <Field label="Farm" className="full"><Combo value={f.farmId} onChange={set('farmId')} options={farms.filter((x) => x.active && !x.running).map((x) => ({ value: x.id, label: x.name, hint: x.farmer_name || undefined }))} placeholder="Choose a farm with no running batch" autoFocus /></Field>
        <Field label="Placement date"><DateInput value={f.placementDate} onChange={(v) => set('placementDate')(v)} /></Field>
        <Field label="Chicks placed"><NumInput value={f.placedQty} onChange={set('placedQty')} decimals={false} placeholder="e.g. 5000" suffix="birds" /></Field>
        <Field label="Chick supplier (optional)" className="full" help="Pick a supplier to also record the chick purchase bill."><Combo value={f.supplierId} onChange={set('supplierId')} options={supplierOpts('chicks')} placeholder="Skip if already entered" allowClear /></Field>
        {f.supplierId && (<>
          <Field label="Billed chicks" help="Includes free/extra chicks, if different"><NumInput value={f.billedQty} onChange={set('billedQty')} decimals={false} placeholder={f.placedQty || '0'} /></Field>
          <Field label="Rate per chick"><NumInput value={f.rate} onChange={set('rate')} prefix="₹" /></Field>
          <Total label="Chick bill" value={(toNum(f.billedQty) || toNum(f.placedQty)) * toNum(f.rate)} />
        </>)}
        <Field label="Notes" className="full"><Input value={f.notes} onChange={(e) => set('notes')(e.target.value)} /></Field>
      </>);
      case 'feed': return (<>
        {batchField()}
        <Field label="Feed supplier" className="full"><Combo value={f.supplierId} onChange={set('supplierId')} options={supplierOpts('feed')} placeholder="Choose supplier" /></Field>
        <Field label="Feed type"><Select value={f.feedType} onChange={(e) => set('feedType')(e.target.value)}><option value="">Choose…</option>{feedTypes.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        {dateField}
        <Field label="Bags" help={f.bags ? `${(toNum(f.bags) * bagKg).toLocaleString('en-IN')} kg` : `${bagKg} kg per bag`}><NumInput value={f.bags} onChange={set('bags')} /></Field>
        <Field label="Rate per bag"><NumInput value={f.rate} onChange={set('rate')} prefix="₹" /></Field>
        <Total label="Bill amount" value={total} />
        {narr}
      </>);
      case 'medicine': return (<>
        {batchField()}
        <Field label="Supplier" className="full"><Combo value={f.supplierId} onChange={set('supplierId')} options={supplierOpts('medicine')} placeholder="Choose supplier" /></Field>
        <Field label="Medicine / vaccine" className="full"><Input value={f.item} onChange={(e) => set('item')(e.target.value)} placeholder="e.g. Ranikhet vaccine" /></Field>
        {dateField}
        <Field label="Quantity"><NumInput value={f.qty} onChange={set('qty')} placeholder="1" /></Field>
        <Field label="Amount / rate" help="Rate per unit — total = qty × rate"><NumInput value={f.rate} onChange={set('rate')} prefix="₹" /></Field>
        <Total label="Bill amount" value={(toNum(f.qty) || 1) * toNum(f.rate)} />
        {narr}
      </>);
      case 'feed_return': return (<>
        <Field label="Return from" className="full"><Combo value={f.batchId} onChange={set('batchId')} options={batchOpts} placeholder="Farm batch" /></Field>
        <Field label="Send to" className="full"><div className="seg"><button type="button" className={f.to === 'supplier' ? 'on' : ''} onClick={() => set('to')('supplier')}>Back to supplier</button><button type="button" className={f.to === 'batch' ? 'on' : ''} onClick={() => set('to')('batch')}>To another farm</button></div></Field>
        {f.to === 'supplier'
          ? <Field label="Supplier" className="full"><Combo value={f.supplierId} onChange={set('supplierId')} options={supplierOpts('feed')} placeholder="Choose supplier" /></Field>
          : <Field label="Destination farm" className="full"><Combo value={f.toBatchId} onChange={set('toBatchId')} options={batchOpts.filter((o) => String(o.value) !== f.batchId)} placeholder="Choose farm batch" /></Field>}
        <Field label="Feed type"><Select value={f.feedType} onChange={(e) => set('feedType')(e.target.value)}><option value="">Choose…</option>{feedTypes.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        {dateField}
        <Field label="Bags"><NumInput value={f.bags} onChange={set('bags')} /></Field>
        <Field label="Rate per bag"><NumInput value={f.rate} onChange={set('rate')} prefix="₹" /></Field>
        <Total label="Value" value={total} />
        {narr}
      </>);
      case 'integration': return (<>
        {batchField()}
        {dateField}
        <Field label="Amount"><NumInput value={f.amount} onChange={set('amount')} prefix="₹" /></Field>
        {suggestion.data && (
          <div className="full col gap-8" style={{ gridColumn: '1 / -1' }}>
            <div className="small muted">Sold so far: {suggestion.data.kg.toLocaleString('en-IN')} kg · {suggestion.data.birds.toLocaleString('en-IN')} birds{suggestion.data.alreadyPosted ? ` · already posted ${inr(suggestion.data.alreadyPosted)}` : ''}</div>
            <div className="chips">
              <button type="button" className="chip" onClick={() => set('amount')(String(suggestion.data.byWeight))}>By weight (₹{suggestion.data.perKg}/kg) · {inr(suggestion.data.byWeight)}</button>
              <button type="button" className="chip" onClick={() => set('amount')(String(suggestion.data.byBird))}>Broast (₹{suggestion.data.perBird}/bird) · {inr(suggestion.data.byBird)}</button>
            </div>
          </div>
        )}
        {narr}
      </>);
      case 'misc': return (<>
        {batchField()}
        {dateField}
        <Field label="Amount"><NumInput value={f.amount} onChange={set('amount')} prefix="₹" /></Field>
        <Field label="Paid from" className="full"><Combo value={f.paidFromId} onChange={set('paidFromId')} options={liquidOpts} /></Field>
        <Field label="What was it for?" className="full"><Input value={f.narration} onChange={(e) => set('narration')(e.target.value)} placeholder="e.g. Labour for catching" /></Field>
      </>);
      case 'receipt': case 'payment': return (<>
        <Field label={kind === 'receipt' ? 'Received from' : 'Paid to'} className="full"><Combo value={f.partyId} onChange={set('partyId')} options={partyOpts} placeholder="Choose party" autoFocus={!f.partyId && !editId} /></Field>
        {dateField}
        <Field label="Amount"><NumInput value={f.amount} onChange={set('amount')} prefix="₹" /></Field>
        <Field label={kind === 'receipt' ? 'Deposited into' : 'Paid from'} className="full"><Combo value={f.accountId} onChange={set('accountId')} options={liquidOpts} /></Field>
        {narr}
      </>);
      case 'expense': return (<>
        <Field label="Expense type" className="full"><Combo value={f.expenseAccountId} onChange={set('expenseAccountId')} options={accounts.filter((a) => a.category === 'expense').map((a) => ({ value: a.id, label: a.name }))} placeholder="e.g. Fuel, Salary, Rent" autoFocus={!editId} /></Field>
        {dateField}
        <Field label="Amount"><NumInput value={f.amount} onChange={set('amount')} prefix="₹" /></Field>
        <Field label="Paid from" className="full"><Combo value={f.accountId} onChange={set('accountId')} options={liquidOpts} /></Field>
        <Field label="Charge to a farm batch (optional)" className="full" help="If set, this cost goes into that batch’s profit & loss instead of general expenses."><Combo value={f.farmBatchId} onChange={set('farmBatchId')} options={batchOpts} allowClear placeholder="General expense" /></Field>
        {narr}
      </>);
      case 'transfer': return (<>
        <Field label="From" className="full"><Combo value={f.fromAccountId} onChange={set('fromAccountId')} options={liquidOpts} /></Field>
        <Field label="To" className="full"><Combo value={f.toAccountId} onChange={set('toAccountId')} options={liquidOpts} /></Field>
        {dateField}
        <Field label="Amount"><NumInput value={f.amount} onChange={set('amount')} prefix="₹" /></Field>
        {narr}
      </>);
      case 'journal': return (<>
        {dateField}
        <Field label="Narration"><Input value={f.narration} onChange={(e) => set('narration')(e.target.value)} /></Field>
        <div className="full" style={{ gridColumn: '1 / -1' }}>
          {lines.map((l, i) => (
            <div key={i} className="row mb-8" style={{ alignItems: 'stretch' }}>
              <div className="grow"><Combo value={l.accountId} onChange={(v) => setLines((x) => x.map((y, j) => (j === i ? { ...y, accountId: v } : y)))} options={allOpts} placeholder="Account" /></div>
              <div style={{ width: 110 }}><NumInput value={l.debit} onChange={(v) => setLines((x) => x.map((y, j) => (j === i ? { ...y, debit: v, credit: v ? '' : y.credit } : y)))} placeholder="Debit" /></div>
              <div style={{ width: 110 }}><NumInput value={l.credit} onChange={(v) => setLines((x) => x.map((y, j) => (j === i ? { ...y, credit: v, debit: v ? '' : y.debit } : y)))} placeholder="Credit" /></div>
              <button type="button" className="icon-btn" onClick={() => setLines((x) => (x.length > 2 ? x.filter((_, j) => j !== i) : x))} aria-label="Remove line"><Icon name="x" size={16} /></button>
            </div>
          ))}
          <div className="row between">
            <Button size="sm" icon="plus" onClick={() => setLines((x) => [...x, { accountId: '', debit: '', credit: '' }])}>Add line</Button>
            <div className={`small strong ${Math.abs(jDebit - jCredit) < 0.005 && jDebit > 0 ? 'pos' : 'neg'}`}>Dr {inr(jDebit)} · Cr {inr(jCredit)}{Math.abs(jDebit - jCredit) > 0.005 ? ` · difference ${inr(Math.abs(jDebit - jCredit))}` : ' · balanced'}</div>
          </div>
        </div>
      </>);
    }
  })();

  return (
    <Modal
      title={editId ? `Edit — ${TITLES[kind]}` : TITLES[kind]}
      onClose={onClose}
      wide={kind === 'journal'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={submit}>{editId ? 'Save changes' : kind === 'batch' ? 'Start batch' : 'Save'}</Button></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="form-grid">{body}</div>
        {err && <div className="form-error mt-16">{err}</div>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="totals full" style={{ gridColumn: '1 / -1' }}>
      <div className="row between"><span className="ink2">{label}</span><span className="grand tnum">{inr(value, 2)}</span></div>
    </div>
  );
}
