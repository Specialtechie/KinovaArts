import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CustomOrderPayForm from '@/components/CustomOrderPayForm';
import { usd } from '@/lib/format';
import { authed, requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Pay for your custom order' };

export default async function PayPage({ params }: { params: Promise<{ id: string; type: string }> }) {
  const { id, type } = await params;
  const path = `/account/custom-orders/${id}/pay/${type}`;

  const user = await requireUser(path);
  const r = await authed(`/account/custom-orders/${id}`, path);

  // Only the payment that is actually due can be started (the API enforces this too).
  if (r.next_payment !== type) redirect(`/account/custom-orders/${id}`);

  const amount = type === 'deposit' ? r.deposit_amount : type === 'balance' ? r.balance_amount : r.quoted_price;
  const label = type === 'deposit' ? 'Deposit' : type === 'balance' ? 'Balance' : 'Total';

  return (
    <div className="mx-auto max-w-lg px-6 py-14 md:px-10">
      <h1 className="section-title mb-2">Complete your custom order</h1>
      <p className="mb-8 text-sm text-ink/60">
        {label} amount: <strong>{usd(amount)}</strong>. You&apos;ll be redirected to Paystack to complete payment securely.
      </p>
      <CustomOrderPayForm id={r.id} type={type} defaultName={user.name} />
    </div>
  );
}
