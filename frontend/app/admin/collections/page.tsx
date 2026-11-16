import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Collections' };

export default async function CollectionsAdmin() {
  const collections: any[] = await adminGet('/collections', '/admin/collections');

  return (
    <div>
      <PageTitle title="Collections">
        <Link href="/admin/collections/new" className="btn-primary">Add collection</Link>
      </PageTitle>

      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">On homepage</th>
              <th className="p-3">Products</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  {c.hero_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.hero_image_url} alt="" className="h-12 w-16 rounded object-cover" />
                  ) : (
                    <span className="text-xs text-ink/40">None</span>
                  )}
                </td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.slug}</td>
                <td className="p-3">{c.featured ? 'Yes' : '—'}</td>
                <td className="p-3">{c.products_count}</td>
                <td className="p-3 text-right"><Link href={`/admin/collections/${c.id}`} className="underline">Edit</Link></td>
              </tr>
            ))}
            {collections.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink/60">No collections yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
