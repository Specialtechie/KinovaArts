import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { API_URL, TOKEN_COOKIE } from '@/lib/api';

export async function GET() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const headers = { 'Cache-Control': 'no-store' };

  if (!token) return NextResponse.json({ user: null }, { headers });

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return NextResponse.json({ user: null }, { headers });

  if (res.status === 401) {
    const out = NextResponse.json({ user: null }, { headers });
    out.cookies.delete(TOKEN_COOKIE);
    return out;
  }

  const data = await res.json().catch(() => ({ user: null }));
  return NextResponse.json({ user: data.user ?? null }, { headers });
}
