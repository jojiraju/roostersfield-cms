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
          <Field label="Extra chicks supplied" help="Hatcheries add a few free birds; daily reports count them"><NumInput value={f.chick_extra_pct} onChange={set('chick_extra_pct')} suffix="%" /></Field>
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
  const [mode, setMode] = useState<'update' | 'replace'>('update');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const dfile = useRef<HTMLInputElement>(null);
  const [dbusy, setDbusy] = useState(false);
  const [dres, setDres] = useState<any>(null);
  const [derr, setDerr] = useState('');
  const s = stats.data;
  const uploadDaily = async (f: File) => {
    setDbusy(true); setDerr(''); setDres(null);
    try {
      const r = await api('/import/daily', { method: 'POST', raw: await f.arrayBuffer() });
      setDres(r); clearCache(); toast('Daily reports imported');
    } catch (e) { setDerr((e as Error).message); } finally { setDbusy(false); if (dfile.current) dfile.current.value = ''; }
  };
  const hasData = !!s && s.vouchers > 0;

  const upload = async (f: File) => {
    setBusy(true); setErr(''); setResult(null);
    try {
      const q = hasData ? (mode === 'update' ? '?mode=update' : '?replace=1') : '?replace=0';
      const r = await api('/import/excel' + q, { method: 'POST', raw: await f.arrayBuffer() });
      setResult(r); clearCache(); toast(r.mode === 'update' ? 'Excel updated' : 'Excel imported');
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
        <b>{hasData ? 'Update from Excel' : 'Import from Excel'}</b>
        <div className="small muted mb-8">Upload the Rooster’s Field workbook (.xlsx) with the JOURNALS sheet.</div>
        {hasData && (
          <div className="col mb-8" style={{ gap: 6 }}>
            <label className="checkbox"><input type="radio" name="impmode" checked={mode === 'update'} onChange={() => setMode('update')} /><span><b>Add new entries</b> — keeps everything already here, adds what is new and applies corrected amounts</span></label>
            <label className="checkbox"><input type="radio" name="impmode" checked={mode === 'replace'} onChange={() => setMode('replace')} /><span><b>Replace everything</b> — start over from the workbook, including daily reports (a backup is saved first)</span></label>
          </div>
        )}
        <input ref={file} type="file" accept=".xlsx,.xlsm" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button icon="upload" loading={busy} onClick={() => file.current?.click()}>Choose Excel file</Button>
        {err && <div className="form-error mt-12">{err}</div>}
        {result?.mode === 'update' && (
          <div className="mt-12">
            <Alert tone="ok">{result.added || result.corrected ? <>Added {num(result.added)} new entries{result.corrected ? `, corrected ${num(result.corrected)}` : ''}{result.newBatches ? `, started ${num(result.newBatches)} new batches` : ''}. {num(result.unchanged)} entries were already up to date.</> : <>Already up to date — nothing new in this workbook.</>}</Alert>
            {result.keptNotInWorkbook > 0 && <div className="small muted mt-8">{num(result.keptNotInWorkbook)} entries here are no longer in the workbook. They were kept, not deleted: {result.details?.notInWorkbook?.slice(0, 6).map((x: string) => x.replace('|', ' · ')).join('; ')}.</div>}
            {result.details?.corrected?.length > 0 && <details className="small muted mt-8"><summary>Corrected entries ({result.details.corrected.length})</summary><ul style={{ maxHeight: 140, overflow: 'auto' }}>{result.details.corrected.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></details>}
            {result.warnings?.length > 0 && <details className="small muted mt-8"><summary>{result.warnings.length} notes</summary><ul style={{ maxHeight: 140, overflow: 'auto' }}>{result.warnings.slice(0, 30).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul></details>}
          </div>
        )}
        {result && result.mode !== 'update' && <div className="mt-12"><Alert tone="ok">Imported {num(result.vouchers ?? 0)} entries{result.farms !== undefined ? `, ${num(result.farms)} farms` : ''}{result.batches !== undefined ? `, ${num(result.batches)} batches` : ''}.{result.warnings?.length ? ` ${result.warnings.length} notes — see below.` : ''}</Alert>{result.warnings?.length > 0 && <ul className="small muted" style={{ maxHeight: 140, overflow: 'auto' }}>{result.warnings.slice(0, 30).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>}</div>}
        <hr style={{ border: 0, borderTop: '1px solid var(--line-soft)', margin: '18px 0' }} />
        <b>Import farm daily reports</b>
        <div className="small muted mb-8">Upload the “Daily report” workbook (one sheet per farm). Each sheet is matched to its batch by farm name and placement date. Days you already edited here are kept.</div>
        <input ref={dfile} type="file" accept=".xlsx,.xlsm" hidden onChange={(e) => e.target.files?.[0] && uploadDaily(e.target.files[0])} />
        <Button icon="upload" loading={dbusy} onClick={() => dfile.current?.click()}>Choose daily report file</Button>
        {derr && <div className="form-error mt-12">{derr}</div>}
        {dres && (
          <div className="mt-12">
            <Alert tone="ok">Imported {num(dres.daysImported)} days across {num(dres.matched?.length ?? 0)} of {num(dres.sheets)} farm sheets.{dres.keptEdited ? ` ${num(dres.keptEdited)} days you edited here were kept.` : ''}</Alert>
            {dres.unmatched?.length > 0 && <Alert tone="warn">{dres.unmatched.length} sheet{dres.unmatched.length === 1 ? '' : 's'} could not be matched to a batch: {dres.unmatched.map((x: any) => `${x.sheet} (${x.reason})`).join('; ')}</Alert>}
            {dres.warnings?.length > 0 && <details className="small muted mt-8"><summary>{dres.warnings.length} notes</summary><ul style={{ maxHeight: 140, overflow: 'auto' }}>{dres.warnings.slice(0, 30).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul></details>}
          </div>
        )}
      </div>
    </Card>
  );
}
