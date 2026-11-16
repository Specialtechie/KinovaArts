'use client';

import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';

export default function CustomOrderPayForm({ id, type, defaultName }: { id: number; type: string; defaultName: string }) {
  const [form, setForm] = useState({
    name: defaultName,
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postcode: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const r = await call(`account/custom-orders/${id}/pay/${type}`, { body: form });

    if (r.ok && r.data?.authorization_url) {
      window.location.assign(r.data.authorization_url);
      return;
    }

    setBusy(false);
    setError(firstError(r.data));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="field-label">Full name</label>
        <input required value={form.name} onChange={set('name')} className="field-input" />
      </div>
      <div>
        <label className="field-label">Address</label>
        <input required value={form.line1} onChange={set('line1')} className="field-input" />
      </div>
      <div>
        <label className="field-label">Apt / suite (optional)</label>
        <input value={form.line2} onChange={set('line2')} className="field-input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">City</label>
          <input required value={form.city} onChange={set('city')} className="field-input" />
        </div>
        <div>
          <label className="field-label">State / region</label>
          <input value={form.state} onChange={set('state')} className="field-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Country</label>
          <input required value={form.country} onChange={set('country')} className="field-input" />
        </div>
        <div>
          <label className="field-label">Postcode</label>
          <input required value={form.postcode} onChange={set('postcode')} className="field-input" />
        </div>
      </div>

      {error && <div className="rounded-md border border-clay bg-clay/10 p-3 text-sm text-clay">{error}</div>}

      <button disabled={busy} className="btn-primary w-fit">
        {busy ? 'Redirecting to Paystack…' : 'Continue to payment'}
      </button>
    </form>
  );
}
