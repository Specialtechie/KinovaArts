'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { call, firstError } from '@/lib/client';
import { Card, Field } from './ui';

export default function SettingsForm({ rate }: { rate: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(rate));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await call('admin/settings', { body: { usd_to_ngn_rate: value } });
    setBusy(false);

    if (r.ok) {
      setMsg({ ok: true, text: 'Exchange rate updated.' });
      router.refresh();
    } else {
      setMsg({ ok: false, text: firstError(r.data) });
    }
  }

  return (
    <Card title="Exchange rate">
      <p className="mb-4 max-w-md text-sm text-ink/60">
        Live rates update daily for customer prices and NGN checkout. This saved rate is used only if live rates are unavailable and no cached rate exists.
      </p>
      <form onSubmit={submit} className="flex max-w-sm flex-col gap-3">
        <Field label="Fallback: 1 USD = ? NGN">
          <input type="number" step="0.01" min="1" required value={value} onChange={(e) => setValue(e.target.value)} className="field-input" />
        </Field>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green' : 'text-clay'}`}>{msg.text}</p>}
        <button disabled={busy} className="btn-primary w-fit">{busy ? 'Saving…' : 'Save rate'}</button>
      </form>
    </Card>
  );
}
