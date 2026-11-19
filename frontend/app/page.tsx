import Link from 'next/link';
import { catalog } from '@/lib/api';
import BannerSlider from '@/components/BannerSlider';
import BannerRow from '@/components/BannerRow';
import ProductCard from '@/components/ProductCard';

export default async function Home() {
  const { banners, featured_collections, new_arrivals, furniture } = await catalog('/home');

  return (
    <div>
      {/* Hero */}
      <section className="grid gap-10 px-6 pb-12 pt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,900px)] md:items-center md:px-10 md:pt-20">
        <div className="text-center md:text-left">
          <span className="pill pill-active">A curated destination for African art and craft</span>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] md:text-6xl">
            Heritage, carried into your home.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-ink/70 md:mx-0">
            Kinova Arts is a curated destination for hand-made African art, furniture, and craft.
            Each piece selected, authenticated, and told through the story of the region and hands that made it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href="/products" className="btn-primary">Explore the collection</Link>
            <a href="#story" className="btn-ghost">Our craft, our sourcing</a>
          </div>
        </div>
        <BannerSlider banners={banners} />
      </section>

      <BannerRow banners={banners} />

      {/* Featured collections */}
      {featured_collections.length > 0 && (
        <section className="px-6 py-14 md:px-10">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="section-title">Collections</h2>
            <Link href="/collections" className="text-sm font-semibold underline">View all collections</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featured_collections.map((c: any) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className={`group relative aspect-[4/5] overflow-hidden rounded-md ${c.hero_image_url ? '' : 'bg-gradient-to-br from-clay to-indigo-deep'}`}
              >
                {c.hero_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.hero_image_url} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/70 via-transparent p-5">
                  <span className="font-display text-2xl font-semibold text-panel">{c.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Storytelling / craftsmanship block */}
      <section
        id="story"
        className="relative overflow-hidden px-6 py-16 text-panel md:px-10"
        style={{ backgroundColor: '#211C2E', backgroundImage: "url('/images/story-background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="pill border-panel text-panel">Our craft</span>
            <h2 className="mt-5 font-display text-3xl font-semibold md:text-4xl">
              Every piece has a maker, a region, and a reason it was made this way.
            </h2>
            <p className="mt-4 leading-relaxed text-panel/75">
              We work directly with woodcarvers, dyers, weavers, and sculptors. Each product page carries
              the story behind the piece: the materials, the region or tribe of origin, and the
              tradition it comes from, so what you bring home is more than an object.
            </p>
            <Link href="/products" className="btn-ghost mt-6 border-panel text-panel">Meet the collection</Link>
          </div>
        </div>
      </section>

      {/* Furniture spotlight */}
      {furniture.length > 0 && (
        <section className="px-6 py-14 md:px-10">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="section-title">Furniture spotlight</h2>
            <Link href="/products?category=furniture" className="text-sm font-semibold underline">View all furniture</Link>
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {furniture.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="px-6 pb-16 pt-4 md:px-10">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="section-title">New arrivals</h2>
          <Link href="/products" className="text-sm font-semibold underline">View all pieces</Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {new_arrivals.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
