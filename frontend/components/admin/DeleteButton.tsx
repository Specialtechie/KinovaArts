'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { call, firstError } from '@/lib/client';

export default function DeleteButton({
  path,
  label = 'Delete',
  confirmText = 'Are you sure?',
  redirectTo,
  className = 'text-sm text-clay underline disabled:opacity-50',
}: {
  path: string;
  label?: string;
  confirmText?: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    const r = await call(path, { method: 'DELETE' });
    setBusy(false);

    if (!r.ok) {
      setError(firstError(r.data));
      return;
    }
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  return (
    <span>
      <button type="button" onClick={go} disabled={busy} className={className}>
        {busy ? 'Working…' : label}
      </button>
      {error && <span className="ml-2 text-xs text-clay">{error}</span>}
    </span>
  );
}
