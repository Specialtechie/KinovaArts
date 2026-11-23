'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { Card, Field, s } from './ui';
import { useCurrency } from '../CurrencyProvider';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const TERMINAL_STATUSES = ['delivered', 'cancelled', 'refunded'];

export default function OrderUpdateForm({ order }: { order: any }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState(s(order.courier));
  const [tracking, setTracking] = useState(s(order.tracking_number));
  const [deliveryFee, setDeliveryFee] = useState(s(order.delivery_fee_amount || '0'));
  const [deliveryFeeCurrency, setDeliveryFeeCurrency] = useState(order.delivery_fee_currency || 'USD');
  const { currencies } = useCurrency();
  const statusLocked = TERMINAL_STATUSES.includes(order.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await call(`admin/orders/${order.id}`, {
      body: {
        status,
        courier,
        tracking_number: tracking,
        delivery_fee_amount: deliveryFee,
        delivery_fee_currency: deliveryFeeCurrency,
      },
    });
    setBusy(false);

    if (r.ok) {
      setMsg({ ok: true, text: 'Order updated.' });
      router.refresh();
    } else {
      setMsg({ ok: false, text: firstError(r.data) });
    }
  }

  return (
    <Card title="Update order">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={statusLocked}
            className="field-input capitalize disabled:cursor-not-allowed disabled:opacity-60"
          >
            {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </Field>
        {statusLocked && <p className="text-xs text-ink/50">This is a final status and cannot be changed.</p>}
        <Field label="Courier"><input value={courier} onChange={(e) => setCourier(e.target.value)} className="field-input" /></Field>
        <Field label="Tracking number"><input value={tracking} onChange={(e) => setTracking(e.target.value)} className="field-input" /></Field>
        {!order.custom_order_request_id && (
          <>
            <Field label="Delivery fee" hint="The customer pays this separately from the already-paid order.">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="field-input"
                />
                <select
                  value={deliveryFeeCurrency}
                  onChange={(e) => setDeliveryFeeCurrency(e.target.value)}
                  className="field-input"
                  aria-label="Delivery fee currency"
                >
                  {Array.from(new Set([deliveryFeeCurrency, ...currencies])).sort().map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </Field>
            {order.delivery_fee_status && order.delivery_fee_status !== 'not_set' && (
              <p className="text-xs text-ink/60">Delivery-fee payment: {order.delivery_fee_status}</p>
            )}
          </>
        )}
        <p className="text-xs text-ink/50">Cancelling or refunding a paid order puts its items back in stock.</p>
        <p className="text-xs text-ink/50">Customers receive an email whenever the order status changes. Use the order conversation to send processing progress updates.</p>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green' : 'text-clay'}`}>{msg.text}</p>}
        <button disabled={busy} className="btn-primary w-fit">{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </Card>
  );
}
