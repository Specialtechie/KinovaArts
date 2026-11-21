'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { firstError } from '@/lib/client';
import { useAuth } from './store';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export default function CustomOrderForm({ product }: { product: { id: number; name: string } | null }) {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill once we know who is signed in, without overwriting anything already typed.
  useEffect(() => {
    if (user) {
      setName((n) => n || user.name);
      setEmail((e) => e || user.email);
    }
  }, [user]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const files = (form.elements.namedItem('images') as HTMLInputElement).files;
    if (files && files.length > 3) {
      setError('Please attach at most 3 images.');
      return;
    }
    for (const file of Array.from(files ?? [])) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`"${file.name}" is larger than 2 MB. Please choose a smaller image.`);
        return;
      }
    }

    const fd = new FormData(form);
    fd.delete('images');
    Array.from(files ?? []).forEach((f) => fd.append('images[]', f));

    setBusy(true);
    // Sent straight to the API (not through Vercel) so photos aren't limited by the 4.5 MB function body cap.
    const res = await fetch(`${API}/api/custom-orders`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: fd,
    }).catch(() => null);

    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);

    if (res && res.ok) {
      router.push('/custom-order/thank-you');
      return;
    }
    setError(res ? firstError(data) : 'We could not reach the store. Please try again.');
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {product && (
        <>
          <input type="hidden" name="product_id" value={product.id} />
          <div className="rounded-md border border-line bg-parchment p-3 text-sm">
            Inspired by: <strong>{product.name}</strong>
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">Full name</label>
          <input name="name" required value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" />
        </div>
      </div>

      <div>
        <label className="field-label">Phone (optional)</label>
        <input name="phone" className="field-input" />
      </div>

      <div>
        <label className="field-label">Describe what you&apos;d like</label>
        <textarea
          name="description"
          required
          minLength={20}
          rows={5}
          placeholder="Be as detailed as possible: style, inspiration, intended use, any specific details that matter to you."
          className="field-input"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">Category (optional)</label>
          <input name="category_preference" placeholder="e.g. Furniture, Wall art" className="field-input" />
        </div>
        <div>
          <label className="field-label">Material preference (optional)</label>
          <input name="material_preference" placeholder="e.g. Mahogany, brass" className="field-input" />
        </div>
        <div>
          <label className="field-label">Color preference (optional)</label>
          <input name="color_preference" className="field-input" />
        </div>
        <div>
          <label className="field-label">Dimensions (optional)</label>
          <input name="dimensions" placeholder="e.g. 6ft wide x 3ft tall" className="field-input" />
        </div>
        <div>
          <label className="field-label">Budget range (optional)</label>
          <input name="budget_range" placeholder="e.g. $500–$1000" className="field-input" />
        </div>
        <div>
          <label className="field-label">Desired timeline (optional)</label>
          <input name="desired_timeline" placeholder="e.g. Within 6 weeks" className="field-input" />
        </div>
      </div>

      <div>
        <label className="field-label">Reference images (optional, up to 3; 2 MB max each)</label>
        <input type="file" name="images" accept="image/*" multiple className="field-input" />
        <p className="mt-1 text-xs text-ink/50">Photos of inspiration pieces, sketches, or the space it&apos;s for all help.</p>
      </div>

      {error && <div className="rounded-md border border-clay bg-clay/10 p-3 text-sm text-clay">{error}</div>}

      <button disabled={busy} className="btn-primary w-fit">{busy ? 'Sending…' : 'Submit request'}</button>
    </form>
  );
}
