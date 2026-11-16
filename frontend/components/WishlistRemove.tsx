'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { call } from '@/lib/client';

export default function WishlistRemove({ productId }: { productId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await call(`account/wishlist/${productId}`, { method: 'DELETE' });
    router.refresh();
    setBusy(false);
  }

  return (
    <button type="button" onClick={remove} disabled={busy} className="mt-2 text-xs underline disabled:opacity-50">
      Remove
    </button>
  );
}
