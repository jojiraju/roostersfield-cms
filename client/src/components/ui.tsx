import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ───────────── Icons (Lucide-style, inline) ───────────── */
const P: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  layers: 'm12 2 10 5-10 5L2 7zM2 12l10 5 10-5M2 17l10 5 10-5',
  barn: 'M3 21V9l9-6 9 6v12M3 21h18M9 21v-7h6v7',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2zM17 14h.01',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  check: 'M20 6 9 17l-5-5',
  chevR: 'm9 18 6-6-6-6',
  chevL: 'm15 18-6-6 6-6',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  egg: 'M12 2C8 2 4 9 4 14a8 8 0 0 0 16 0c0-5-4-12-8-12z',
  bird: 'M16 7h.01M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.3-2.2L3 18.5M20 7l2 .5-2 .5',
  wheat: 'M2 22 16 8M3.5 12.5l2 2M7 9l2 2M10.5 5.5l2 2M12 9.5l2-2 2 2-2 2M15.5 6l2-2 2 2-2 2M19 2.5l2 2',
  pill: 'm10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7',
  rupee: 'M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8',
  swap: 'M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  scale: 'M12 3v18M5 21h14M5 7h14M5 7l-3 8a4 4 0 0 0 6 0zM19 7l-3 8a4 4 0 0 0 6 0z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  unlock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2',
  trend: 'm22 7-8.5 8.5-5-5L2 17M16 7h6v6',
  calendar: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 2v4M8 2v4M3 10h18',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  database: 'M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3zM3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  copy: 'M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  more: 'M12 12h.01M19 12h.01M5 12h.01',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
  coins: 'M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM18.1 10.4A6 6 0 1 1 10.4 18.1M7 6h1v4',
  key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
};

export type IconName = keyof typeof P;
export function Icon({ name, size, className }: { name: IconName | string; size?: number; className?: string }) {
  const d = P[name] || P.info;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {d.split(/(?=M)/).map((seg, i) => <path key={i} d={seg} />)}
    </svg>
  );
}

/* ───────────── Basic building blocks ───────────── */
export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(' ');

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'dark' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  loading?: boolean;
};
export function Button({ variant = 'default', size = 'md', icon, loading, children, className, disabled, type = 'button', ...rest }: BtnProps) {
  const v = variant === 'default' ? '' : `btn-${variant}`;
  const s = size === 'md' ? '' : `btn-${size}`;
  return (
    <button type={type} className={cx('btn', v, s, className)} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spin" /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className, pad = true, flush, onClick }: { children: React.ReactNode; className?: string; pad?: boolean; flush?: boolean; onClick?: () => void }) {
  return <div onClick={onClick} className={cx('card', pad && 'card-pad', flush && 'card-flush', onClick && 'card-link', className)} style={onClick ? { cursor: 'pointer' } : undefined}>{children}</div>;
}

export function CardHead({ title, icon, right }: { title: React.ReactNode; icon?: IconName; right?: React.ReactNode }) {
  return (
    <div className="card-head">
      <h2>{icon && <Icon name={icon} size={18} />}{title}</h2>
      {right}
    </div>
  );
}

export function Badge({ tone = 'gray', children, dot }: { tone?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'orange' | 'gray'; children: React.ReactNode; dot?: boolean }) {
  return <span className={`badge badge-${tone}`}>{dot && <i className="dot" />}{children}</span>;
}

export function PageHeader({ title, sub, children }: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="page-actions no-print">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, icon, tone, accent, small }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: IconName; tone?: 'pos' | 'neg' | 'warn'; accent?: boolean; small?: boolean }) {
  return (
    <div className={cx('card', 'kpi', accent && 'accent', small && 'kpi-sm')}>
      <div className="label">
        {icon && <span className="chip-icon"><Icon name={icon} /></span>}
        {label}
      </div>
      <div className={cx('value', tone)}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Field({ label, help, error, children, className }: { label?: React.ReactNode; help?: React.ReactNode; error?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('field', className)}>
      {label && <label>{label}</label>}
      {children}
      {error ? <span className="err">{error}</span> : help ? <span className="help">{help}</span> : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string; sm?: boolean }>(function Input({ prefix, suffix, sm, className, ...rest }, ref) {
  const el = <input ref={ref} className={cx('input', sm && 'sm', className)} {...rest} />;
  if (!prefix && !suffix) return el;
  return (
    <div className="input-affix">
      {prefix && <span className="affix">{prefix}</span>}
      {el}
      {suffix && <span className="suffix">{suffix}</span>}
    </div>
  );
});

export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input {...props} type={show ? 'text' : 'password'} className="input" style={{ paddingLeft: 14, paddingRight: 44 }} />
      <button type="button" className="icon-btn" tabIndex={-1} onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide password' : 'Show password'}
        style={{ position: 'absolute', right: 4, top: 4, width: 36, height: 36, color: 'var(--ink-3)' }}>
        <Icon name={show ? 'eyeOff' : 'eye'} />
      </button>
    </div>
  );
}

/* ───────────── Date picker (calendar popover) ───────────── */
const MONTHS_L = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const todayIso = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); };
const parseIso = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? { y: +v.slice(0, 4), m: +v.slice(5, 7) - 1, d: +v.slice(8, 10) } : null);

export function DateInput({ value, onChange, sm, style, placeholder = 'Select date', 'aria-label': ariaLabel }: { value: string; onChange: (v: string) => void; sm?: boolean; style?: React.CSSProperties; placeholder?: string; 'aria-label'?: string }) {
  const [open, setOpen] = useState(false);
  const cur = parseIso(value);
  const [view, setView] = useState(() => { const b = cur ?? parseIso(todayIso())!; return { y: b.y, m: b.m }; });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const c = parseIso(value) ?? parseIso(todayIso())!;
    setView({ y: c.y, m: c.m });
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k, true);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shift = (n: number) => setView((v) => { const t = v.y * 12 + v.m + n; return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 }; });
  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: Array<{ y: number; m: number; d: number; out: boolean }> = [];
  const prevDays = new Date(view.y, view.m, 0).getDate();
  for (let i = first - 1; i >= 0; i--) cells.push({ y: view.m === 0 ? view.y - 1 : view.y, m: (view.m + 11) % 12, d: prevDays - i, out: true });
  for (let d = 1; d <= days; d++) cells.push({ y: view.y, m: view.m, d, out: false });
  while (cells.length % 7 !== 0 || cells.length < 42) { const n = cells.length - first - days + 1; cells.push({ y: view.m === 11 ? view.y + 1 : view.y, m: (view.m + 1) % 12, d: n, out: true }); }
  const t = todayIso();
  const years = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 10 + i);
  if (!years.includes(view.y)) years.push(view.y);
  years.sort((a, b) => a - b);
  const label = cur ? `${pad2(cur.d)} ${MONTHS_L[cur.m].slice(0, 3)} ${cur.y}` : '';

  return (
    <div className="datepick" ref={ref} style={style}>
      <button type="button" className={cx('input', 'date-trigger', sm && 'sm')} onClick={() => setOpen((o) => !o)} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open}>
        <span className={label ? '' : 'muted'}>{label || placeholder}</span>
        <Icon name="calendar" size={sm ? 16 : 18} />
      </button>
      {open && (
        <div className="cal" role="dialog" aria-label="Choose date">
          <div className="cal-head">
            <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><Icon name="chevL" size={18} /></button>
            <div className="row" style={{ gap: 6 }}>
              <select value={view.m} onChange={(e) => setView({ ...view, m: +e.target.value })} aria-label="Month">{MONTHS_L.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
              <select value={view.y} onChange={(e) => setView({ ...view, y: +e.target.value })} aria-label="Year">{years.map((y) => <option key={y}>{y}</option>)}</select>
            </div>
            <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><Icon name="chevR" size={18} /></button>
          </div>
          <div className="cal-grid cal-dow">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d}>{d}</span>)}</div>
          <div className="cal-grid">
            {cells.map((c, i) => {
              const v = iso(c.y, c.m, c.d);
              return <button type="button" key={i} className={cx('cal-day', c.out && 'out', v === value && 'sel', v === t && 'today')} onClick={() => { onChange(v); setOpen(false); }}>{c.d}</button>;
            })}
          </div>
          <div className="cal-foot">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}>Clear</button>
            <button type="button" onClick={() => { onChange(t); setOpen(false); }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Number input that keeps the raw string (so "12." and "" work) */
export function NumInput({ value, onChange, prefix, suffix, placeholder, sm, decimals = true, autoFocus, className }: { value: string | number; onChange: (v: string) => void; prefix?: string; suffix?: string; placeholder?: string; sm?: boolean; decimals?: boolean; autoFocus?: boolean; className?: string }) {
  return (
    <Input
      inputMode={decimals ? 'decimal' : 'numeric'}
      value={value}
      placeholder={placeholder}
      prefix={prefix}
      suffix={suffix}
      sm={sm}
      autoFocus={autoFocus}
      className={className}
      onChange={(e) => {
        const v = e.target.value.replace(/,/g, '');
        if (v === '' || (decimals ? /^-?\d*\.?\d*$/.test(v) : /^\d*$/.test(v))) onChange(v);
      }}
      onFocus={(e) => e.target.select()}
    />
  );
}

export function Select({ children, sm, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { sm?: boolean }) {
  return <select className={cx('select', sm && 'sm', className)} {...rest}>{children}</select>;
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="input-icon" style={{ minWidth: 220 }}>
      <Icon name="search" />
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: React.ReactNode; count?: number }> }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} className={cx(o.value === value && 'on')} onClick={() => onChange(o.value)} type="button">
          {o.label}{o.count != null && <span className="count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  return (
    <div className="tabs no-print">
      {options.map((o) => <button key={o.value} className={cx(o.value === value && 'on')} onClick={() => onChange(o.value)} type="button">{o.label}</button>)}
    </div>
  );
}

export function Empty({ title, children, icon = 'file' }: { title: string; children?: React.ReactNode; icon?: IconName }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <b>{title}</b>
      {children}
    </div>
  );
}

export function Alert({ tone = 'warn', children, icon }: { tone?: 'warn' | 'info' | 'err' | 'ok'; children: React.ReactNode; icon?: IconName }) {
  return (
    <div className={cx('alert', tone === 'warn' ? '' : tone)}>
      <Icon name={icon || (tone === 'ok' ? 'check' : tone === 'info' ? 'info' : 'alert')} />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return <div className="row" style={{ justifyContent: 'center', padding: 40, color: 'var(--ink-3)' }}><span className="spin" />{label && <span>{label}</span>}</div>;
}

export function Skeleton({ h = 18, w = '100%' }: { h?: number; w?: number | string }) {
  return <div className="skeleton" style={{ height: h, width: w }} />;
}

export function PageLoading() {
  return (
    <div className="col gap-16">
      <Skeleton h={34} w={260} />
      <div className="grid g4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={96} />)}</div>
      <Skeleton h={280} />
    </div>
  );
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <Card>
      <Empty title="Couldn't load this" icon="alert">
        <div className="small">{(error as Error)?.message || String(error)}</div>
        {retry && <div className="mt-12"><Button size="sm" onClick={retry}>Try again</Button></div>}
      </Empty>
    </Card>
  );
}

/* ───────────── Overlays ───────────── */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
}

export function Modal({ title, onClose, children, footer, wide }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEscape(onClose);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cx('modal', wide && 'wide')} role="dialog" aria-modal>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ title, onClose, children, footer }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEscape(onClose);
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drawer" role="dialog" aria-modal>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose }: { title: string; message: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<void> | void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Modal title={title} onClose={onClose} footer={
      <>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={async () => {
          setBusy(true); setErr('');
          try { await onConfirm(); onClose(); } catch (e) { setErr((e as Error).message); setBusy(false); }
        }}>{confirmLabel}</Button>
      </>
    }>
      <div className="ink2">{message}</div>
      {err && <div className="form-error mt-12">{err}</div>}
    </Modal>
  );
}

/* ───────────── Combo (searchable select) ───────────── */
export interface ComboOption { value: number | string; label: string; hint?: string }
export function Combo({ value, onChange, options, placeholder = 'Select…', allowClear, autoFocus }: { value: number | string | null | undefined; onChange: (v: any, opt?: ComboOption) => void; options: ComboOption[]; placeholder?: string; allowClear?: boolean; autoFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hl, setHl] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  const sel = options.find((o) => String(o.value) === String(value ?? ''));
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? options.filter((o) => o.label.toLowerCase().includes(s) || (o.hint || '').toLowerCase().includes(s)) : options).slice(0, 200);
  }, [q, options]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  useEffect(() => { setHl(0); }, [q]);
  useEffect(() => { if (autoFocus) inp.current?.focus(); }, [autoFocus]);

  const pick = (o: ComboOption) => { onChange(o.value, o); setOpen(false); setQ(''); };
  return (
    <div className="combo" ref={ref}>
      <input
        ref={inp}
        className="input"
        value={open ? q : sel?.label || ''}
        placeholder={sel ? sel.label : placeholder}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHl((h) => Math.min(h + 1, list.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
          else if (e.key === 'Enter' && open) { e.preventDefault(); if (list[hl]) pick(list[hl]); }
          else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); setQ(''); }
        }}
        style={{ paddingRight: allowClear && sel ? 36 : undefined }}
      />
      {allowClear && sel && (
        <button type="button" className="icon-btn" style={{ position: 'absolute', right: 4, top: 4, width: 36, height: 36 }} onClick={() => { onChange('', undefined); setQ(''); }} aria-label="Clear"><Icon name="x" size={15} /></button>
      )}
      {open && (
        <div className="combo-menu">
          {list.length === 0 && <div className="combo-empty">No matches</div>}
          {list.map((o, i) => (
            <div key={o.value} className={cx('combo-opt', i === hl && 'hl', String(o.value) === String(value) && 'sel')} onMouseEnter={() => setHl(i)} onMouseDown={(e) => { e.preventDefault(); pick(o); }}>
              <span>{o.label}</span>{o.hint && <small>{o.hint}</small>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── Table ───────────── */
export interface Col<T> { key: string; header: React.ReactNode; render: (row: T, i: number) => React.ReactNode; num?: boolean; width?: number | string; hideSm?: boolean; sort?: (row: T) => number | string; foot?: React.ReactNode }
export function Table<T>({ rows, cols, rowKey, onRowClick, empty, compact, footer, defaultSort }: { rows: T[]; cols: Array<Col<T>>; rowKey: (r: T, i: number) => string | number; onRowClick?: (r: T) => void; empty?: React.ReactNode; compact?: boolean; footer?: boolean; defaultSort?: { key: string; dir: 1 | -1 } }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(defaultSort || null);
  const data = useMemo(() => {
    if (!sort) return rows;
    const c = cols.find((c) => c.key === sort.key);
    if (!c?.sort) return rows;
    const f = c.sort;
    return [...rows].sort((a, b) => {
      const x = f(a), y = f(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, sort, cols]);
  if (!rows.length) return <>{empty ?? <Empty title="Nothing here yet" />}</>;
  return (
    <div className="table-wrap">
      <table className={cx('table', compact && 'compact')}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={cx(c.num && 'num', c.hideSm && 'hide-sm', c.sort && 'sort')} style={{ width: c.width }}
                onClick={c.sort ? () => setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 })) : undefined}>
                {c.header}{sort?.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={rowKey(r, i)} className={cx(onRowClick && 'click')} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {cols.map((c) => <td key={c.key} className={cx(c.num && 'num', c.hideSm && 'hide-sm')}>{c.render(r, i)}</td>)}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>{cols.map((c) => <td key={c.key} className={cx(c.num && 'num', c.hideSm && 'hide-sm')}>{c.foot}</td>)}</tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function Progress({ value, max = 100, tone }: { value: number; max?: number; tone?: 'warn' | 'alert' }) {
  const p = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return <div className={cx('bar', tone === 'warn' && 'bar-warn', tone === 'alert' && 'bar-danger')}><i style={{ width: `${p}%` }} /></div>;
}

/* ───────────── Charts (SVG) ───────────── */
const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
const short = (v: number) => {
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '';
  if (a >= 1e7) return `${s}${+(a / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${s}${+(a / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${s}${+(a / 1e3).toFixed(1)}k`;
  return `${s}${Math.round(a)}`;
};

export interface BarSeries { name: string; color: string; values: number[] }
/** Grouped bar chart w/ optional negatives and a hover tooltip */
export function BarChart({ labels, series, height = 240, fmt = (v: number) => String(v) }: { labels: string[]; series: BarSeries[]; height?: number; fmt?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = height, L = 46, R = 8, T = 10, B = 26;
  const all = series.flatMap((s) => s.values);
  const max = niceMax(Math.max(0, ...all));
  const minRaw = Math.min(0, ...all);
  const min = minRaw < 0 ? -niceMax(-minRaw) : 0;
  const y = (v: number) => T + ((max - v) / (max - min || 1)) * (H - T - B);
  const iw = (W - L - R) / Math.max(labels.length, 1);
  const bw = Math.min(26, (iw * 0.72) / series.length);
  const ticks = 4;
  return (
    <div style={{ position: 'relative' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = min + ((max - min) * i) / ticks;
          return (
            <g key={i}>
              <line className="grid-line" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
              <text x={L - 8} y={y(v) + 4} textAnchor="end">{short(v)}</text>
            </g>
          );
        })}
        {labels.map((lb, i) => {
          const cxm = L + iw * i + iw / 2;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={L + iw * i} y={T} width={iw} height={H - T - B} fill={hover === i ? 'rgba(38,64,43,.05)' : 'transparent'} />
              {series.map((s, j) => {
                const v = s.values[i] || 0;
                const x = cxm - (bw * series.length) / 2 + j * bw + 1;
                const y0 = y(0), y1 = y(v);
                return <rect key={j} x={x} y={Math.min(y0, y1)} width={bw - 2} height={Math.max(Math.abs(y1 - y0), v ? 1 : 0)} rx={4} fill={s.color} opacity={hover == null || hover === i ? 1 : 0.55} />;
              })}
              <text x={cxm} y={H - 8} textAnchor="middle">{lb}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: `${((L + iw * hover + iw / 2) / W) * 100}%`, top: 24 }}>
          <b>{labels[hover]}</b>
          {series.map((s) => <div key={s.name}><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: s.color, marginRight: 6 }} />{s.name}: {fmt(s.values[hover] || 0)}</div>)}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: Array<{ name: string; color: string }> }) {
  return <div className="legend">{items.map((i) => <span key={i.name}><i style={{ background: i.color }} />{i.name}</span>)}</div>;
}

/** Horizontal stacked bar — for cost breakdowns */
export function StackBar({ parts, height = 14 }: { parts: Array<{ name: string; value: number; color: string }>; height?: number }) {
  const total = parts.reduce((a, p) => a + Math.max(p.value, 0), 0) || 1;
  return (
    <div style={{ display: 'flex', height, borderRadius: 99, overflow: 'hidden', background: '#ece7d9', gap: 2 }}>
      {parts.filter((p) => p.value > 0).map((p) => <div key={p.name} title={p.name} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
    </div>
  );
}

export function Donut({ parts, size = 150, center }: { parts: Array<{ name: string; value: number; color: string }>; size?: number; center?: React.ReactNode }) {
  const total = parts.reduce((a, p) => a + Math.max(p.value, 0), 0) || 1;
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 140 140" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#ece7d9" strokeWidth="16" />
        {parts.filter((p) => p.value > 0).map((p) => {
          const len = (p.value / total) * c;
          const el = <circle key={p.name} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      {center && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{center}</div>}
    </div>
  );
}

export function Sparkline({ values, color = 'var(--forest-600)', w = 90, h = 28 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return null;
  const mn = Math.min(...values), mx = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 6)}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export const PALETTE = { green: '#43714b', orange: '#f26a21', amber: '#e5a823', blue: '#3b78c4', purple: '#7d5bbd', red: '#c8452f', gray: '#a9a58f', teal: '#2b9a8f' };
