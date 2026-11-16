'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { prepareImage } from '@/lib/image';
import { Card, Field, s } from './ui';

export default function BannerForm({ banner }: { banner?: any }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = !!banner;
  const [title, setTitle] = useState(s(banner?.title));
  const [subtitle, setSubtitle] = useState(s(banner?.subtitle));
  const [linkUrl, setLinkUrl] = useState(s(banner?.link_url));
  const [sortOrder, setSortOrder] = useState(s(banner?.sort_order ?? 0));
  const [active, setActive] = useState(banner ? !!banner.active : true);
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
    form.append('title', title);
    form.append('subtitle', subtitle);
    form.append('link_url', linkUrl);
    form.append('sort_order', sortOrder || '0');
    form.append('active', active ? '1' : '0');
    if (imageUrl.trim()) form.append('image_url', imageUrl.trim());

    const file = fileRef.current?.files?.[0];
    if (file) {
      const { blob, name } = await prepareImage(file);
      form.append('image', blob, name);
    }

    const r = await call(editing ? `admin/banners/${banner.id}` : 'admin/banners', { form });
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
      router.push('/admin/banners');
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl">
      <Card>
        <div className="flex flex-col gap-4">
          <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" /></Field>
          <Field label="Subtitle"><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="field-input" /></Field>
          <Field label="Link" hint="A page on your site such as /collections/new-arrivals, or a full URL.">
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="field-input" />
          </Field>
          <Field label="Order" hint="Lower numbers show first.">
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="field-input" />
          </Field>

          {banner?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner.image_url} alt="" className="h-24 w-40 rounded object-cover" />
          )}
          <Field label={editing ? 'Replace image' : 'Image'}>
            <input ref={fileRef} type="file" accept="image/*" className="field-input" />
          </Field>
          <Field label="…or paste an image URL">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="field-input" />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Show on the homepage
          </label>

          {error && <p className="text-sm text-clay">{error}</p>}
          {saved && <p className="text-sm text-green">Saved.</p>}

          <div className="flex gap-3">
            <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create banner'}</button>
            <Link href="/admin/banners" className="btn-ghost">Back</Link>
          </div>
        </div>
      </Card>
    </form>
  );
}
