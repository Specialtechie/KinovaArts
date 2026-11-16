'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { dateLabel, usd } from '@/lib/format';
import DeleteButton from './DeleteButton';
import { Card, Field } from './ui';

export default function CouponManager({ coupons }: { coupons: any[] }) {
  const router = useRouter();
  const [f, setF] = useState({ code: '', percent_off: '', amount_off: '', min_order_total: '', expires_at: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [key]: e.target.value }));

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await call('admin/coupons', { body: f });
    setBusy(false);

    if (!r.ok) {
      setError(firstError(r.data));
      return;
    }
    setF({ code: '', percent_off: '', amount_off: '', min_order_total: '', expires_at: '' });
    router.refresh();
  }

  async function toggle(c: any) {
    await call(`admin/coupons/${c.id}`, { body: { active: !c.active } });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-x-auto rounded-md border border-line bg-panel">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-parchment text-left">
              <th className="p-3">Code</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Minimum</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Active</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">{c.percent_off ? `${c.percent_off}%` : usd(c.amount_off)}</td>
                <td className="p-3">{c.min_order_total ? usd(c.min_order_total) : '—'}</td>
                <td className="p-3">{c.expires_at ? dateLabel(c.expires_at) : '—'}</td>
                <td className="p-3">
                  <button type="button" onClick={() => toggle(c)} className={`pill ${c.active ? 'pill-active' : ''}`}>{c.active ? 'On' : 'Off'}</button>
                </td>
                <td className="p-3 text-right"><DeleteButton path={`admin/coupons/${c.id}`} confirmText="Delete this coupon?" /></td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink/60">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Card title="New coupon">
        <form onSubmit={create} className="flex flex-col gap-3">
          <Field label="Code"><input required value={f.code} onChange={set('code')} className="field-input uppercase" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Percent off"><input type="number" min="1" max="100" value={f.percent_off} onChange={set('percent_off')} className="field-input" /></Field>
            <Field label="Or amount off (USD)"><input type="number" step="0.01" min="0" value={f.amount_off} onChange={set('amount_off')} className="field-input" /></Field>
          </div>
          <Field label="Minimum order (USD)"><input type="number" step="0.01" min="0" value={f.min_order_total} onChange={set('min_order_total')} className="field-input" /></Field>
          <Field label="Expires on"><input type="date" value={f.expires_at} onChange={set('expires_at')} className="field-input" /></Field>
          {error && <p className="text-sm text-clay">{error}</p>}
          <button disabled={busy} className="btn-primary w-fit">Add coupon</button>
        </form>
      </Card>
    </div>
  );
}
