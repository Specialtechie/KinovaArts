/** Browser-side calls go through our own /api/proxy so the auth token stays in an httpOnly cookie. */
export async function call<T = any>(
  path: string,
  init?: { method?: string; body?: unknown; form?: FormData }
): Promise<{ ok: boolean; status: number; data: T }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;

  if (init?.form) {
    body = init.form;
  } else if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }

  const res = await fetch(`/api/proxy/${path.replace(/^\//, '')}`, {
    method: init?.method || (body ? 'POST' : 'GET'),
    headers,
    body,
    cache: 'no-store',
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

export function firstError(data: any, fallback = 'Something went wrong. Please try again.'): string {
  if (!data) return fallback;
  if (data.errors && typeof data.errors === 'object') {
    const key = Object.keys(data.errors)[0];
    if (key && data.errors[key]?.[0]) return data.errors[key][0];
  }
  return data.message || fallback;
}

export const getCoupon = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ka_coupon');
};

export const setCoupon = (code: string | null) => {
  if (typeof window === 'undefined') return;
  if (code) localStorage.setItem('ka_coupon', code);
  else localStorage.removeItem('ka_coupon');
};
