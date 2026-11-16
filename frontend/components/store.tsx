'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@/lib/types';

/* ---------------- Auth ---------------- */

type Tab = 'signin' | 'signup';
type Modal = { open: boolean; tab: Tab; next: string | null };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  modal: Modal;
  openAuth: (tab?: Tab, next?: string | null) => void;
  closeAuth: () => void;
  setTab: (t: Tab) => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>({ open: false, tab: 'signin', next: null });

  useEffect(() => {
    let alive = true;
    fetch('/api/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setUser(d.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const openAuth = useCallback((tab: Tab = 'signin', next: string | null = null) => setModal({ open: true, tab, next }), []);
  const closeAuth = useCallback(() => setModal((m) => ({ ...m, open: false })), []);
  const setTab = useCallback((tab: Tab) => setModal((m) => ({ ...m, tab })), []);

  const value = useMemo(
    () => ({ user, loading, setUser, modal, openAuth, closeAuth, setTab }),
    [user, loading, modal, openAuth, closeAuth, setTab]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside Providers');
  return ctx;
}

/* ---------------- Cart (lives in the browser; the server prices it) ---------------- */

type Item = { product_id: number; quantity: number };

type CartCtx = {
  items: Item[];
  ready: boolean;
  count: number;
  add: (productId: number, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ka_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* corrupted storage: start with an empty bag */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem('ka_cart', JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((productId: number, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product_id === productId);
      if (found) {
        return prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i));
      }
      return [...prev, { product_id: productId, quantity: qty }];
    });
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(99, qty)) } : i))
    );
  }, []);

  const remove = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem('ka_coupon');
  }, []);

  const count = items.reduce((n, i) => n + i.quantity, 0);

  const value = useMemo(
    () => ({ items, ready, count, add, setQty, remove, clear }),
    [items, ready, count, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside Providers');
  return ctx;
}
