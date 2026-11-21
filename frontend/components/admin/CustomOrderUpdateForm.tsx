'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { Card, Field, s } from './ui';
import { useCurrency } from '../CurrencyProvider';

const MAX_COMPLETION_IMAGE_SIZE_BYTES = 1024 * 1024;

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
  const [deliveryFee, setDeliveryFee] = useState(s(request.delivery_fee || '0'));
  const [notes, setNotes] = useState(s(request.admin_notes));
  const [completionDetails, setCompletionDetails] = useState(s(request.completion_details));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const formElement = e.currentTarget;
    const form = new FormData();
    form.append('status', status);
    form.append('quoted_price', price);
    form.append('quoted_currency', quotedCurrency);
    form.append('delivery_fee', deliveryFee);
    form.append('admin_notes', notes);
    form.append('completion_details', completionDetails);
    const images = (formElement.elements.namedItem('completion_images') as HTMLInputElement).files;
    const selectedImages = Array.from(images ?? []);
    if (selectedImages.length > 3) {
      setBusy(false);
      setMsg({ ok: false, text: 'Please attach at most 3 completion photos.' });
      return;
    }
    const tooLarge = selectedImages.find((image) => image.size > MAX_COMPLETION_IMAGE_SIZE_BYTES);
    if (tooLarge) {
      setBusy(false);
      setMsg({ ok: false, text: `"${tooLarge.name}" is larger than 1 MB. Please choose a smaller image.` });
      return;
    }
    selectedImages.forEach((image) => form.append('completion_images[]', image));
    const r = await call(`admin/custom-orders/${request.id}`, { form });
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
        <Field label={`Delivery fee (${quotedCurrency})`} hint="Added to the remaining balance after the customer provides a delivery address.">
          <input type="number" step="0.01" min="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="field-input" />
        </Field>
        <Field label="Notes for the customer">
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="field-input" />
        </Field>
        {status === 'completed' && (
          <>
            <Field label="Completion details" hint="Tell the customer what is finished before delivery.">
              <textarea
                rows={4}
                required
                value={completionDetails}
                onChange={(e) => setCompletionDetails(e.target.value)}
                className="field-input"
              />
            </Field>
            <Field label="Completion photos (optional, up to 3; 1 MB max each)">
              <input
                type="file"
                name="completion_images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="field-input"
              />
            </Field>
            {!!request.completion_images?.length && (
              <div className="flex flex-wrap gap-2">
                {request.completion_images.map((image: string) => (
                  <a key={image} href={image} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Completion update" className="h-20 w-20 rounded object-cover" />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
        <p className="text-xs text-ink/50">
          Set the price and currency before changing the status to Quoted. Paystack charges in NGN. A completed custom piece is ready for final payment, but has not shipped or been delivered.
        </p>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green' : 'text-clay'}`}>{msg.text}</p>}
        <button disabled={busy} className="btn-primary w-fit">{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </Card>
  );
}
