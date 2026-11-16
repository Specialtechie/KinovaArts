import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'My account' };

export default async function Account() {
  const user = await requireUser('/account');

  const cards = [
    { href: '/account/orders', title: 'My orders', text: 'Track and review your purchases.' },
    { href: '/account/custom-orders', title: 'Custom orders', text: 'Follow your requests, quotes and payments.' },
    { href: '/account/wishlist', title: 'Wishlist', text: 'Pieces you have saved for later.' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <h1 className="section-title">Hello, {user.name}</h1>
      <p className="mt-1 text-sm text-ink/60">{user.email}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-md border border-line bg-panel p-5 transition hover:border-ink">
            <div className="font-display text-lg font-semibold">{c.title}</div>
            <p className="mt-1 text-sm text-ink/70">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
