'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { prepareImage } from '@/lib/image';
import { Card, Field, s } from './ui';

export default function CollectionForm({ collection }: { collection?: any }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = !!collection;
  const [name, setName] = useState(s(collection?.name));
  const [description, setDescription] = useState(s(collection?.description));
  const [featured, setFeatured] = useState(!!collection?.featured);
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    form.append('featured', featured ? '1' : '0');
    if (imageUrl.trim()) form.append('hero_image_url', imageUrl.trim());

    const file = fileRef.current?.files?.[0];
    if (file) {
      const { blob, name: fileName } = await prepareImage(file);
      form.append('image', blob, fileName);
    }

    const r = await call(editing ? `admin/collections/${collection.id}` : 'admin/collections', { form });
    setBusy(false);

    if (!r.ok) {
      setError(firstError(r.data));
      return;
    }
    if (editing) {
      setSaved(true);
      setImageUrl('');
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } else {
      router.push('/admin/collections');
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl">
      <Card>
        <div className="flex flex-col gap-4">
          <Field label="Name"><input required value={name} onChange={(e) => setName(e.target.value)} className="field-input" /></Field>
          <Field label="Description"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="field-input" /></Field>

          {collection?.hero_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.hero_image_url} alt="" className="h-24 w-32 rounded object-cover" />
          )}
          <Field label={editing ? 'Replace cover image' : 'Cover image'}>
            <input ref={fileRef} type="file" accept="image/*" className="field-input" />
          </Field>
          <Field label="…or paste an image URL">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="field-input" />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Feature on the homepage
          </label>

          {error && <p className="text-sm text-clay">{error}</p>}
          {saved && <p className="text-sm text-green">Saved.</p>}

          <div className="flex gap-3">
            <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create collection'}</button>
            <Link href="/admin/collections" className="btn-ghost">Back</Link>
          </div>
        </div>
      </Card>
    </form>
  );
}
