import type { Metadata } from 'next';
import Link from 'next/link';
import OrderUpdateForm from '@/components/admin/OrderUpdateForm';
import { Card, PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { dateLabel, money, usd } from '@/lib/format';

export const metadata: Metadata = { title: 'Order' };

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await adminGet(`/orders/${id}`, `/admin/orders/${id}`);
  const customQuote = o.custom_order_request;
  const quoteCurrency = customQuote?.quoted_currency || 'USD';
  const quoteAmount = Number(customQuote?.quoted_price) || 0;
  const depositAmount = Math.round(quoteAmount * 70) / 100;
  const customPaymentAmount = o.payment_type === 'deposit'
    ? depositAmount
    : o.payment_type === 'balance'
      ? quoteAmount - depositAmount
      : quoteAmount;

  return (
    <div className="max-w-4xl">
      <Link href="/admin/orders" className="text-sm underline">&larr; All orders</Link>

      <div className="mt-3">
        <PageTitle title={`Order ${o.order_number}`}>
          <span className="pill pill-active capitalize">{o.status}</span>
        </PageTitle>
      </div>
      <p className="-mt-3 mb-6 text-sm text-ink/60">
        Placed {dateLabel(o.created_at)}
        {o.user && <> by {o.user.name} ({o.user.email})</>}
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {o.custom_order_request && (
            <Card title="Custom order payment">
              <p className="text-sm">
                {o.payment_type === 'deposit' ? 'Deposit' : o.payment_type === 'balance' ? 'Balance' : 'Payment'} for a custom request.{' '}
                Amount: <strong>{money(customPaymentAmount, quoteCurrency)}</strong>.{' '}
                <Link href={`/admin/custom-orders/${o.custom_order_request.id}`} className="underline">Open the request</Link>
              </p>
            </Card>
          )}

          {o.items.length > 0 && (
            <Card title="Items">
              <div className="flex flex-col gap-2 text-sm">
                {o.items.map((i: any) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.name_snapshot} × {i.quantity}</span>
                    <span>{usd(i.price_snapshot * i.quantity)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Ship to">
            <p className="text-sm leading-relaxed">
              {o.shipping_name}<br />
              {o.shipping_line1}{o.shipping_line2 ? `, ${o.shipping_line2}` : ''}<br />
              {o.shipping_city}{o.shipping_state ? `, ${o.shipping_state}` : ''}, {o.shipping_country} {o.shipping_postcode}
            </p>
          </Card>

          <Card title="Totals">
            <div className="flex flex-col gap-1 text-sm">
              {o.custom_order_request ? (
                <div className="flex justify-between text-base font-semibold">
                  <span>Paid ({quoteCurrency})</span><span>{money(customPaymentAmount, quoteCurrency)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between"><span>Subtotal</span><span>{usd(o.subtotal)}</span></div>
                  {Number(o.discount) > 0 && (
                    <div className="flex justify-between text-green"><span>Discount{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><span>-{usd(o.discount)}</span></div>
                  )}
                  <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{usd(o.total)}</span></div>
                </>
              )}
              {o.paystack_reference && <div className="mt-2 text-xs text-ink/50">Paystack reference: <span className="font-mono">{o.paystack_reference}</span></div>}
            </div>
          </Card>
        </div>

        <OrderUpdateForm order={o} />
      </div>
    </div>
  );
}
