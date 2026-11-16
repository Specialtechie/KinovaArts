import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutResult from '@/components/CheckoutResult';

export const metadata: Metadata = { title: 'Payment' };

export default function CheckoutSuccess() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center md:px-10">
      <h1 className="section-title mb-4">Thank you</h1>
      <Suspense fallback={<p className="text-ink/70">Confirming your payment…</p>}>
        <CheckoutResult />
      </Suspense>
    </div>
  );
}
