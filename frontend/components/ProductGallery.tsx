'use client';

import { useState } from 'react';

export default function ProductGallery({ images, name }: { images: any[]; name: string }) {
  const [active, setActive] = useState(() => {
    const featured = images.findIndex((i) => i.is_featured);
    return featured >= 0 ? featured : 0;
  });

  if (images.length === 0) {
    return <div className="aspect-square rounded-md bg-gradient-to-br from-clay to-indigo-deep" />;
  }

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-md border border-line bg-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active].url} alt={images[active].alt_text || name} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded border ${i === active ? 'border-ink' : 'border-line'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
