import React, { useRef, useState } from 'react';
import { api, downloadFile } from '../lib/api';
import { clearCache, invalidate, useQuery } from '../lib/query';
import { useTitle } from '../lib/router';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/data';
import { fmtDate, num } from '../lib/format';
import { Alert, PasswordInput, Badge, Button, Card, CardHead, ErrorBox, Field, Icon, Input, Modal, NumInput, PageHeader, PageLoading, Select } from '../components/ui';

export default function Settings() {
  useTitle('Settings');
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  return (
    <>
      <PageHeader title="Settings" sub="Company details, rates, users and your data." />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="col gap-16">
          {admin && <CompanyCard />}
          <PasswordCard />
        </div>
        <div className="col gap-16">
          {admin && <UsersCard />}
          {admin && <DataCard />}
        </div>
      </div>
    </>
  );
}

function CompanyCard() {
  const q = useSettings();
  const toast = useToast();
  const [f, setF] = useState<Record<string, string> | null>(null);
  const [busy, setBusy] = useState(false);
  const s = q.data;
  React.useEffect(() => { if (s && !f) setF({ ...(s as any), feed_types: (s.feed_types || []).join(', ') }); }, [s, f]);
  if (!f) return <Card><PageLoading /></Card>;
  const set = (k: string) => (v: string) => setF((x) => ({ ...x!, [k]: v }));
  const save = async () => {
    setBusy(true);
    try { await api('/settings', { method: 'PUT', body: f }); invalidate(); toast('Settings saved'); } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Card pad={false}>
      <CardHead title="Company & rates" icon="settings" />
      <div className="card-body">
        <div className="form-grid">
          <Field label="Company name"><Input value={f.company_name} onChange={(e) => set('company_name')(e.target.value)} /></Field>
          <Field label="Place"><Input value={f.company_place} onChange={(e) => set('company_place')(e.target.value)} /></Field>
          <Field label="Address" className="full"><Input value={f.address} onChange={(e) => set('address')(e.target.value)} /></Field>
          <Field label="Phones"><Input value={f.phones} onChange={(e) => set('phones')(e.target.value)} /></Field>
          <Field label="GSTIN"><Input value={f.gstin} onChange={(e) => set('gstin')(e.target.value.toUpperCase())} /></Field>
          <Field label="Feed bag weight"><NumInput value={f.feed_bag_kg} onChange={set('feed_bag_kg')} suffix="kg" /></Field>
          <Field label="Harvest alert after"><NumInput value={f.harvest_alert_days} onChange={set('harvest_alert_days')} suffix="days" decimals={false} /></Field>
          <Field label="Integration ₹ per kg"><NumInput value={f.integration_rate_per_kg} onChange={set('integration_rate_per_kg')} prefix="₹" /></Field>
          <Field label="Integration ₹ per bird (broast)"><NumInput value={f.integration_rate_per_bird_broast} onChange={set('integration_rate_per_bird_broast')} prefix="₹" /></Field>
          <Field label="Feed types" className="full" help="Separate with commas"><Input value={f.feed_types} onChange={(e) => set('feed_types')(e.target.value)} /></Field>
          <Field label="Next bill number"><NumInput value={f.next_bill_no} onChange={set('next_bill_no')} decimals={false} /></Field>
        </div>
        <div className="row mt-16" style={{ justifyContent: 'flex-end' }}><Button variant="primary" loading={busy} onClick={save}>Save settings</Button></div>
      </div>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [f, setF] = useState({ current: '', next: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Card pad={false}>
      <CardHead title="Change my password" icon="key" />
      <div className="card-body col gap-16" style={{ gap: 14 }}>
        <Field label="Current password"><PasswordInput value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" /></Field>
        <Field label="New password" help="At least 6 characters"><PasswordInput value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} autoComplete="new-password" /></Field>
        {err && <div className="form-error">{err}</div>}
        <div><Button loading={busy} disabled={!f.current || f.next.length < 6} onClick={async () => {
          setBusy(true); setErr('');
          try { await api('/auth/password', { method: 'POST', body: f }); setF({ current: '', next: '' }); toast('Password changed'); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
        }}>Update password</Button></div>
      </div>
    </Card>
  );
}

function UsersCard() {
  const q = useQuery<any[]>(['users'], () => api('/users'));
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  return (
    <Card pad={false}>
      <CardHead title="Users" icon="users" right={<Button size="sm" icon="plus" onClick={() => setAdding(true)}>Add</Button>} />
      <div className="card-body">
        {!q.data ? <PageLoading /> : q.data.map((u) => (
          <div key={u.id} className="list-row">
            <span className="avatar" style={{ width: 36, height: 36 }}>{u.name[0].toUpperCase()}</span>
            <div className="grow"><div className="medium">{u.name}</div><div className="tiny muted">@{u.username}</div></div>
            <Badge tone={u.role === 'admin' ? 'orange' : 'gray'}>{u.role}</Badge>
            <Button size="sm" variant="ghost" onClick={async () => { try { await api(`/users/${u.id}`, { method: 'PUT', body: { active: !u.active } }); invalidate(); toast(u.active ? 'User disabled' : 'User enabled'); } catch (e) { toast((e as Error).message, 'error'); } }}>{u.active ? 'Disable' : 'Enable'}</Button>
          </div>
        ))}
      </div>
      {adding && <AddUser onClose={() => setAdding(false)} />}
    </Card>
  );
}

function AddUser({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', username: '', password: '', role: 'staff' });
  const [err, setErr] = useState('');
  return (
    <Modal title="Add user" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={async () => { try { await api('/users', { method: 'POST', body: f }); invalidate(); toast('User added'); onClose(); } catch (e) { setErr((e as Error).message); } }}>Add user</Button></>}>
      <div className="form-grid">
        <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Username"><Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} /></Field>
        <Field label="Password"><PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Field label="Role"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="staff">Staff — can enter data</option><option value="admin">Admin — can delete & manage</option></Select></Field>
      </div>
      {err && <div className="form-error mt-16">{err}</div>}
    </Modal>
  );
}

function DataCard() {
  const toast = useToast();
  const stats = useQuery<any>(['stats'], () => api('/system/stats'));
  const file = useRef<HTMLInputElement>(null);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const s = stats.data;

  const upload = async (f: File) => {
    setBusy(true); setErr(''); setResult(null);
    try {
      const r = await api('/import/excel?replace=' + (replace ? '1' : '0'), { method: 'POST', raw: await f.arrayBuffer() });
      setResult(r); clearCache(); toast('Excel imported');
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); if (file.current) file.current.value = ''; }
  };
  return (
    <Card pad={false}>
      <CardHead title="Your data" icon="database" />
      <div className="card-body">
        {s && <div className="small muted mb-16">{num(s.vouchers)} entries · {num(s.farms)} farms · {num(s.batches)} batches{s.firstDate ? ` · ${fmtDate(s.firstDate)} to ${fmtDate(s.lastDate)}` : ''}</div>}
        <div className="row between">
          <div><b>Back up</b><div className="small muted">Download a copy of the whole database.</div></div>
          <Button icon="download" onClick={() => downloadFile('/system/backup', 'roosters-field-backup.db').catch((e) => toast(e.message, 'error'))}>Download</Button>
        </div>
        <hr style={{ border: 0, borderTop: '1px solid var(--line-soft)', margin: '18px 0' }} />
        <b>Import from Excel</b>
        <div className="small muted mb-8">Upload the Rooster’s Field workbook (.xlsx) with the JOURNALS sheet.</div>
        {s && s.vouchers > 0 && <label className="checkbox mb-8"><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />Replace existing data (a backup is saved first)</label>}
        <input ref={file} type="file" accept=".xlsx,.xlsm" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button icon="upload" loading={busy} onClick={() => file.current?.click()} disabled={!!s && s.vouchers > 0 && !replace}>Choose Excel file</Button>
        {err && <div className="form-error mt-12">{err}</div>}
        {result && <div className="mt-12"><Alert tone="ok">Imported {num(result.vouchers ?? 0)} entries{result.farms !== undefined ? `, ${num(result.farms)} farms` : ''}{result.batches !== undefined ? `, ${num(result.batches)} batches` : ''}.{result.warnings?.length ? ` ${result.warnings.length} notes — see below.` : ''}</Alert>{result.warnings?.length > 0 && <ul className="small muted" style={{ maxHeight: 140, overflow: 'auto' }}>{result.warnings.slice(0, 30).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>}</div>}
      </div>
    </Card>
  );
}
