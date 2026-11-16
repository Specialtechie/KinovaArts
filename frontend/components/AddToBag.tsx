'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './store';

export default function AddToBag({ productId, stock }: { productId: number; stock: number }) {
  const { add, items } = useCart();
  const [added, setAdded] = useState(false);

  const inBag = items.find((i) => i.product_id === productId)?.quantity ?? 0;
  const soldOut = stock <= 0;
  const maxed = inBag >= stock;

  function click() {
    if (soldOut || maxed) return;
    add(productId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={click} disabled={soldOut || maxed} className="btn-primary w-full">
        {soldOut ? 'Out of stock' : maxed ? 'All available pieces are in your bag' : added ? 'Added to bag ✓' : 'Add to bag'}
      </button>
      {inBag > 0 && (
        <Link href="/cart" className="text-center text-sm underline">
          View bag ({inBag})
        </Link>
      )}
    </div>
  );
}
