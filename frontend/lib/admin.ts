import { notFound, redirect } from 'next/navigation';
import { api } from './api';
import { getUser } from './session';

export async function requireAdmin(next = '/admin') {
  const user = await getUser();
  if (!user) redirect(`/?signin=1&next=${encodeURIComponent(next)}`);
  if (!user.is_admin) redirect('/');
  return user;
}

/** Server-side GET against /api/admin/... Signed-out goes to sign-in, non-admins to the shop. */
export async function adminGet<T = any>(path: string, next: string): Promise<T> {
  const r = await api<T>(`/admin${path}`, { auth: true });
  if (r.status === 401) redirect(`/?signin=1&next=${encodeURIComponent(next)}`);
  if (r.status === 403) redirect('/');
  if (r.status === 404) notFound();
  if (!r.ok) throw new Error(`Could not load this page (${r.status}).`);
  return r.data;
}
