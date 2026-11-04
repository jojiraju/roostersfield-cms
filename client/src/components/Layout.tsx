import React, { useEffect, useState } from 'react';
import { Link, useLocation } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/data';
import { EntryProvider, useEntry } from './EntryModal';
import { Button, Confirm, Icon } from './ui';
import type { IconName } from './ui';

const NAV: Array<{ label?: string; to: string; icon: IconName; text: string; admin?: boolean }> = [
  { label: 'Overview', to: '/', icon: 'home', text: 'Dashboard' },
  { to: '/daily', icon: 'calendar', text: 'Daily report' },
  { to: '/batches', icon: 'egg', text: 'Batches' },
  { to: '/farms', icon: 'barn', text: 'Farms' },
  { label: 'Business', to: '/sales', icon: 'receipt', text: 'Sales bills' },
  { to: '/transactions', icon: 'list', text: 'Transactions' },
  { to: '/cashbook', icon: 'wallet', text: 'Cash book' },
  { to: '/parties', icon: 'users', text: 'Parties' },
  { label: 'Insights', to: '/reports', icon: 'chart', text: 'Reports' },
  { to: '/settings', icon: 'settings', text: 'Settings' },
];

const isActive = (path: string, to: string) => (to === '/' ? path === '/' : path === to || path.startsWith(to + '/'));

function NewEntryButton({ className }: { className?: string }) {
  const { open } = useEntry();
  return <Button variant="primary" icon="plus" className={className} onClick={() => open()}>New entry</Button>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { path } = useLocation();
  const { user, logout } = useAuth();
  const settings = useSettings().data;
  const { open: openEntry } = useEntry();
  const [menu, setMenu] = useState(false);
  const [askOut, setAskOut] = useState(false);
  useEffect(() => setMenu(false), [path]);

  const current = NAV.find((n) => isActive(path, n.to));
  return (
    <div className="app">
      <aside className={`sidebar no-print ${menu ? 'open' : ''}`}>
        <div className="brand">
          <img src="/logo.png" alt="" />
          <div>
            <b>{settings?.company_name || "Rooster's Field"}</b>
            <span>{settings?.company_place || 'EDAKKARA'}</span>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <React.Fragment key={n.to}>
              {n.label && <div className="nav-label">{n.label}</div>}
              <Link to={n.to} className={`nav-item ${isActive(path, n.to) ? 'active' : ''}`}><Icon name={n.icon} />{n.text}</Link>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
          <div className="who"><b>{user?.name}</b><span>{user?.role}</span></div>
          <button className="icon-btn" style={{ color: '#cfdccb' }} onClick={() => setAskOut(true)} title="Sign out" aria-label="Sign out"><Icon name="logout" /></button>
        </div>
      </aside>
      {askOut && <Confirm danger title="Sign out?" message="You will need to sign in again to continue." confirmLabel="Sign out" onClose={() => setAskOut(false)} onConfirm={() => logout()} />}
      <div className={`scrim ${menu ? 'open' : ''}`} onClick={() => setMenu(false)} />
      <div className="main">
        <header className="topbar no-print">
          <button className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label="Menu"><Icon name="menu" /></button>
          <span className="crumb">{current?.text ?? ''}</span>
          <span className="grow" />
          <span className="small muted hide-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <Link to="/sales/new" className="btn btn-dark hide-sm"><Icon name="scale" />New bill</Link>
          <NewEntryButton className="hide-sm" />
        </header>
        <main className="page">{children}</main>
      </div>
      <nav className="bottomnav no-print">
        <Link to="/" className={isActive(path, '/') ? 'active' : ''}><Icon name="home" />Home</Link>
        <Link to="/batches" className={isActive(path, '/batches') ? 'active' : ''}><Icon name="egg" />Batches</Link>
        <a className="fab" href="#new" onClick={(e) => { e.preventDefault(); openEntry(); }}><span><Icon name="plus" /></span></a>
        <Link to="/sales" className={isActive(path, '/sales') ? 'active' : ''}><Icon name="receipt" />Sales</Link>
        <a href="#menu" onClick={(e) => { e.preventDefault(); setMenu(true); }}><Icon name="menu" />More</a>
      </nav>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return <EntryProvider><Shell>{children}</Shell></EntryProvider>;
}
