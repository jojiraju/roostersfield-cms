import React, { useState } from 'react';
import { api } from '../lib/api';
import { invalidate } from '../lib/query';
import { navigate, useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { fixed, inr, num } from '../lib/format';
import { useAccounts, useFarms } from '../lib/data';
import type { Farm } from '../lib/types';
import { Badge, Button, Card, Combo, Empty, ErrorBox, Field, Icon, Input, Modal, NumInput, PageHeader, PageLoading } from '../components/ui';

export default function Farms() {
  useTitle('Farms');
  const q = useFarms();
  const [editing, setEditing] = useState<Farm | 'new' | null>(null);
  if (q.error && !q.data) return <ErrorBox error={q.error} retry={q.refetch} />;
  if (!q.data) return <PageLoading />;
  return (
    <>
      <PageHeader title="Farms" sub="Your contract farms and farmers.">
        <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add farm</Button>
      </PageHeader>
      {q.data.length === 0 ? <Card><Empty title="No farms yet" icon="barn">Add your first contract farm to start placing batches.</Empty></Card> : (
        <div className="grid g-farms">
          {q.data.map((f) => (
            <Card key={f.id} className="farm-card" onClick={() => (f.running ? navigate(`/batches/${f.running.id}`) : setEditing(f))}>
              <div className="top">
                <span className="dot-lg"><Icon name="barn" /></span>
                <div className="grow"><h3>{f.name}</h3><div className="small muted">{f.farmer_name || 'Farmer not set'}{f.location ? ` · ${f.location}` : ''}</div></div>
                {!f.active ? <Badge>Inactive</Badge> : f.running ? <Badge tone="green" dot>Day {f.running.ageDays ?? 0}</Badge> : <Badge tone="amber">Empty</Badge>}
              </div>
              <div className="mini-stats">
                <div><small>Batches</small><b>{f.batchCount}</b></div>
                <div><small>Avg FCR</small><b>{fixed(f.lifetime.avgFcr)}</b></div>
                <div><small>Profit/kg</small><b className={(f.lifetime.profitPerKg ?? 0) < 0 ? 'neg' : ''}>{f.lifetime.profitPerKg === null ? '—' : fixed(f.lifetime.profitPerKg)}</b></div>
              </div>
              <div className="row between small">
                <span className="muted">{f.running ? `${num(f.running.placed_qty)} birds growing` : `Lifetime profit ${inr(f.lifetime.profit)}`}</span>
                <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); setEditing(f); }}><Icon name="edit" />Edit</button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <FarmForm farm={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function FarmForm({ farm, onClose }: { farm: Farm | null; onClose: () => void }) {
  const toast = useToast();
  const farmers = useAccounts('farmer').data ?? [];
  const [f, setF] = useState({
    name: farm?.name ?? '', farmerName: farm?.farmer_name ?? '', farmerAccountId: farm?.farmer_account_id ? String(farm.farmer_account_id) : '',
    phone: farm?.phone ?? '', location: farm?.location ?? '', capacity: farm?.capacity ? String(farm.capacity) : '', notes: farm?.notes ?? '', active: farm ? !!farm.active : true,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (v: any) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { name: f.name, farmerName: f.farmerName || null, farmerAccountId: f.farmerAccountId ? Number(f.farmerAccountId) : null, phone: f.phone || null, location: f.location || null, capacity: f.capacity ? Number(f.capacity) : null, notes: f.notes || null, active: f.active };
      if (farm) await api(`/farms/${farm.id}`, { method: 'PUT', body }); else await api('/farms', { method: 'POST', body });
      invalidate(); toast(farm ? 'Farm updated' : 'Farm added'); onClose();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Modal title={farm ? `Edit ${farm.name}` : 'Add farm'} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save farm</Button></>}>
      <div className="form-grid">
        <Field label="Farm name" className="full"><Input value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. MAMANKARA FARM" autoFocus /></Field>
        <Field label="Farmer name"><Input value={f.farmerName} onChange={(e) => set('farmerName')(e.target.value)} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => set('phone')(e.target.value)} /></Field>
        <Field label="Farmer’s account" className="full" help="Integration charges are credited to this account. Leave empty to create one from the farmer name."><Combo value={f.farmerAccountId} onChange={set('farmerAccountId')} options={farmers.map((a) => ({ value: a.id, label: a.name }))} allowClear placeholder="Auto-create from farmer name" /></Field>
        <Field label="Location"><Input value={f.location} onChange={(e) => set('location')(e.target.value)} /></Field>
        <Field label="Capacity (birds)"><NumInput value={f.capacity} onChange={set('capacity')} decimals={false} /></Field>
        <Field label="Notes" className="full"><Input value={f.notes} onChange={(e) => set('notes')(e.target.value)} /></Field>
        {farm && <label className="checkbox full"><input type="checkbox" checked={f.active} onChange={(e) => set('active')(e.target.checked)} />Active farm</label>}
      </div>
      {err && <div className="form-error mt-16">{err}</div>}
    </Modal>
  );
}
