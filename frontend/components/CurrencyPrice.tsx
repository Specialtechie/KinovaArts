'use client';

import { useCurrency } from './CurrencyProvider';

export default function CurrencyPrice({
  amount,
  className,
}: {
  amount: number | string | null | undefined;
  className?: string;
}) {
  const { format } = useCurrency();

  return <span className={className}>{format(amount)}</span>;
}
