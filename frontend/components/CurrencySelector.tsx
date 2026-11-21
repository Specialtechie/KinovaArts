'use client';

import { useId, useMemo } from 'react';
import { useCurrency } from './CurrencyProvider';

export default function CurrencySelector() {
  const { currency, currencies, isLoading, isStale, error, selectCurrency } = useCurrency();
  const currencyNames = useMemo(() => new Intl.DisplayNames(['en'], { type: 'currency' }), []);
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <label className="sr-only" htmlFor={id}>Display currency</label>
      <select
        id={id}
        aria-label="Display currency"
        value={currency}
        disabled={isLoading || currencies.length === 0}
        onChange={(event) => selectCurrency(event.target.value)}
        className="rounded-full border border-line bg-panel px-3 py-2 text-sm disabled:opacity-60"
      >
        {(currencies.length ? currencies : [currency]).map((code) => (
          <option key={code} value={code}>
            {code} — {currencyNames.of(code) ?? code}
          </option>
        ))}
      </select>
      {error && <span role="status" className="max-w-56 text-xs text-clay">{error}</span>}
      {!error && isStale && <span role="status" className="text-xs text-ink/60">Using the last available exchange rates.</span>}
    </div>
  );
}
