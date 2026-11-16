import type { Metadata } from 'next';
import { api, catalog } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await api(`/collections/${slug}`, { revalidate: 60 });
  return { title: r.ok ? r.data.collection.name : 'Collection' };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const { collection, products } = await catalog(`/collections/${slug}`);

  return (
    <div className="px-6 py-14 md:px-10">
      <h1 className="section-title">{collection.name}</h1>
      {collection.description && <p className="mt-2 max-w-2xl text-ink/70">{collection.description}</p>}

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-md border border-dashed border-line p-10 text-center text-sm text-ink/60">
            No pieces in this collection yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
