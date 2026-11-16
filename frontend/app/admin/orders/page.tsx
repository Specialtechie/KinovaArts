import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { dateLabel, one, usd } from '@/lib/format';

export const metadata: Metadata = { title: 'Orders' };

const STATUSES = ['', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = one(sp.status) || '';
  const q = one(sp.q) || '';
  const page = one(sp.page) || '1';

  const qs = new URLSearchParams({ page });
  if (status) qs.set('status', status);
  if (q) qs.set('q', q);

  const result = await adminGet(`/orders?${qs.toString()}`, '/admin/orders');

  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string> = { status, q, page: '1', ...over };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `/admin/orders?${p.toString()}`;
  };

  return (
    <div>
      <PageTitle title="Orders" />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((st) => (
          <Link key={st || 'all'} href={href({ status: st })} className={`pill capitalize ${status === st ? 'pill-active' : ''}`}>
            {st || 'All'}
          </Link>
        ))}
      </div>

      <form action="/admin/orders" className="mb-5 flex gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Order number or customer name" className="field-input max-w-xs" />
        <button className="btn-ghost">Search</button>
      </form>

      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Order</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((o: any) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold underline">{o.order_number}</Link>
                  {o.payment_type && o.payment_type !== 'full' && <span className="ml-2 text-xs text-ink/50">{o.payment_type}</span>}
                </td>
                <td className="p-3">{dateLabel(o.created_at)}</td>
                <td className="p-3">{o.shipping_name}</td>
                <td className="p-3"><span className="pill capitalize">{o.status}</span></td>
                <td className="p-3 text-right">{usd(o.total)}</td>
              </tr>
            ))}
            {result.data.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink/60">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>

      {result.last_page > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {result.current_page > 1 && <Link href={href({ page: String(result.current_page - 1) })} className="btn-ghost">&larr; Previous</Link>}
          <span>Page {result.current_page} of {result.last_page}</span>
          {result.current_page < result.last_page && <Link href={href({ page: String(result.current_page + 1) })} className="btn-ghost">Next &rarr;</Link>}
        </div>
      )}
    </div>
  );
}
