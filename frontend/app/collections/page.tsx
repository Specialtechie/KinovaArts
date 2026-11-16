import type { Metadata } from 'next';
import Link from 'next/link';
import { catalog } from '@/lib/api';

export const metadata: Metadata = { title: 'Collections' };

export default async function Collections() {
  const collections = await catalog('/collections');

  return (
    <div className="px-6 py-14 md:px-10">
      <h1 className="section-title mb-8">Collections</h1>

      {collections.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-10 text-center text-sm text-ink/60">No collections yet.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {collections.map((c: any) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className={`group relative aspect-[4/5] overflow-hidden rounded-md ${c.hero_image_url ? '' : 'bg-gradient-to-br from-clay to-indigo-deep'}`}
            >
              {c.hero_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.hero_image_url} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-ink/70 via-transparent p-5">
                <span className="font-display text-2xl font-semibold text-panel">{c.name}</span>
                <span className="mt-1 text-sm text-panel/80">
                  {c.products_count} {c.products_count === 1 ? 'piece' : 'pieces'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
