import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="section-title mb-3">We couldn&apos;t find that page</h1>
      <p className="text-ink/70">The piece or page you&apos;re looking for may have moved or sold.</p>
      <Link href="/products" className="btn-primary mt-8">Browse the collection</Link>
    </div>
  );
}
