'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { Card, Field, s } from './ui';

export default function PageForm({ page }: { page?: any }) {
  const router = useRouter();
  const editing = !!page;
  const [slug, setSlug] = useState(s(page?.slug));
  const [title, setTitle] = useState(s(page?.title));
  const [content, setContent] = useState(s(page?.content));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const body = { slug, title, content };
    const r = editing ? await call(`admin/pages/${page.id}`, { body }) : await call('admin/pages', { body });
    setBusy(false);

    if (!r.ok) {
      setError(firstError(r.data));
      return;
    }
    if (editing) {
      setSaved(true);
      router.refresh();
    } else {
      router.push('/admin/pages');
    }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title"><input required value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" /></Field>
            <Field label="URL slug" hint={`Shown at /pages/${slug || 'your-slug'}`}>
              <input required value={slug} onChange={(e) => setSlug(e.target.value)} className="field-input" />
            </Field>
          </div>
          <Field label="Content" hint="Plain text. Line breaks are kept.">
            <textarea required rows={16} value={content} onChange={(e) => setContent(e.target.value)} className="field-input" />
          </Field>

          {error && <p className="text-sm text-clay">{error}</p>}
          {saved && <p className="text-sm text-green">Saved.</p>}

          <div className="flex gap-3">
            <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : editing ? 'Save changes' : 'Create page'}</button>
            <Link href="/admin/pages" className="btn-ghost">Back</Link>
          </div>
        </div>
      </Card>
    </form>
  );
}
