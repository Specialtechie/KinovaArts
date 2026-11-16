import type { Metadata } from 'next';
import Link from 'next/link';
import DeleteButton from '@/components/admin/DeleteButton';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { dateLabel } from '@/lib/format';

export const metadata: Metadata = { title: 'Pages' };

export default async function PagesAdmin() {
  const pages: any[] = await adminGet('/pages', '/admin/pages');

  return (
    <div>
      <PageTitle title="Pages">
        <Link href="/admin/pages/new" className="btn-primary">Add page</Link>
      </PageTitle>

      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Title</th>
              <th className="p-3">Address</th>
              <th className="p-3">Updated</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-3 font-medium">{p.title}</td>
                <td className="p-3 font-mono text-xs">/pages/{p.slug}</td>
                <td className="p-3">{dateLabel(p.updated_at)}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/pages/${p.id}`} className="mr-3 underline">Edit</Link>
                  <DeleteButton path={`admin/pages/${p.id}`} confirmText="Delete this page? Links to it will stop working." />
                </td>
              </tr>
            ))}
            {pages.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-ink/60">No pages yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
