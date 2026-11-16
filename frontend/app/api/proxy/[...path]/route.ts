import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { API_URL, TOKEN_COOKIE } from '@/lib/api';

/** Forwards browser calls to Laravel, adding the customer's token from the httpOnly cookie. */
async function handler(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;

  if (path.some((p) => p === '..' || p === '.')) {
    return NextResponse.json({ message: 'Bad path.' }, { status: 400 });
  }

  const search = new URL(req.url).search;
  const target = `${API_URL}/api/${path.map(encodeURIComponent).join('/')}${search}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return NextResponse.json({ message: 'The store is temporarily unavailable.' }, { status: 503 });

  return new NextResponse(await res.arrayBuffer(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}

export { handler as GET, handler as POST, handler as DELETE };
