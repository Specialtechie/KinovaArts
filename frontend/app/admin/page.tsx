import Link from 'next/link';
import { Card, PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { dateLabel, usd } from '@/lib/format';

export default async function Dashboard() {
  const d = await adminGet('/dashboard', '/admin');

  const kpis: [string, string, string?][] = [
    ['Revenue', usd(d.revenue)],
    ['Paid orders', String(d.total_orders), '/admin/orders'],
    ['Pending orders', String(d.pending_orders), '/admin/orders?status=pending'],
    ['Inventory value', usd(d.inventory_value)],
    ['Custom requests to review', String(d.custom_requests_pending), '/admin/custom-orders'],
    ['Reviews awaiting approval', String(d.reviews_pending), '/admin/reviews?approved=0'],
  ];

  return (
    <div>
      <PageTitle title="Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(([label, value, href]) => {
          const inner = (
            <>
              <div className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</div>
              <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="rounded-md border border-line bg-panel p-5 transition hover:border-ink">{inner}</Link>
          ) : (
            <div key={label} className="rounded-md border border-line bg-panel p-5">{inner}</div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Low stock">
          {d.low_stock.length === 0 ? (
            <p className="text-sm text-ink/60">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {d.low_stock.map((p: any) => (
                <li key={p.id} className="flex justify-between py-2">
                  <Link href={`/admin/products/${p.id}`} className="underline">{p.name}</Link>
                  <span className="text-clay">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent orders">
          {d.recent_orders.length === 0 ? (
            <p className="text-sm text-ink/60">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {d.recent_orders.map((o: any) => (
                <li key={o.id} className="flex items-center justify-between py-2">
                  <div>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold underline">{o.order_number}</Link>
                    <div className="text-xs text-ink/50">{o.shipping_name} · {dateLabel(o.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <span className="pill capitalize">{o.status}</span>
                    <div className="mt-1">{usd(o.total)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
