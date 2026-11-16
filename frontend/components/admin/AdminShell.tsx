'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '../store';

const NAV: [string, string][] = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/collections', 'Collections'],
  ['/admin/orders', 'Orders'],
  ['/admin/custom-orders', 'Custom orders'],
  ['/admin/coupons', 'Coupons'],
  ['/admin/banners', 'Banners'],
  ['/admin/pages', 'Pages'],
  ['/admin/reviews', 'Reviews'],
  ['/admin/settings', 'Settings'],
];

export default function AdminShell({ name, children }: { name: string; children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { setUser } = useAuth();

  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-indigo-deep text-panel md:min-h-screen md:w-56 md:shrink-0 md:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <div>
            <div className="font-display text-lg font-semibold">Kinova Admin</div>
            <div className="text-xs text-panel/60">{name}</div>
          </div>
          <div className="flex gap-3 text-xs md:mt-3">
            <Link href="/" className="underline">View store</Link>
            <button onClick={signOut} className="underline">Sign out</button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-6">
          {NAV.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded px-3 py-2 text-sm ${active(href) ? 'bg-panel/15 font-semibold' : 'text-panel/80 hover:bg-panel/10'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 bg-parchment px-5 py-8 md:px-8">{children}</div>
    </div>
  );
}
