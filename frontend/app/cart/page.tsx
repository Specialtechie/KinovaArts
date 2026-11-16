import type { Metadata } from 'next';
import CartView from '@/components/CartView';

export const metadata: Metadata = { title: 'Your bag' };

export default function CartPage() {
  return (
    <div className="px-6 py-14 md:px-10">
      <h1 className="section-title mb-8">Your bag</h1>
      <CartView />
    </div>
  );
}
