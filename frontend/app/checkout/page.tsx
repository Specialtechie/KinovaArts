import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const user = await requireUser('/checkout');

  return (
    <div className="mx-auto max-w-5xl px-6 py-14 md:px-10">
      <h1 className="section-title mb-2">Checkout</h1>
      <p className="mb-8 text-sm text-ink/60">You&apos;ll be redirected to Paystack to complete payment securely.</p>
      <CheckoutForm defaultName={user.name} />
    </div>
  );
}
