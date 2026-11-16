import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { api, TOKEN_COOKIE } from './api';
import type { User } from './types';

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const r = await api('/auth/me', { auth: true });
  return r.ok ? (r.data.user as User) : null;
}

export async function requireUser(next: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/?signin=1&next=${encodeURIComponent(next)}`);
  return user;
}

/** Authenticated GET for account pages: sends signed-out visitors to sign in, missing records to 404. */
export async function authed<T = any>(path: string, next: string): Promise<T> {
  const r = await api<T>(path, { auth: true });
  if (r.status === 401) redirect(`/?signin=1&next=${encodeURIComponent(next)}`);
  if (r.status === 404) notFound();
  if (!r.ok) throw new Error(`Could not load this page (${r.status}).`);
  return r.data;
}
