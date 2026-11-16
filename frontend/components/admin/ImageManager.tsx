'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { call, firstError } from '@/lib/client';
import { prepareImage } from '@/lib/image';
import { Card } from './ui';

export default function ImageManager({ productId, images }: { productId: number; images: any[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  const base = `admin/products/${productId}/images`;

  async function upload() {
    const files = Array.from(fileRef.current?.files ?? []);
    if (files.length === 0) return;

    setBusy(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      setStatus(`Uploading ${i + 1} of ${files.length}…`);
      const { blob, name } = await prepareImage(files[i]);
      const form = new FormData();
      form.append('image', blob, name);

      const r = await call(base, { form });
      if (!r.ok) {
        setError(`${files[i].name}: ${firstError(r.data)}`);
        break;
      }
    }

    if (fileRef.current) fileRef.current.value = '';
    setStatus(null);
    setBusy(false);
    router.refresh();
  }

  async function addUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    const r = await call(base, { body: { url: url.trim() } });
    setBusy(false);
    if (!r.ok) {
      setError(firstError(r.data));
      return;
    }
    setUrl('');
    router.refresh();
  }

  async function makeCover(id: number) {
    setBusy(true);
    await call(`${base}/${id}/feature`, { method: 'POST' });
    setBusy(false);
    router.refresh();
  }

  async function remove(id: number) {
    if (!window.confirm('Remove this photo?')) return;
    setBusy(true);
    await call(`${base}/${id}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card title="Photos">
      {images.length === 0 ? (
        <p className="mb-4 text-sm text-ink/60">No photos yet. The first one you add becomes the cover.</p>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-md border border-line bg-parchment">
              <div className="aspect-square bg-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2 text-xs">
                {img.is_featured ? (
                  <span className="font-semibold text-green">Cover</span>
                ) : (
                  <button type="button" disabled={busy} onClick={() => makeCover(img.id)} className="underline disabled:opacity-50">Make cover</button>
                )}
                <button type="button" disabled={busy} onClick={() => remove(img.id)} className="text-clay underline disabled:opacity-50">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="field-label">Upload photos</label>
          <input ref={fileRef} type="file" accept="image/*" multiple className="field-input" />
        </div>
        <button type="button" onClick={upload} disabled={busy} className="btn-primary">Upload</button>
      </div>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="field-label">Or paste an image URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="field-input" />
        </div>
        <button type="button" onClick={addUrl} disabled={busy} className="btn-ghost">Add URL</button>
      </div>

      <p className="mt-3 text-xs text-ink/50">Large photos are shrunk in your browser before uploading.</p>
      {status && <p className="mt-2 text-sm text-ink/70">{status}</p>}
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </Card>
  );
}
