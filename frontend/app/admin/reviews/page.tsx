import type { Metadata } from 'next';
import Link from 'next/link';
import ReviewActions from '@/components/admin/ReviewActions';
import { PageTitle } from '@/components/admin/ui';
import { adminGet } from '@/lib/admin';
import { dateLabel, one } from '@/lib/format';

export const metadata: Metadata = { title: 'Reviews' };

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const approved = one(sp.approved); // '0', '1' or undefined (all)
  const qs = approved === '0' || approved === '1' ? `?approved=${approved}` : '';

  const result = await adminGet(`/reviews${qs}`, `/admin/reviews${qs}`);

  const tabs: [string, string | undefined][] = [['Awaiting approval', '0'], ['Approved', '1'], ['All', undefined]];

  return (
    <div className="max-w-3xl">
      <PageTitle title="Reviews" />

      <div className="mb-5 flex gap-2">
        {tabs.map(([label, value]) => (
          <Link key={label} href={value ? `/admin/reviews?approved=${value}` : '/admin/reviews'} className={`pill ${approved === value ? 'pill-active' : ''}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {result.data.map((r: any) => (
          <div key={r.id} className="rounded-md border border-line bg-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-gold">{'★'.repeat(r.rating)}<span className="text-ink/20">{'★'.repeat(5 - r.rating)}</span></div>
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                <p className="mt-2 text-xs text-ink/50">
                  {r.user?.name} · {r.product ? <Link href={`/products/${r.product.slug}`} className="underline" target="_blank">{r.product.name}</Link> : 'Deleted product'} · {dateLabel(r.created_at)}
                </p>
              </div>
              <span className="pill">{r.approved ? 'Approved' : 'Pending'}</span>
            </div>
            <div className="mt-3"><ReviewActions id={r.id} approved={!!r.approved} /></div>
          </div>
        ))}
        {result.data.length === 0 && <p className="text-sm text-ink/60">Nothing here.</p>}
      </div>
    </div>
  );
}
