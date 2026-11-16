import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Request received' };

export default function ThankYou() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center md:px-10">
      <h1 className="section-title mb-4">Request received</h1>
      <p className="text-ink/70">
        Thank you for sharing the details of your custom piece. We&apos;ll review your request and reach out by email
        within a few business days with a quote and next steps.
      </p>
      <Link href="/products" className="btn-primary mt-8">Continue browsing</Link>
    </div>
  );
}
