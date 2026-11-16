import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BannerForm from '@/components/admin/BannerForm';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Edit banner' };

export default async function EditBanner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const banners: any[] = await adminGet('/banners', `/admin/banners/${id}`);
  const banner = banners.find((b) => String(b.id) === id);
  if (!banner) notFound();

  return (
    <div>
      <PageTitle title={banner.title} />
      <BannerForm banner={banner} />
    </div>
  );
}
