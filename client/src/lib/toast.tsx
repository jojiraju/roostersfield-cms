import { createContext, createElement, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Kind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: Kind; text: string }
const Ctx = createContext<{ toast: (text: string, kind?: Kind) => void }>({ toast: () => {} });
export const useToast = () => useContext(Ctx).toast;

let counter = 0;
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((text: string, kind: Kind = 'success') => {
    const id = ++counter;
    setItems((x) => [...x, { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3200);
  }, []);
  return createElement(Ctx.Provider, { value: { toast } }, children,
    createElement('div', { className: 'toasts', role: 'status', 'aria-live': 'polite' },
      items.map((t) => createElement('div', { key: t.id, className: `toast toast-${t.kind}`, onClick: () => setItems((x) => x.filter((y) => y.id !== t.id)) }, t.text))));
}
