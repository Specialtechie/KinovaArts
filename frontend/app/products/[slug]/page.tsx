import type { Metadata } from 'next';
import Link from 'next/link';
import { api, catalog } from '@/lib/api';
import AddToBag from '@/components/AddToBag';
import CurrencyPrice from '@/components/CurrencyPrice';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import ReviewForm from '@/components/ReviewForm';
import WishlistButton from '@/components/WishlistButton';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await api(`/products/${slug}`, { revalidate: 60 });
  if (!r.ok) return { title: 'Piece not found' };
  const p = r.data;
  return {
    title: p.seo_title || p.name,
    description: p.seo_description || String(p.description || '').slice(0, 160),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await catalog(`/products/${slug}`);

  const dims = [p.width_cm && `W ${p.width_cm}`, p.height_cm && `H ${p.height_cm}`, p.depth_cm && `D ${p.depth_cm}`].filter(Boolean);
  const specs: [string, string | null][] = [
    ['Material', p.material],
    ['Wood', p.wood_type],
    ['Color', p.color],
    ['Origin', p.country_of_origin],
    ['Region / tribe', p.region_or_tribe],
    ['Dimensions', dims.length ? `${dims.join(' · ')} cm` : null],
    ['Weight', p.weight_kg ? `${p.weight_kg} kg` : null],
    ['SKU', p.sku],
  ];

  const stockLabel =
    p.stock <= 0 ? 'Sold out' : p.stock <= (p.low_stock_threshold ?? 3) ? `Only ${p.stock} left` : 'In stock';

  return (
    <div className="px-6 py-12 md:px-10">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={p.images || []} name={p.name} />

        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-clay">
            {p.category?.name}
            {p.country_of_origin ? ` · ${p.country_of_origin}` : ''}
          </span>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{p.name}</h1>

          {p.rating_average && (
            <p className="mt-2 text-sm text-ink/70">
              <span className="text-gold">{'★'.repeat(Math.round(p.rating_average))}</span> {p.rating_average} ({p.rating_count})
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            {p.sale_price ? (
              <>
                <CurrencyPrice amount={p.sale_price} className="text-2xl font-semibold text-clay" />
                <CurrencyPrice amount={p.price} className="text-ink/50 line-through" />
              </>
            ) : (
              <CurrencyPrice amount={p.price} className="text-2xl font-semibold" />
            )}
            <span className="rounded-full border border-line px-3 py-1 text-xs">{stockLabel}</span>
          </div>

          <p className="mt-5 whitespace-pre-line leading-relaxed text-ink/80">{p.description}</p>

          <div className="mt-8 flex max-w-xs flex-col gap-3">
            <AddToBag productId={p.id} stock={p.stock} />
            <WishlistButton productId={p.id} />
            <Link href={`/custom-order?product=${p.slug}`} className="btn-ghost w-full text-center">
              Want this customized? Request a custom order
            </Link>
          </div>

          {p.story_behind && (
            <div className="mt-10 rounded-md border border-line bg-panel p-5">
              <div className="font-display text-lg font-semibold">The story behind this piece</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">{p.story_behind}</p>
            </div>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {specs.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink/50">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          {p.care_instructions && (
            <div className="mt-8">
              <div className="font-display text-lg font-semibold">Care</div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{p.care_instructions}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16">
        <h2 className="section-title mb-6">Reviews</h2>
        {p.reviews?.length > 0 ? (
          <div className="mb-8 flex max-w-2xl flex-col gap-4">
            {p.reviews.map((r: any) => (
              <div key={r.id} className="rounded-md border border-line bg-panel p-4">
                <div className="text-gold">{'★'.repeat(r.rating)}<span className="text-ink/20">{'★'.repeat(5 - r.rating)}</span></div>
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                <p className="mt-2 text-xs text-ink/50">{r.author}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-6 text-sm text-ink/60">No reviews yet.</p>
        )}
        <ReviewForm productId={p.id} />
      </section>

      {p.related?.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">You may also like</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {p.related.map((r: any) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
