import { createContext, createElement, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { MouseEvent, ReactNode, AnchorHTMLAttributes } from 'react';

/** Minimal history-API router: path params, <Link>, navigate(). */
const subscribe = (fn: () => void) => {
  window.addEventListener('popstate', fn);
  window.addEventListener('rf:nav', fn);
  return () => { window.removeEventListener('popstate', fn); window.removeEventListener('rf:nav', fn); };
};
const getHref = () => window.location.pathname + window.location.search;

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === getHref()) return;
  if (opts.replace) window.history.replaceState({}, '', to); else window.history.pushState({}, '', to);
  window.dispatchEvent(new Event('rf:nav'));
  window.scrollTo({ top: 0 });
}

export function useLocation() {
  const href = useSyncExternalStore(subscribe, getHref);
  return useMemo(() => { const [path, search = ''] = href.split('?'); return { path, search: new URLSearchParams(search) }; }, [href]);
}

export function Link({ to, children, onClick, ...rest }: { to: string; children?: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return createElement('a', {
    href: to, ...rest,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || rest.target === '_blank') return;
      e.preventDefault();
      navigate(to);
    },
  }, children);
}

const ParamsCtx = createContext<Record<string, string>>({});
export const useParams = () => useContext(ParamsCtx);

export interface RouteDef { path: string; element: ReactNode | (() => ReactNode) }

function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean), b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function Routes({ routes, fallback }: { routes: RouteDef[]; fallback: ReactNode }) {
  const { path } = useLocation();
  for (const r of routes) {
    const params = match(r.path, path);
    if (params) return createElement(ParamsCtx.Provider, { value: params }, typeof r.element === 'function' ? (r.element as () => ReactNode)() : r.element);
  }
  return createElement('div', null, fallback);
}

export function useTitle(title: string) {
  useEffect(() => { document.title = `${title} · Rooster's Field`; }, [title]);
}
