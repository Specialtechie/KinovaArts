import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { mainImage, one, usd } from '@/lib/format';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = one(sp.q) || '';
  const status = one(sp.status) || '';
  const page = one(sp.page) || '1';

  const qs = new URLSearchParams({ page });
  if (q) qs.set('q', q);
  if (status) qs.set('status', status);

  const result = await adminGet(`/products?${qs.toString()}`, '/admin/products');

  const pageHref = (n: number) => {
    const p = new URLSearchParams({ page: String(n) });
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    return `/admin/products?${p.toString()}`;
  };

  return (
    <div>
      <PageTitle title="Products">
        <Link href="/admin/products/new" className="btn-primary">Add product</Link>
      </PageTitle>

      <form action="/admin/products" className="mb-5 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Search name or SKU" className="field-input max-w-xs" />
        <select name="status" defaultValue={status} className="field-input max-w-[160px]">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button className="btn-ghost">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((p: any) => {
              const img = mainImage(p);
              const low = p.stock <= p.low_stock_threshold;
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded bg-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span>
                        <span className="block font-medium underline">{p.name}</span>
                        <span className="font-mono text-xs text-ink/50">{p.sku}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3">{p.category?.name ?? '—'}</td>
                  <td className="p-3">{usd(p.sale_price || p.price)}</td>
                  <td className={`p-3 ${low ? 'font-semibold text-clay' : ''}`}>{p.stock}</td>
                  <td className="p-3"><span className="pill capitalize">{p.status}</span></td>
                </tr>
              );
            })}
            {result.data.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-ink/60">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {result.last_page > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {result.current_page > 1 && <Link href={pageHref(result.current_page - 1)} className="btn-ghost">&larr; Previous</Link>}
          <span>Page {result.current_page} of {result.last_page}</span>
          {result.current_page < result.last_page && <Link href={pageHref(result.current_page + 1)} className="btn-ghost">Next &rarr;</Link>}
        </div>
      )}
    </div>
  );
}
