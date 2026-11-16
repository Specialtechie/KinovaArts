import type { Metadata } from 'next';
import PageForm from '@/components/admin/PageForm';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Edit page' };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await adminGet(`/pages/${id}`, `/admin/pages/${id}`);

  return (
    <div>
      <PageTitle title={page.title} />
      <PageForm page={page} />
    </div>
  );
}
