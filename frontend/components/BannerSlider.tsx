import Link from 'next/link';

export default function BannerSlider({ banners }: { banners: any[] }) {
  const banner = banners[0];

  if (!banner) {
    return <div className="h-72 w-full rounded-md bg-gradient-to-br from-indigo to-clay shadow-soft md:h-80" />;
  }

  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.image_url} alt={banner.title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-transparent p-5">
        <span className="font-display text-lg font-semibold text-panel">{banner.title}</span>
        {banner.subtitle && <span className="text-sm text-panel/85">{banner.subtitle}</span>}
      </div>
    </>
  );

  const className = 'relative block aspect-[2/1] w-full max-w-[800px] overflow-hidden rounded-md bg-panel shadow-soft';

  if (banner.link_url?.startsWith('http')) {
    return <a href={banner.link_url} className={className}>{content}</a>;
  }

  if (banner.link_url) {
    return <Link href={banner.link_url} className={className}>{content}</Link>;
  }

  return <div className={className}>{content}</div>;
}
