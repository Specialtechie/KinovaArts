'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth, useCart } from './store';

export default function Header() {
  const { user, openAuth, setUser } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [panel, setPanel] = useState<'menu' | 'search' | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    setPanel(null);
  }, [pathname]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    setPanel(null);
    router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products');
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    setUser(null);
    setPanel(null);
    router.push('/');
    router.refresh();
  }

  const mobileLink = 'rounded px-3 py-2 text-left text-sm font-medium hover:bg-panel';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-parchment">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/KinovaLogoLight.jpg" alt="Kinova Arts" className="h-8 w-8 rounded object-contain" />
          <span className="font-display text-xl font-semibold">Kinova Arts</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/products" className="pill border-transparent hover:border-ink">Shop</Link>
          <Link href="/collections" className="pill border-transparent hover:border-ink">Collections</Link>
          <Link href="/#story" className="pill border-transparent hover:border-ink">Our Craft</Link>
          <Link href="/custom-order" className="pill border-transparent hover:border-ink">Custom Order</Link>
        </nav>

        {/* Desktop search */}
        <form onSubmit={submitSearch} className="hidden md:block">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pieces, materials, origins…"
            className="w-64 rounded-full border border-line bg-panel px-4 py-2 text-sm"
          />
        </form>

        {/* Desktop right-side links */}
        <div className="hidden items-center gap-3 md:flex">
          {user && <Link href="/account/wishlist" className="text-sm font-semibold hover:opacity-70">Wishlist</Link>}
          {user?.is_admin && <Link href="/admin" className="text-sm font-semibold text-clay hover:opacity-70">Admin</Link>}
          <Link href="/cart" className="btn-primary">
            Bag
            {count > 0 && <span className="ml-1 rounded-full bg-gold px-2 text-xs text-ink">{count}</span>}
          </Link>
          {user ? (
            <>
              <Link href="/account" className="text-sm font-semibold hover:opacity-70">Account</Link>
              <button onClick={signOut} className="text-sm font-semibold hover:opacity-70">Sign out</button>
            </>
          ) : (
            <button onClick={() => openAuth('signin')} className="text-sm font-semibold hover:opacity-70">
              Sign in / Sign up
            </button>
          )}
        </div>

        {/* Mobile controls: search, bag, menu */}
        <div className="flex items-center gap-3 md:hidden">
          <button type="button" aria-label="Search" className="p-1" onClick={() => setPanel(panel === 'search' ? null : 'search')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <Link href="/cart" className="relative p-1" aria-label="Bag">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-13z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6L5 3H2" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-gold px-1.5 text-xs text-ink">{count}</span>
            )}
          </Link>

          <button type="button" aria-label="Menu" className="p-1" onClick={() => setPanel(panel === 'menu' ? null : 'menu')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop: dims the page behind an open panel, tap to close */}
      {panel && <div className="fixed inset-0 z-20 bg-ink/40 md:hidden" onClick={() => setPanel(null)} />}

      {/* Mobile search overlay (centred) */}
      {panel === 'search' && (
        <div className="absolute left-1/2 top-full z-40 w-64 -translate-x-1/2 rounded-md border border-line bg-parchment p-3 shadow-soft md:hidden">
          <form onSubmit={submitSearch}>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pieces, materials, origins…"
              className="w-full rounded-full border border-line bg-panel px-4 py-2 text-sm"
            />
          </form>
        </div>
      )}

      {/* Mobile menu overlay (right) */}
      {panel === 'menu' && (
        <div className="absolute right-0 top-full z-40 w-56 rounded-md border border-line bg-parchment p-3 shadow-soft md:hidden">
          <nav className="flex flex-col gap-1">
            <Link href="/products" className={mobileLink}>Shop</Link>
            <Link href="/collections" className={mobileLink}>Collections</Link>
            <Link href="/#story" className={mobileLink}>Our Craft</Link>
            <Link href="/custom-order" className={mobileLink}>Custom Order</Link>
            {user ? (
              <>
                <Link href="/account/wishlist" className={mobileLink}>Wishlist</Link>
                <Link href="/account" className={mobileLink}>Account</Link>
                {user.is_admin && <Link href="/admin" className={mobileLink}>Admin</Link>}
                <button onClick={signOut} className={mobileLink}>Sign out</button>
              </>
            ) : (
              <button
                onClick={() => {
                  setPanel(null);
                  openAuth('signin');
                }}
                className={mobileLink}
              >
                Sign in / Sign up
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
