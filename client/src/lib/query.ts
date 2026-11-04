import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * A tiny stale-while-revalidate data layer (what most apps use react-query for).
 *  - useQuery(key, fetcher): cached by key, shows old data while refreshing
 *  - invalidate(): after any change, every mounted query refetches
 */
interface Entry { data?: any; error?: Error; at: number }
const cache = new Map<string, Entry>();
let version = 0;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const getVersion = () => version;

export function invalidate() { version++; listeners.forEach((l) => l()); }

export interface QueryResult<T> { data: T | undefined; error: Error | undefined; loading: boolean; refetch: () => void }

export function useQuery<T>(key: unknown[], fetcher: () => Promise<T>, opts: { enabled?: boolean } = {}): QueryResult<T> {
  const k = JSON.stringify(key);
  const v = useSyncExternalStore(subscribe, getVersion);
  const enabled = opts.enabled !== false;
  const [, force] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [loading, setLoading] = useState(enabled && !cache.has(k));

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let cancelled = false;
    if (!cache.get(k)?.data) setLoading(true);
    fetcherRef.current()
      .then((data) => { cache.set(k, { data, at: Date.now() }); })
      .catch((error) => { cache.set(k, { ...(cache.get(k) ?? { at: 0 }), error, at: Date.now() }); })
      .finally(() => { if (!cancelled) { setLoading(false); force((n) => n + 1); } });
    return () => { cancelled = true; };
  }, [k, v, enabled]);

  const refetch = useCallback(() => invalidate(), []);
  const entry = cache.get(k);
  return { data: entry?.data as T | undefined, error: entry?.error, loading, refetch };
}

export function clearCache() { cache.clear(); invalidate(); }
