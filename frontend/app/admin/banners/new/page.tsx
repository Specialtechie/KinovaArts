import type { Metadata } from 'next';
import BannerForm from '@/components/admin/BannerForm';
import { PageTitle } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'New banner' };

export default function NewBanner() {
  return (
    <div>
      <PageTitle title="New banner" />
      <BannerForm />
    </div>
  );
}
