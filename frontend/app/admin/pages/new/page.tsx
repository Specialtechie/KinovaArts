import type { Metadata } from 'next';
import PageForm from '@/components/admin/PageForm';
import { PageTitle } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'New page' };

export default function NewPage() {
  return (
    <div>
      <PageTitle title="New page" />
      <PageForm />
    </div>
  );
}
