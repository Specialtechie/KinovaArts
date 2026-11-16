import type { Metadata } from 'next';
import Link from 'next/link';
import { dateLabel, usd } from '@/lib/format';
import { authed } from '@/lib/session';

export const metadata: Metadata = { title: 'My orders' };

export default async function Orders() {
  const orders: any[] = await authed('/account/orders', '/account/orders');

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <h1 className="section-title mb-8">My orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-10 text-center">
          <p className="text-ink/70">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="btn-primary mt-4">Browse the collection</Link>
        </div>
      ) : (
        orders.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="mb-4 block rounded-md border border-line bg-panel p-5 transition hover:border-ink">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display font-semibold">{o.order_number}</div>
                <div className="text-xs text-ink/50">{dateLabel(o.created_at)}</div>
              </div>
              <div className="text-right">
                <span className="pill pill-active capitalize">{o.status}</span>
                <div className="mt-1 text-sm font-semibold">{usd(o.total)}</div>
              </div>
            </div>
            {o.items?.length > 0 && (
              <p className="mt-2 text-sm text-ink/70">
                {o.items.map((i: any) => `${i.name_snapshot} × ${i.quantity}`).join(', ')}
              </p>
            )}
          </Link>
        ))
      )}
    </div>
  );
}
