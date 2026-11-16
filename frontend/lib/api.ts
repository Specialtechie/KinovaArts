import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
export const TOKEN_COOKIE = 'ka_token';

type Opts = {
  method?: string;
  body?: unknown;
  auth?: boolean; // send the signed-in customer's token and never cache
  revalidate?: number; // seconds, for public catalog data
};

/** Server-side call to the Laravel API. Never throws: returns { ok, status, data }. */
export async function api<T = any>(path: string, opts: Opts = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = { method: opts.method || 'GET', headers };

  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }

  if (opts.auth) {
    const token = (await cookies()).get(TOKEN_COOKIE)?.value;
    if (token) headers.Authorization = `Bearer ${token}`;
    init.cache = 'no-store';
  } else if (opts.revalidate !== undefined) {
    init.next = { revalidate: opts.revalidate };
  } else {
    init.cache = 'no-store';
  }

  try {
    const res = await fetch(`${API_URL}/api${path}`, init);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 503, data: null as any };
  }
}

/** Public catalog read, cached for a minute. 404 becomes the not-found page. */
export async function catalog<T = any>(path: string, revalidate = 60): Promise<T> {
  const r = await api<T>(path, { revalidate });
  if (r.status === 404) notFound();
  if (!r.ok) throw new Error(`The store is temporarily unavailable (${r.status}).`);
  return r.data;
}
