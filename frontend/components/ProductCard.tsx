import Link from 'next/link';
import { mainImage } from '@/lib/format';
import CurrencyPrice from './CurrencyPrice';

export default function ProductCard({ product }: { product: any }) {
  const image = mainImage(product);

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col overflow-hidden rounded-md border border-line bg-panel">
      <div className="relative aspect-square overflow-hidden bg-line">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        )}
        {product.stock <= 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-panel">Sold out</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-clay">
          {product.category?.name}
          {product.country_of_origin ? ` · ${product.country_of_origin}` : ''}
        </span>
        <span className="font-display text-lg font-semibold leading-tight">{product.name}</span>
        <div className="mt-auto flex items-center gap-2 pt-2">
          {product.sale_price ? (
            <>
              <CurrencyPrice amount={product.sale_price} className="font-semibold text-clay" />
              <CurrencyPrice amount={product.price} className="text-sm text-ink/50 line-through" />
            </>
          ) : (
            <CurrencyPrice amount={product.price} className="font-semibold" />
          )}
        </div>
      </div>
    </Link>
  );
}
