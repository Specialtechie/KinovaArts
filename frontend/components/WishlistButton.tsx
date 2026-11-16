'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { call } from '@/lib/client';
import { useAuth } from './store';

export default function WishlistButton({ productId }: { productId: number }) {
  const { user, openAuth } = useAuth();
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let alive = true;
    call('account/wishlist').then((r) => {
      if (alive && r.ok && Array.isArray(r.data)) {
        setSaved(r.data.some((item: any) => item.product?.id === productId));
      }
    });
    return () => {
      alive = false;
    };
  }, [user, productId]);

  async function toggle() {
    if (!user) {
      openAuth('signin', pathname);
      return;
    }
    setBusy(true);
    const r = saved
      ? await call(`account/wishlist/${productId}`, { method: 'DELETE' })
      : await call('account/wishlist', { body: { product_id: productId } });
    setBusy(false);
    if (r.ok) setSaved(!saved);
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} className="btn-ghost w-full">
      {saved ? 'Saved to wishlist ✓' : user ? 'Save to wishlist' : 'Sign in to save to wishlist'}
    </button>
  );
}
