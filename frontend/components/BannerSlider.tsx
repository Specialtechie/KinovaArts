'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BannerSlider({ banners }: { banners: any[] }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) {
    return <div className="h-72 w-full rounded-md bg-gradient-to-br from-indigo to-clay shadow-soft md:h-80" />;
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-md shadow-soft md:h-80">
      {banners.map((b, i) => {
        const inner = (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-transparent p-5">
              <span className="font-display text-lg font-semibold text-panel">{b.title}</span>
              {b.subtitle && <span className="text-sm text-panel/85">{b.subtitle}</span>}
            </div>
          </>
        );
        const cls = `absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`;

        return b.link_url ? (
          b.link_url.startsWith('http') ? (
            <a key={b.id} href={b.link_url} className={cls}>{inner}</a>
          ) : (
            <Link key={b.id} href={b.link_url} className={cls}>{inner}</Link>
          )
        ) : (
          <div key={b.id} className={cls}>{inner}</div>
        );
      })}

      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition ${i === index ? 'bg-panel' : 'bg-panel/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
