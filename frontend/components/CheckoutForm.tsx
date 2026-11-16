'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { call, firstError, getCoupon } from '@/lib/client';
import { ngn, usd } from '@/lib/format';
import { useCart } from './store';

export default function CheckoutForm({ defaultName }: { defaultName: string }) {
  const { items, ready } = useCart();
  const [quote, setQuote] = useState<any>(null);
  const [form, setForm] = useState({
    name: defaultName,
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postcode: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    call('cart/quote', { body: { items, coupon_code: getCoupon() } }).then((r) => {
      if (r.ok) setQuote(r.data);
    });
  }, [items, ready]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const r = await call('checkout', { body: { items, coupon_code: getCoupon(), ...form } });

    if (r.ok && r.data?.authorization_url) {
      window.location.assign(r.data.authorization_url);
      return;
    }

    setBusy(false);
    setError(firstError(r.data));
  }

  if (!ready) return <p className="text-ink/60">Loading…</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line p-10 text-center">
        <p className="text-ink/70">Your bag is empty.</p>
        <Link href="/products" className="btn-primary mt-4">Browse the collection</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="field-label">Full name</label>
          <input required value={form.name} onChange={set('name')} className="field-input" />
        </div>
        <div>
          <label className="field-label">Address</label>
          <input required value={form.line1} onChange={set('line1')} className="field-input" />
        </div>
        <div>
          <label className="field-label">Apt / suite (optional)</label>
          <input value={form.line2} onChange={set('line2')} className="field-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">City</label>
            <input required value={form.city} onChange={set('city')} className="field-input" />
          </div>
          <div>
            <label className="field-label">State / region</label>
            <input value={form.state} onChange={set('state')} className="field-input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Country</label>
            <input required value={form.country} onChange={set('country')} className="field-input" />
          </div>
          <div>
            <label className="field-label">Postcode</label>
            <input required value={form.postcode} onChange={set('postcode')} className="field-input" />
          </div>
        </div>

        {error && <div className="rounded-md border border-clay bg-clay/10 p-3 text-sm text-clay">{error}</div>}

        <button disabled={busy || !quote} className="btn-primary w-fit">
          {busy ? 'Redirecting to Paystack…' : 'Continue to payment'}
        </button>
      </form>

      <aside className="h-fit rounded-md border border-line bg-panel p-5 text-sm">
        <div className="font-display text-lg font-semibold">Order summary</div>
        {quote ? (
          <div className="mt-3 flex flex-col gap-1">
            {quote.lines.map((l: any) => (
              <div key={l.product_id} className="flex justify-between gap-3">
                <span>{l.name} × {l.quantity}</span>
                <span>{usd(l.line_total)}</span>
              </div>
            ))}
            {quote.discount > 0 && (
              <div className="flex justify-between text-green"><span>Discount</span><span>-{usd(quote.discount)}</span></div>
            )}
            <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-semibold">
              <span>Total</span><span>{usd(quote.total)}</span>
            </div>
            <p className="mt-3 rounded border border-line bg-parchment p-3 text-xs">
              You&apos;ll be charged <strong>{ngn(quote.ngn_total)}</strong> in Nigerian Naira on Paystack&apos;s secure page, including for international cards.
            </p>
            {quote.issues?.length > 0 && <p className="mt-2 text-xs text-clay">{quote.issues[0]} Update your bag before paying.</p>}
          </div>
        ) : (
          <p className="mt-3 text-ink/60">Pricing your bag…</p>
        )}
      </aside>
    </div>
  );
}
