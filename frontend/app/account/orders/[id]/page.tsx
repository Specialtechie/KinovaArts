import type { Metadata } from 'next';
import Link from 'next/link';
import { dateLabel, money, usd } from '@/lib/format';
import { authed } from '@/lib/session';
import OrderConversation from '@/components/OrderConversation';
import PayDeliveryFeeButton from '@/components/PayDeliveryFeeButton';

export const metadata: Metadata = { title: 'Order details' };

const STEPS: [string, string][] = [
  ['pending', 'Order placed'],
  ['paid', 'Payment confirmed'],
  ['processing', 'Preparing your order'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
];

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await authed(`/account/orders/${id}`, `/account/orders/${id}`);

  const current = STEPS.findIndex(([k]) => k === o.status);
  const closed = o.status === 'cancelled' || o.status === 'refunded';
  const paymentLabel = o.payment_type === 'deposit' ? 'Deposit' : o.payment_type === 'balance' ? 'Balance' : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <Link href="/account/orders" className="text-sm underline">&larr; Back to orders</Link>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Order {o.order_number}</h1>
          <p className="text-xs text-ink/50">{dateLabel(o.created_at)}</p>
        </div>
        <span className="pill pill-active capitalize">{o.status}</span>
      </div>

      {closed ? (
        <p className="mt-6 text-clay">This order was {o.status}.</p>
      ) : (
        <div className="mt-8 flex items-center justify-between">
          {STEPS.map(([key, label], i) => {
            const done = current >= 0 && i <= current;
            return (
              <div key={key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <div className={`h-3 w-3 rounded-full ${done ? 'bg-green' : 'bg-line'}`} />
                  <span className={`mt-2 text-xs ${done ? 'text-ink' : 'text-ink/40'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-1 h-px flex-1 ${i < current ? 'bg-green' : 'bg-line'}`} />}
              </div>
            );
          })}
        </div>
      )}

      {o.tracking_number && (
        <div className="mt-8 rounded-md border border-line bg-panel p-5">
          <div className="font-display font-semibold">Tracking</div>
          <p className="mt-1 text-sm text-ink/70">
            {o.courier || 'Courier'}: tracking number <span className="font-mono">{o.tracking_number}</span>
          </p>
        </div>
      )}

      {o.custom_order_request_id && (
        <div className="mt-8 rounded-md border border-line bg-panel p-5 text-sm">
          {paymentLabel ? `${paymentLabel} payment` : 'Payment'} for a custom piece.{' '}
          <Link href={`/account/custom-orders/${o.custom_order_request_id}`} className="underline">View the custom order</Link>
        </div>
      )}

      {o.items?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold">Items</h2>
          <div className="mt-3 flex flex-col gap-2">
            {o.items.map((i: any) => (
              <div key={i.id} className="flex justify-between rounded-md border border-line bg-panel p-4 text-sm">
                <span>{i.name_snapshot} × {i.quantity}</span>
                <span className="font-semibold">{usd(i.price_snapshot * i.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-md border border-line bg-panel p-5">
        <div className="font-display font-semibold">Shipping to</div>
        <p className="mt-1 text-sm text-ink/70">
          {o.shipping_name}<br />
          {o.shipping_line1}{o.shipping_line2 ? `, ${o.shipping_line2}` : ''}<br />
          {o.shipping_city}{o.shipping_state ? `, ${o.shipping_state}` : ''}, {o.shipping_country} {o.shipping_postcode}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-1 text-sm">
        {o.custom_order_payment ? (
          <div className="flex justify-between text-base font-semibold">
            <span>{paymentLabel || 'Payment'}</span>
            <span>{money(o.custom_order_payment.amount, o.custom_order_payment.currency)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between"><span>Subtotal</span><span>{usd(o.subtotal)}</span></div>
            {Number(o.discount) > 0 && (
              <div className="flex justify-between text-green">
                <span>Discount{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><span>-{usd(o.discount)}</span>
              </div>
            )}
            {Number(o.delivery_fee_amount) > 0 && (
              <div className="flex justify-between">
                <span>Delivery fee ({o.delivery_fee_status})</span>
                <span>{money(o.delivery_fee_amount, o.delivery_fee_currency || 'USD')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>{o.delivery_fee_status === 'paid' ? 'Total including delivery' : 'Original order total'}</span>
              <span>{usd(o.total)}</span>
            </div>
          </>
        )}
      </div>
      {!o.custom_order_request_id
        && !['cancelled', 'refunded', 'delivered'].includes(o.status)
        && ['unpaid', 'pending'].includes(o.delivery_fee_status) && (
        <div className="mt-4 rounded-md border border-line bg-parchment p-4">
          <p className="mb-3 text-sm">Your delivery fee is paid separately from the original order total.</p>
          <PayDeliveryFeeButton orderId={o.id} />
        </div>
      )}
      {!o.custom_order_request_id && o.delivery_fee_status === 'paid' && (
        <p className="mt-4 text-sm text-green">Delivery fee paid.</p>
      )}
      <div className="mt-8">
        <OrderConversation endpoint={`account/orders/${o.id}/messages`} initialMessages={o.messages || []} />
      </div>
    </div>
  );
}
