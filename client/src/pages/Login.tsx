import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button, Field, Input, PasswordInput } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await login(username.trim(), password); } catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <div className="login">
      <div className="login-art">
        <img src="/logo.png" alt="Rooster's Field" />
        <div className="col gap-16">
          <h1>Run every farm, bill and batch <em>in one place.</em></h1>
          <p>Embrace Nature, Nurture A Healthy Generation.</p>
        </div>
        <p className="small">Rooster’s Field · Near New Bus Stand, Edakkara</p>
      </div>
      <div className="login-form">
        <form className="login-card col gap-16" onSubmit={submit}>
          <div>
            <h2>Welcome back</h2>
            <p className="muted">Sign in to continue to your farm dashboard.</p>
          </div>
          <Field label="Username"><Input value={username} onChange={(e) => setU(e.target.value)} autoFocus autoComplete="username" placeholder="admin" /></Field>
          <Field label="Password"><PasswordInput value={password} onChange={(e) => setP(e.target.value)} autoComplete="current-password" placeholder="••••••••" /></Field>
          {err && <div className="form-error">{err}</div>}
          <Button type="submit" variant="primary" size="lg" loading={busy} disabled={!username || !password}>Sign in</Button>
        </form>
      </div>
    </div>
  );
}
