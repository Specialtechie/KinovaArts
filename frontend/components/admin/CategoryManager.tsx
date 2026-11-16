'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import DeleteButton from './DeleteButton';
import { Card, Field, s } from './ui';

type Draft = { name: string; description: string; image_url: string; parent_id: string };
const blank: Draft = { name: '', description: '', image_url: '', parent_id: '' };

export default function CategoryManager({ categories }: { categories: any[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  function startEdit(c: any) {
    setEditing(c.id);
    setError(null);
    setDraft({ name: s(c.name), description: s(c.description), image_url: s(c.image_url), parent_id: s(c.parent_id) });
  }

  function reset() {
    setEditing(null);
    setDraft(blank);
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = editing
      ? await call(`admin/categories/${editing}`, { body: draft })
      : await call('admin/categories', { body: draft });
    setBusy(false);

    if (!r.ok) {
      setError(firstError(r.data));
      return;
    }
    reset();
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Products</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.slug}</td>
                <td className="p-3">{c.products_count}</td>
                <td className="p-3 text-right">
                  <button type="button" onClick={() => startEdit(c)} className="mr-3 underline">Edit</button>
                  <DeleteButton
                    path={`admin/categories/${c.id}`}
                    confirmText="Delete this category? Its products stay in the store, just uncategorised."
                  />
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-ink/60">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Card title={editing ? 'Edit category' : 'New category'}>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Name"><input required value={draft.name} onChange={set('name')} className="field-input" /></Field>
          <Field label="Description"><input value={draft.description} onChange={set('description')} className="field-input" /></Field>
          <Field label="Image URL"><input value={draft.image_url} onChange={set('image_url')} className="field-input" /></Field>
          <Field label="Parent category">
            <select value={draft.parent_id} onChange={set('parent_id')} className="field-input">
              <option value="">None</option>
              {categories.filter((c) => c.id !== editing).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {error && <p className="text-sm text-clay">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} className="btn-primary">{editing ? 'Save' : 'Add category'}</button>
            {editing && <button type="button" onClick={reset} className="btn-ghost">Cancel</button>}
          </div>
        </form>
      </Card>
    </div>
  );
}
