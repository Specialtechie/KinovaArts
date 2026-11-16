import type { Metadata } from 'next';
import CouponManager from '@/components/admin/CouponManager';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Coupons' };

export default async function CouponsAdmin() {
  const coupons = await adminGet('/coupons', '/admin/coupons');

  return (
    <div>
      <PageTitle title="Coupons" />
      <CouponManager coupons={coupons} />
    </div>
  );
}
