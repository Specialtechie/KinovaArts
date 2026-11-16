'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { Card, Field, s } from './ui';

type Change = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

export default function ProductForm({ product, categories, collections }: { product?: any; categories: any[]; collections: any[] }) {
  const router = useRouter();
  const editing = !!product;

  const [f, setF] = useState({
    name: s(product?.name),
    slug: s(product?.slug),
    sku: s(product?.sku),
    barcode: s(product?.barcode),
    description: s(product?.description),
    story_behind: s(product?.story_behind),
    care_instructions: s(product?.care_instructions),
    price: s(product?.price),
    sale_price: s(product?.sale_price),
    stock: s(product?.stock ?? 0),
    low_stock_threshold: s(product?.low_stock_threshold ?? 3),
    status: s(product?.status ?? 'draft'),
    category_id: s(product?.category_id),
    material: s(product?.material),
    wood_type: s(product?.wood_type),
    color: s(product?.color),
    country_of_origin: s(product?.country_of_origin),
    region_or_tribe: s(product?.region_or_tribe),
    width_cm: s(product?.width_cm),
    height_cm: s(product?.height_cm),
    depth_cm: s(product?.depth_cm),
    weight_kg: s(product?.weight_kg),
    shipping_weight_kg: s(product?.shipping_weight_kg),
    seo_title: s(product?.seo_title),
    seo_description: s(product?.seo_description),
  });
  const [selected, setSelected] = useState<number[]>(product?.collection_ids ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const on = (key: keyof typeof f) => (e: Change) => setF((prev) => ({ ...prev, [key]: e.target.value }));
  const toggle = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const body = { ...f, collection_ids: selected };
    const r = editing ? await call(`admin/products/${product.id}`, { body }) : await call('admin/products', { body });
    setBusy(false);

    if (!r.ok) {
      setError(firstError(r.data));
      return;
    }

    if (editing) {
      setSaved(true);
      router.refresh();
    } else {
      // Photos are added on the edit page, where each one uploads on its own.
      router.push(`/admin/products/${r.data.id}`);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Card title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><input required value={f.name} onChange={on('name')} className="field-input" /></Field>
          <Field label="URL slug" hint="Leave empty to build it from the name."><input value={f.slug} onChange={on('slug')} className="field-input" /></Field>
          <Field label="SKU" hint="Leave empty to generate one."><input value={f.sku} onChange={on('sku')} className="field-input" /></Field>
          <Field label="Barcode"><input value={f.barcode} onChange={on('barcode')} className="field-input" /></Field>
        </div>
        <div className="mt-4">
          <Field label="Description"><textarea required rows={4} value={f.description} onChange={on('description')} className="field-input" /></Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Story behind the piece"><textarea rows={4} value={f.story_behind} onChange={on('story_behind')} className="field-input" /></Field>
          <Field label="Care instructions"><textarea rows={4} value={f.care_instructions} onChange={on('care_instructions')} className="field-input" /></Field>
        </div>
      </Card>

      <Card title="Pricing and stock">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Price (USD)"><input required type="number" step="0.01" min="0" value={f.price} onChange={on('price')} className="field-input" /></Field>
          <Field label="Sale price (USD)"><input type="number" step="0.01" min="0" value={f.sale_price} onChange={on('sale_price')} className="field-input" /></Field>
          <Field label="Stock"><input required type="number" min="0" value={f.stock} onChange={on('stock')} className="field-input" /></Field>
          <Field label="Low-stock alert at"><input type="number" min="0" value={f.low_stock_threshold} onChange={on('low_stock_threshold')} className="field-input" /></Field>
        </div>
      </Card>

      <Card title="Organization">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Status" hint="Only Active products show in the store.">
            <select value={f.status} onChange={on('status')} className="field-input">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Category">
            <select value={f.category_id} onChange={on('category_id')} className="field-input">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <label className="field-label">Collections</label>
          {collections.length === 0 ? (
            <p className="text-sm text-ink/60">No collections yet.</p>
          ) : (
            <div className="grid gap-2 rounded-md border border-line bg-parchment p-3 sm:grid-cols-2">
              {collections.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card title="Materials and origin">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Material"><input value={f.material} onChange={on('material')} className="field-input" /></Field>
          <Field label="Wood type"><input value={f.wood_type} onChange={on('wood_type')} className="field-input" /></Field>
          <Field label="Color"><input value={f.color} onChange={on('color')} className="field-input" /></Field>
          <Field label="Country of origin"><input value={f.country_of_origin} onChange={on('country_of_origin')} className="field-input" /></Field>
          <Field label="Region or tribe"><input value={f.region_or_tribe} onChange={on('region_or_tribe')} className="field-input" /></Field>
        </div>
      </Card>

      <Card title="Size and weight">
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="Width (cm)"><input type="number" step="0.1" value={f.width_cm} onChange={on('width_cm')} className="field-input" /></Field>
          <Field label="Height (cm)"><input type="number" step="0.1" value={f.height_cm} onChange={on('height_cm')} className="field-input" /></Field>
          <Field label="Depth (cm)"><input type="number" step="0.1" value={f.depth_cm} onChange={on('depth_cm')} className="field-input" /></Field>
          <Field label="Weight (kg)"><input type="number" step="0.1" value={f.weight_kg} onChange={on('weight_kg')} className="field-input" /></Field>
          <Field label="Shipping weight (kg)"><input type="number" step="0.1" value={f.shipping_weight_kg} onChange={on('shipping_weight_kg')} className="field-input" /></Field>
        </div>
      </Card>

      <Card title="Search engines">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SEO title"><input value={f.seo_title} onChange={on('seo_title')} className="field-input" /></Field>
          <Field label="SEO description"><input value={f.seo_description} onChange={on('seo_description')} className="field-input" /></Field>
        </div>
      </Card>

      {error && <div className="rounded-md border border-clay bg-clay/10 p-3 text-sm text-clay">{error}</div>}
      {saved && <div className="rounded-md border border-green bg-green/10 p-3 text-sm text-green">Saved.</div>}

      <div className="flex items-center gap-3">
        <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>
        <Link href="/admin/products" className="btn-ghost">Back to products</Link>
      </div>
      {!editing && <p className="text-xs text-ink/50">You&apos;ll add photos on the next screen.</p>}
    </form>
  );
}
