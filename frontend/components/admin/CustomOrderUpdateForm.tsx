'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { Card, Field, s } from './ui';
import { useCurrency } from '../CurrencyProvider';

const STATUSES: [string, string][] = [
  ['pending', 'Pending'],
  ['reviewing', 'Reviewing'],
  ['quoted', 'Quoted (emails the customer)'],
  ['accepted', 'Accepted'],
  ['declined', 'Declined (emails the customer)'],
  ['completed', 'Completed / ready (emails the customer)'],
];

export default function CustomOrderUpdateForm({ request }: { request: any }) {
  const router = useRouter();
  const { currencies } = useCurrency();
  const [status, setStatus] = useState(request.status);
  const [price, setPrice] = useState(s(request.quoted_price));
  const [quotedCurrency, setQuotedCurrency] = useState(request.quoted_currency || 'USD');
  const [notes, setNotes] = useState(s(request.admin_notes));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await call(`admin/custom-orders/${request.id}`, {
      body: { status, quoted_price: price, quoted_currency: quotedCurrency, admin_notes: notes },
    });
    setBusy(false);

    if (r.ok) {
      setMsg({ ok: true, text: 'Saved.' });
      router.refresh();
    } else {
      setMsg({ ok: false, text: firstError(r.data) });
    }
  }

  return (
    <Card title="Respond to this request">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input">
            {STATUSES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </Field>
        <Field label="Quote currency">
          <select value={quotedCurrency} onChange={(e) => setQuotedCurrency(e.target.value)} className="field-input">
            {Array.from(new Set([quotedCurrency, ...currencies])).sort().map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </Field>
        <Field label={`Quoted price (${quotedCurrency})`} hint="Quotes are paid as a 70% deposit and 30% balance.">
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="field-input" />
        </Field>
        <Field label="Notes for the customer">
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="field-input" />
        </Field>
        <p className="text-xs text-ink/50">
          Set the price and currency before changing the status to Quoted. Paystack charges in NGN; the customer sees an estimated NGN conversion before continuing. For split payments, mark the piece Completed when it&apos;s ready so the balance can be paid.
        </p>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green' : 'text-clay'}`}>{msg.text}</p>}
        <button disabled={busy} className="btn-primary w-fit">{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </Card>
  );
}
