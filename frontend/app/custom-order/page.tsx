import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { one } from '@/lib/format';
import CustomOrderForm from '@/components/CustomOrderForm';

export const metadata: Metadata = { title: 'Request a custom piece' };

export default async function CustomOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const slug = one((await searchParams).product);

  let product: { id: number; name: string } | null = null;
  if (slug) {
    const r = await api(`/products/${slug}`, { revalidate: 60 });
    if (r.ok) product = { id: r.data.id, name: r.data.name };
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-14 md:px-10">
      <h1 className="section-title mb-2">Request a custom piece</h1>
      <p className="mb-8 text-ink/70">
        Tell us what you have in mind: a variation on an existing piece, a specific size or material, or something
        entirely original. We&apos;ll review your request and follow up with a quote and timeline.
      </p>
      <CustomOrderForm product={product} />
    </div>
  );
}
