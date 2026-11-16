import type { Metadata } from 'next';
import CollectionForm from '@/components/admin/CollectionForm';
import { PageTitle } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'New collection' };

export default function NewCollection() {
  return (
    <div>
      <PageTitle title="New collection" />
      <CollectionForm />
    </div>
  );
}
