import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, getToken, setToken } from './api';
import { clearCache } from './query';

export interface User { id: number; username: string; name: string; role: 'admin' | 'staff' }
interface AuthCtx { user: User | null; ready: boolean; login: (username: string, password: string) => Promise<void>; logout: () => void }
const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => { setToken(null); setUser(null); clearCache(); }, []);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api<User>('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
    const onLogout = () => logout();
    window.addEventListener('rf:logout', onLogout);
    return () => window.removeEventListener('rf:logout', onLogout);
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const r = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { username, password } });
    setToken(r.token); clearCache(); setUser(r.user);
  }, []);

  return createElement(Ctx.Provider, { value: { user, ready, login, logout } }, children);
}
