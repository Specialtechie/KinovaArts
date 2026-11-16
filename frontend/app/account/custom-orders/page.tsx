import type { Metadata } from 'next';
import Link from 'next/link';
import { dateLabel } from '@/lib/format';
import { authed } from '@/lib/session';

export const metadata: Metadata = { title: 'My custom orders' };

export default async function CustomOrders() {
  const requests: any[] = await authed('/account/custom-orders', '/account/custom-orders');

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <h1 className="section-title mb-8">My custom order requests</h1>

      {requests.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-10 text-center">
          <p className="text-ink/70">You haven&apos;t submitted any custom order requests yet.</p>
          <Link href="/custom-order" className="btn-primary mt-4">Request a custom piece</Link>
        </div>
      ) : (
        requests.map((r) => (
          <Link key={r.id} href={`/account/custom-orders/${r.id}`} className="mb-4 block rounded-md border border-line bg-panel p-5 transition hover:border-ink">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display font-semibold">{r.product?.name ?? 'Custom piece'}</div>
                <div className="text-xs text-ink/50">Submitted {dateLabel(r.created_at)}</div>
              </div>
              <div className="text-right">
                <span className="pill pill-active capitalize">{r.status}</span>
                {r.next_payment && <div className="mt-1 text-xs font-semibold text-clay">Payment due</div>}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
