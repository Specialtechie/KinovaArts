'use client';

import { useState } from 'react';
import { call, firstError } from '@/lib/client';

export default function PayDeliveryFeeButton({ orderId }: { orderId: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    const response = await call<{ authorization_url?: string }>(`account/orders/${orderId}/delivery-fee`, { method: 'POST' });

    if (response.ok && response.data?.authorization_url) {
      window.location.assign(response.data.authorization_url);
      return;
    }

    setBusy(false);
    setError(firstError(response.data));
  }

  return (
    <div>
      <button type="button" disabled={busy} onClick={pay} className="btn-primary">
        {busy ? 'Opening Paystack…' : 'Pay delivery fee'}
      </button>
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </div>
  );
}
