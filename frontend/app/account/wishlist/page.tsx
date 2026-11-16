import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import WishlistRemove from '@/components/WishlistRemove';
import { authed } from '@/lib/session';

export const metadata: Metadata = { title: 'Wishlist' };

export default async function Wishlist() {
  const items: any[] = await authed('/account/wishlist', '/account/wishlist');

  return (
    <div className="px-6 py-14 md:px-10">
      <h1 className="section-title mb-8">Wishlist</h1>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-10 text-center">
          <p className="text-ink/70">Nothing saved yet.</p>
          <Link href="/products" className="btn-primary mt-4">Browse the collection</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.id}>
              <ProductCard product={item.product} />
              <WishlistRemove productId={item.product.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
