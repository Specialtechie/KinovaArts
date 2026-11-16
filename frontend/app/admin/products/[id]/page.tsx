import type { Metadata } from 'next';
import DeleteButton from '@/components/admin/DeleteButton';
import ImageManager from '@/components/admin/ImageManager';
import ProductForm from '@/components/admin/ProductForm';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const path = `/admin/products/${id}`;

  const [product, categories, collections] = await Promise.all([
    adminGet(`/products/${id}`, path),
    adminGet('/categories', path),
    adminGet('/collections', path),
  ]);

  return (
    <div className="max-w-4xl">
      <PageTitle title={product.name}>
        <DeleteButton
          path={`admin/products/${id}`}
          label="Archive product"
          redirectTo="/admin/products"
          confirmText="Archive this product? It leaves the store, but past orders keep it."
        />
      </PageTitle>

      <div className="flex flex-col gap-6">
        <ImageManager productId={product.id} images={product.images ?? []} />
        <ProductForm product={product} categories={categories} collections={collections} />
      </div>
    </div>
  );
}
