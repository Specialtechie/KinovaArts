import type { Metadata } from 'next';
import ProductForm from '@/components/admin/ProductForm';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'New product' };

export default async function NewProduct() {
  const [categories, collections] = await Promise.all([
    adminGet('/categories', '/admin/products/new'),
    adminGet('/collections', '/admin/products/new'),
  ]);

  return (
    <div className="max-w-4xl">
      <PageTitle title="New product" />
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}
