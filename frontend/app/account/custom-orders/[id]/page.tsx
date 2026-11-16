import type { Metadata } from 'next';
import Link from 'next/link';
import { usd } from '@/lib/format';
import { authed } from '@/lib/session';

export const metadata: Metadata = { title: 'Custom order' };

export default async function CustomOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await authed(`/account/custom-orders/${id}`, `/account/custom-orders/${id}`);

  const prefs: [string, string | null][] = [
    ['Category', r.category_preference],
    ['Material', r.material_preference],
    ['Color', r.color_preference],
    ['Dimensions', r.dimensions],
    ['Budget', r.budget_range],
    ['Timeline', r.desired_timeline],
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-14 md:px-10">
      <Link href="/account/custom-orders" className="text-sm underline">&larr; Back to my requests</Link>

      <div className="mt-4 flex items-center justify-between gap-3">
        <h1 className="section-title">{r.product?.name ?? 'Custom piece'}</h1>
        <span className="pill pill-active capitalize">{r.status}</span>
      </div>

      <div className="mt-6 rounded-md border border-line bg-panel p-5 text-sm">
        <div className="font-display font-semibold">Your request</div>
        <p className="mt-2 whitespace-pre-line">{r.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          {prefs.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {r.reference_images?.length > 0 && (
          <div className="mt-4 flex gap-3">
            {r.reference_images.map((src: string) => (
              <a key={src} href={src} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Reference" className="h-20 w-20 rounded object-cover" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Quote and payment */}
      {r.next_payment === 'deposit' && (
        <div className="mt-6 rounded-md border border-line bg-parchment p-5">
          <div className="font-display font-semibold">Quote ready: paid in two parts</div>
          <p className="mt-1 text-sm text-ink/70">
            Total <strong>{usd(r.quoted_price)}</strong>: 70% deposit now, the remaining 30% due before delivery.
          </p>
          <p className="mt-3 text-lg font-semibold">Deposit due now: {usd(r.deposit_amount)}</p>
          <Link href={`/account/custom-orders/${r.id}/pay/deposit`} className="btn-primary mt-3">Pay deposit</Link>
        </div>
      )}

      {r.next_payment === 'balance' && (
        <div className="mt-6 rounded-md border border-line bg-parchment p-5">
          <div className="font-display font-semibold">Your piece is ready</div>
          <p className="mt-3 text-lg font-semibold">Balance due before delivery: {usd(r.balance_amount)}</p>
          <Link href={`/account/custom-orders/${r.id}/pay/balance`} className="btn-primary mt-3">Pay balance</Link>
        </div>
      )}

      {r.next_payment === 'full' && (
        <div className="mt-6 rounded-md border border-line bg-parchment p-5">
          <div className="font-display font-semibold">Quote ready</div>
          <p className="mt-1 text-2xl font-semibold">{usd(r.quoted_price)}</p>
          <Link href={`/account/custom-orders/${r.id}/pay/full`} className="btn-primary mt-4">Accept &amp; proceed to payment</Link>
        </div>
      )}

      {!r.next_payment && r.fully_paid && (
        <div className="mt-6 rounded-md border border-line bg-panel p-5 text-green">Payment complete. Thank you!</div>
      )}

      {!r.next_payment && !r.fully_paid && r.requires_installment && r.deposit_paid && (
        <div className="mt-6 rounded-md border border-line bg-panel p-5 text-sm">
          <span className="text-green">Deposit received. Your piece is in progress.</span>{' '}
          We&apos;ll email you when it&apos;s ready and the balance payment link becomes available.
        </div>
      )}

      {!r.next_payment && !r.fully_paid && r.status === 'declined' && (
        <div className="mt-6 rounded-md border border-line bg-panel p-5 text-clay">
          This request wasn&apos;t able to move forward. Feel free to submit a new request or reach out with questions.
        </div>
      )}

      {!r.quoted_price && r.status !== 'declined' && (
        <p className="mt-6 text-sm text-ink/60">We&apos;re reviewing your request. We&apos;ll email you once a quote is ready.</p>
      )}

      {r.admin_notes && (
        <div className="mt-6 rounded-md border border-line bg-panel p-5 text-sm">
          <div className="font-display font-semibold">Notes from us</div>
          <p className="mt-1 whitespace-pre-line">{r.admin_notes}</p>
        </div>
      )}
    </div>
  );
}
