'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { call, getCoupon, setCoupon } from '@/lib/client';
import { ngn } from '@/lib/format';
import { useAuth, useCart } from './store';
import CurrencyPrice from './CurrencyPrice';
import { useCurrency } from './CurrencyProvider';

export default function CartView() {
  const { items, ready, setQty, remove } = useCart();
  const { user, openAuth } = useAuth();
  const { currency } = useCurrency();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (ready) setApplied(getCoupon());
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    if (items.length === 0) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    call('cart/quote', { body: { items, coupon_code: applied } }).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setLoadError(true);
        return;
      }
      setQuote(r.data);
      if (applied && r.data.coupon_error) {
        setCouponMsg(r.data.coupon_error);
        setApplied(null);
        setCoupon(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items, applied, ready]);

  function applyCoupon() {
    const value = code.trim().toUpperCase();
    if (!value) return;
    setCouponMsg(null);
    setApplied(value);
    setCoupon(value);
    setCode('');
  }

  function removeCoupon() {
    setApplied(null);
    setCoupon(null);
    setCouponMsg(null);
  }

  if (!ready) return <p className="text-ink/60">Loading your bag…</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line p-10 text-center">
        <p className="text-ink/70">Your bag is empty.</p>
        <Link href="/products" className="btn-primary mt-4">Browse the collection</Link>
      </div>
    );
  }

  const issues: string[] = quote?.issues ?? [];

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-3">
        {loadError && <p className="text-sm text-clay">We couldn&apos;t refresh your prices. Please try again in a moment.</p>}
        {quote?.lines?.map((line: any) => (
          <div key={line.product_id} className="flex gap-4 rounded-md border border-line bg-panel p-4">
            <Link href={`/products/${line.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded bg-line">
              {line.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
              )}
            </Link>
            <div className="flex flex-1 flex-col gap-1">
              <Link href={`/products/${line.slug}`} className="font-display font-semibold leading-tight">{line.name}</Link>
              <CurrencyPrice amount={line.price} className="text-sm text-ink/60" /> each
              <div className="mt-auto flex items-center gap-3 pt-2">
                <div className="flex items-center rounded border border-line">
                  <button type="button" className="px-3 py-1" aria-label="Decrease" onClick={() => setQty(line.product_id, line.quantity - 1)}>−</button>
                  <span className="min-w-6 text-center text-sm">{line.quantity}</span>
                  <button
                    type="button"
                    className="px-3 py-1 disabled:opacity-40"
                    aria-label="Increase"
                    disabled={line.quantity >= Math.min(99, line.stock)}
                    onClick={() => setQty(line.product_id, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => remove(line.product_id)} className="text-xs underline">Remove</button>
              </div>
            </div>
            <CurrencyPrice amount={line.line_total} className="font-semibold" />
          </div>
        ))}
        {!quote && loading && <p className="text-ink/60">Pricing your bag…</p>}
      </div>

      <aside className="h-fit rounded-md border border-line bg-panel p-5">
        <div className="font-display text-lg font-semibold">Summary</div>

        <div className="mt-4">
          {applied ? (
            <div className="flex items-center justify-between rounded border border-line bg-parchment px-3 py-2 text-sm">
              <span>Coupon <strong>{applied}</strong></span>
              <button type="button" onClick={removeCoupon} className="underline">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="field-input" />
              <button type="button" onClick={applyCoupon} className="btn-ghost px-4">Apply</button>
            </div>
          )}
          {couponMsg && <p className="mt-2 text-xs text-clay">{couponMsg}</p>}
        </div>

        {quote && (
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><CurrencyPrice amount={quote.subtotal} /></div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-green"><span>Discount</span><span>-<CurrencyPrice amount={quote.discount} /></span></div>
            )}
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold">
              <span>Total</span><CurrencyPrice amount={quote.total} />
            </div>
            <p className="mt-2 text-xs text-ink/60">
              Prices are estimates in {currency}. Paystack currently charges in Nigerian Naira ({ngn(quote.ngn_total)}), including for international cards.
            </p>
          </div>
        )}

        {issues.length > 0 && (
          <ul className="mt-3 list-inside list-disc text-xs text-clay">
            {issues.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}

        <div className="mt-5">
          {user ? (
            <Link
              href="/checkout"
              aria-disabled={issues.length > 0 || !quote}
              className={`btn-primary w-full ${issues.length > 0 || !quote ? 'pointer-events-none opacity-50' : ''}`}
            >
              Proceed to checkout
            </Link>
          ) : (
            <button
              type="button"
              disabled={issues.length > 0 || !quote}
              onClick={() => openAuth('signin', '/checkout')}
              className="btn-primary w-full"
            >
              Sign in to checkout
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
