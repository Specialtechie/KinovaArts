'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { call } from '@/lib/client';
import { money, usd } from '@/lib/format';
import { useAuth, useCart } from './store';

type State =
  | { status: 'loading' }
  | { status: 'paid'; data: any }
  | { status: 'pending'; data: any }
  | { status: 'signin' }
  | { status: 'error'; message: string };

export default function CheckoutResult() {
  const sp = useSearchParams();
  const reference = sp.get('reference') || sp.get('trxref');
  const { clear } = useCart();
  const { openAuth } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });
  const started = useRef(false);

  // Explicit type: verify calls itself, which TypeScript can't infer.
  const verify: (attempt?: number) => Promise<void> = useCallback(
    async (attempt = 0) => {
      if (!reference) {
        setState({ status: 'error', message: 'We could not find a payment reference in this link.' });
        return;
      }

      const r = await call(`checkout/verify?reference=${encodeURIComponent(reference)}`);

      if (r.status === 401) {
        setState({ status: 'signin' });
        return;
      }
      if (!r.ok) {
        setState({ status: 'error', message: r.data?.message || 'We could not confirm your payment yet.' });
        return;
      }

      if (r.data.status === 'pending') {
        if (attempt < 4) {
          setTimeout(() => verify(attempt + 1), 3000);
        } else {
          setState({ status: 'pending', data: r.data });
        }
        return;
      }

      // Custom-order payments never come from the bag, so only clear it for normal orders.
      if (!r.data.custom_order_request_id && r.data.payment_type !== 'delivery_fee') clear();
      setState({ status: 'paid', data: r.data });
    },
    [reference, clear]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verify();
  }, [verify]);

  if (state.status === 'loading') {
    return <p className="text-ink/70">Confirming your payment…</p>;
  }

  if (state.status === 'signin') {
    return (
      <div>
        <p className="text-ink/70">Please sign in to confirm your payment.</p>
        <button
          className="btn-primary mt-4"
          onClick={() => openAuth('signin', window.location.pathname + window.location.search)}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div>
        <p className="text-clay">{state.message}</p>
        <Link href="/account/orders" className="btn-ghost mt-4">View my orders</Link>
      </div>
    );
  }

  if (state.status === 'pending') {
    return (
      <div>
        <p className="text-ink/70">
          We haven&apos;t received confirmation from Paystack yet. If you completed payment, it usually shows up within a minute.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="btn-primary"
            onClick={() => {
              setState({ status: 'loading' });
              verify();
            }}
          >
            Check again
          </button>
          <Link href="/account/orders" className="btn-ghost">View my orders</Link>
        </div>
      </div>
    );
  }

  const d = state.data;
  if (d.payment_type === 'delivery_fee') {
    return (
      <div>
        <p className="text-ink/70">
          Delivery fee for order <strong>{d.order_number}</strong> is confirmed
          {d.delivery_fee_amount && <> ({money(d.delivery_fee_amount, d.delivery_fee_currency)})</>}. A confirmation email is on its way.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/account/orders/${d.order_id}`} className="btn-primary">View order</Link>
          <Link href="/products" className="btn-ghost">Continue browsing</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-ink/70">
        Order <strong>{d.order_number}</strong> is confirmed ({d.custom_order_payment
          ? money(d.custom_order_payment.amount, d.custom_order_payment.currency)
          : usd(d.total)}). A confirmation email is on its way.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {d.custom_order_request_id ? (
          <Link href={`/account/custom-orders/${d.custom_order_request_id}`} className="btn-primary">Back to my custom order</Link>
        ) : (
          <Link href="/account/orders" className="btn-primary">View my orders</Link>
        )}
        <Link href="/products" className="btn-ghost">Continue browsing</Link>
      </div>
    </div>
  );
}
