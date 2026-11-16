import type { Metadata } from 'next';
import Link from 'next/link';
import DeleteButton from '@/components/admin/DeleteButton';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';

export const metadata: Metadata = { title: 'Banners' };

export default async function BannersAdmin() {
  const banners: any[] = await adminGet('/banners', '/admin/banners');

  return (
    <div>
      <PageTitle title="Homepage banners">
        <Link href="/admin/banners/new" className="btn-primary">Add banner</Link>
      </PageTitle>

      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Image</th>
              <th className="p-3">Title</th>
              <th className="p-3">Order</th>
              <th className="p-3">Shown</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image_url} alt="" className="h-12 w-20 rounded object-cover" />
                </td>
                <td className="p-3">
                  <div className="font-medium">{b.title}</div>
                  {b.subtitle && <div className="text-xs text-ink/50">{b.subtitle}</div>}
                </td>
                <td className="p-3">{b.sort_order}</td>
                <td className="p-3">{b.active ? 'Yes' : 'Hidden'}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/banners/${b.id}`} className="mr-3 underline">Edit</Link>
                  <DeleteButton path={`admin/banners/${b.id}`} confirmText="Delete this banner?" />
                </td>
              </tr>
            ))}
            {banners.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink/60">No banners yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
