import type { Metadata } from 'next';
import Link from 'next/link';
import CustomOrderUpdateForm from '@/components/admin/CustomOrderUpdateForm';
import { Card, PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { dateLabel, money } from '@/lib/format';

export const metadata: Metadata = { title: 'Custom order' };

export default async function CustomOrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await adminGet(`/custom-orders/${id}`, `/admin/custom-orders/${id}`);

  const prefs: [string, string | null][] = [
    ['Category', r.category_preference],
    ['Material', r.material_preference],
    ['Color', r.color_preference],
    ['Dimensions', r.dimensions],
    ['Budget', r.budget_range ? `${r.budget_range} ${r.budget_currency || 'USD'}` : null],
    ['Timeline', r.desired_timeline],
  ];

  return (
    <div className="max-w-5xl">
      <Link href="/admin/custom-orders" className="text-sm underline">&larr; All requests</Link>

      <div className="mt-3">
        <PageTitle title={r.name}>
          <span className="pill pill-active capitalize">{r.status}</span>
        </PageTitle>
      </div>
      <p className="-mt-3 mb-6 text-sm text-ink/60">
        {r.email}{r.phone ? ` · ${r.phone}` : ''} · {dateLabel(r.created_at)}
        {r.product && <> · inspired by <Link href={`/products/${r.product.slug}`} className="underline" target="_blank">{r.product.name}</Link></>}
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card title="What they asked for">
            <p className="whitespace-pre-line text-sm">{r.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {prefs.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {r.reference_images?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {r.reference_images.map((src: string) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Reference" className="h-28 w-28 rounded object-cover" />
                  </a>
                ))}
              </div>
            )}
          </Card>

          <Card title="Payments">
            {r.quoted_price ? (
              <p className="mb-3 text-sm">
                Quote {money(r.quoted_price, r.quoted_currency || 'USD')}
                {r.requires_installment && <> · deposit {money(r.deposit_amount, r.quoted_currency || 'USD')} ({r.deposit_paid ? 'paid' : 'due'}) · balance {money(r.balance_amount, r.quoted_currency || 'USD')} ({r.balance_paid ? 'paid' : 'due'})</>}
                {r.fully_paid && <span className="ml-2 font-semibold text-green">Fully paid</span>}
              </p>
            ) : (
              <p className="mb-3 text-sm text-ink/60">No quote yet.</p>
            )}
            {r.orders?.length > 0 && (
              <ul className="divide-y divide-line text-sm">
                {r.orders.map((o: any) => (
                  <li key={o.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/orders/${o.id}`} className="underline">{o.order_number}</Link>
                    <span className="capitalize">{o.payment_type} · {o.status}</span>
                    <span>{money(
                      o.payment_type === 'deposit'
                        ? r.deposit_amount
                        : o.payment_type === 'balance'
                          ? r.balance_amount
                          : r.quoted_price,
                      r.quoted_currency || 'USD',
                    )}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <CustomOrderUpdateForm request={r} />
      </div>
    </div>
  );
}
