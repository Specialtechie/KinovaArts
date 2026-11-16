'use client';

import { usePathname } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { useAuth } from './store';

export default function ReviewForm({ productId }: { productId: number }) {
  const { user, openAuth } = useAuth();
  const pathname = usePathname();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) {
    return (
      <button type="button" onClick={() => openAuth('signin', pathname)} className="btn-ghost">
        Sign in to write a review
      </button>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const r = await call(`products/${productId}/reviews`, { body: { rating, comment } });
    setBusy(false);

    if (r.ok) {
      setMessage({ ok: true, text: r.data?.message || 'Thanks! Your review will appear once approved.' });
      setComment('');
    } else {
      setMessage({ ok: false, text: firstError(r.data) });
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-3">
      <div>
        <label className="field-label">Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="field-input">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Your review (optional)</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000} className="field-input" />
      </div>
      {message && <p className={`text-sm ${message.ok ? 'text-green' : 'text-clay'}`}>{message.text}</p>}
      <button disabled={busy} className="btn-primary w-fit">{busy ? 'Sending…' : 'Submit review'}</button>
    </form>
  );
}
