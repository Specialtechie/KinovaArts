import type { Metadata } from 'next';
import CollectionForm from '@/components/admin/CollectionForm';
import DeleteButton from '@/components/admin/DeleteButton';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Edit collection' };

export default async function EditCollection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await adminGet(`/collections/${id}`, `/admin/collections/${id}`);

  return (
    <div>
      <PageTitle title={collection.name}>
        <DeleteButton
          path={`admin/collections/${id}`}
          label="Delete collection"
          redirectTo="/admin/collections"
          confirmText="Delete this collection? Its products are not deleted, just unlinked from it."
        />
      </PageTitle>
      <CollectionForm collection={collection} />
    </div>
  );
}
