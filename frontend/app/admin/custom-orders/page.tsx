import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { dateLabel, one, usd } from '@/lib/format';

export const metadata: Metadata = { title: 'Custom orders' };

const STATUSES = ['', 'pending', 'reviewing', 'quoted', 'accepted', 'declined', 'completed'];

export default async function CustomOrdersAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = one(sp.status) || '';
  const page = one(sp.page) || '1';

  const qs = new URLSearchParams({ page });
  if (status) qs.set('status', status);
  const result = await adminGet(`/custom-orders?${qs.toString()}`, '/admin/custom-orders');

  const href = (st: string, p = '1') => {
    const params = new URLSearchParams();
    if (st) params.set('status', st);
    params.set('page', p);
    return `/admin/custom-orders?${params.toString()}`;
  };

  return (
    <div>
      <PageTitle title="Custom order requests" />

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((st) => (
          <Link key={st || 'all'} href={href(st)} className={`pill capitalize ${status === st ? 'pill-active' : ''}`}>{st || 'All'}</Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Inspired by</th>
              <th className="p-3">Budget</th>
              <th className="p-3">Quote</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {result.data.map((r: any) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3">{dateLabel(r.created_at)}</td>
                <td className="p-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-ink/50">{r.email}</div>
                </td>
                <td className="p-3">{r.product?.name ?? '—'}</td>
                <td className="p-3">{r.budget_range ?? '—'}</td>
                <td className="p-3">{r.quoted_price ? usd(r.quoted_price) : '—'}</td>
                <td className="p-3"><span className="pill capitalize">{r.status}</span></td>
                <td className="p-3 text-right"><Link href={`/admin/custom-orders/${r.id}`} className="underline">Open</Link></td>
              </tr>
            ))}
            {result.data.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink/60">No requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      {result.last_page > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {result.current_page > 1 && <Link href={href(status, String(result.current_page - 1))} className="btn-ghost">&larr; Previous</Link>}
          <span>Page {result.current_page} of {result.last_page}</span>
          {result.current_page < result.last_page && <Link href={href(status, String(result.current_page + 1))} className="btn-ghost">Next &rarr;</Link>}
        </div>
      )}
    </div>
  );
}
