import type { Metadata } from 'next';
import CategoryManager from '@/components/admin/CategoryManager';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesAdmin() {
  const categories = await adminGet('/categories', '/admin/categories');

  return (
    <div>
      <PageTitle title="Categories" />
      <CategoryManager categories={categories} />
    </div>
  );
}
