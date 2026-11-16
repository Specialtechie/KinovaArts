'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { call } from '@/lib/client';
import DeleteButton from './DeleteButton';

export default function ReviewActions({ id, approved }: { id: number; approved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    await call(`admin/reviews/${id}/approve`, { method: 'POST' });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      {!approved && (
        <button type="button" onClick={approve} disabled={busy} className="font-semibold text-green underline disabled:opacity-50">Approve</button>
      )}
      <DeleteButton path={`admin/reviews/${id}`} confirmText="Delete this review?" />
    </div>
  );
}
