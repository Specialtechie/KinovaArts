import Link from 'next/link';

type Banner = {
  id: number;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
};

export default function BannerRow({ banners }: { banners: Banner[] }) {
  const items = banners.slice(0, 3);

  if (items.length === 0) return null;

  const columns = items.length === 3 ? 'md:grid-cols-3' : items.length === 2 ? 'md:grid-cols-2' : '';

  return (
    <section className="px-6 pb-14 md:px-10" aria-label="Homepage banners">
      <div className={`grid grid-cols-1 gap-5 ${columns}`}>
        {items.map((banner) => {
          const card = (
            <div className="group relative aspect-[16/9] overflow-hidden rounded-md bg-gradient-to-br from-indigo to-clay shadow-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image_url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/75 via-ink/10 to-transparent p-5">
                <span className="font-display text-xl font-semibold text-panel">{banner.title}</span>
                {banner.subtitle && <span className="mt-1 text-sm text-panel/85">{banner.subtitle}</span>}
              </div>
            </div>
          );

          if (!banner.link_url) {
            return <div key={banner.id}>{card}</div>;
          }

          return banner.link_url.startsWith('http') ? (
            <a key={banner.id} href={banner.link_url} className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
              {card}
            </a>
          ) : (
            <Link key={banner.id} href={banner.link_url} className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
