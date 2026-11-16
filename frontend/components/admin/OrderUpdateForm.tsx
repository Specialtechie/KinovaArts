'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { Card, Field, s } from './ui';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function OrderUpdateForm({ order }: { order: any }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState(s(order.courier));
  const [tracking, setTracking] = useState(s(order.tracking_number));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await call(`admin/orders/${order.id}`, { body: { status, courier, tracking_number: tracking } });
    setBusy(false);

    if (r.ok) {
      setMsg({ ok: true, text: 'Order updated.' });
      router.refresh();
    } else {
      setMsg({ ok: false, text: firstError(r.data) });
    }
  }

  return (
    <Card title="Update order">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input capitalize">
            {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </Field>
        <Field label="Courier"><input value={courier} onChange={(e) => setCourier(e.target.value)} className="field-input" /></Field>
        <Field label="Tracking number"><input value={tracking} onChange={(e) => setTracking(e.target.value)} className="field-input" /></Field>
        <p className="text-xs text-ink/50">Cancelling or refunding a paid order puts its items back in stock.</p>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green' : 'text-clay'}`}>{msg.text}</p>}
        <button disabled={busy} className="btn-primary w-fit">{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </Card>
  );
}
