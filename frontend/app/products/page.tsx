import type { Metadata } from 'next';
import Link from 'next/link';
import { catalog } from '@/lib/api';
import { one } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';

export const metadata: Metadata = { title: 'Shop' };

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = one(sp.q);
  const category = one(sp.category);
  const sort = one(sp.sort);
  const page = one(sp.page) || '1';

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (category) qs.set('category', category);
  if (sort) qs.set('sort', sort);
  qs.set('page', page);

  const [categories, result] = await Promise.all([catalog('/categories'), catalog(`/products?${qs.toString()}`)]);

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (category) p.set('category', category);
    if (sort) p.set('sort', sort);
    p.set('page', String(n));
    return `/products?${p.toString()}`;
  };

  return (
    <div className="px-6 py-14 md:px-10">
      <h1 className="section-title mb-6">{q ? `Results for "${q}"` : 'The collection'}</h1>
      <ProductFilters categories={categories} current={{ q, category, sort }} />

      {result.data.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-10 text-center text-sm text-ink/60">
          No pieces match your search yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {result.data.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {result.last_page > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4 text-sm">
          {result.current_page > 1 && <Link href={pageHref(result.current_page - 1)} className="btn-ghost">&larr; Previous</Link>}
          <span>Page {result.current_page} of {result.last_page}</span>
          {result.current_page < result.last_page && <Link href={pageHref(result.current_page + 1)} className="btn-ghost">Next &rarr;</Link>}
        </div>
      )}
    </div>
  );
}
