'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { call } from '@/lib/client';
import { usd } from '@/lib/format';

export type ExchangeRates = {
  base: 'USD';
  rates: Record<string, number>;
  updated_at: string;
  next_update_at: string | null;
  stale: boolean;
};

type CurrencyContextValue = {
  currency: string;
  currencies: string[];
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  format: (amount: number | string | null | undefined) => string;
  selectCurrency: (currency: string) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function isExchangeRates(value: unknown): value is ExchangeRates {
  if (!value || typeof value !== 'object') return false;

  const data = value as Record<string, unknown>;
  const rates = data.rates;

  return data.base === 'USD'
    && typeof data.updated_at === 'string'
    && typeof data.stale === 'boolean'
    && !!rates
    && typeof rates === 'object'
    && typeof (rates as Record<string, unknown>).USD === 'number'
    && typeof (rates as Record<string, unknown>).NGN === 'number';
}

const locales: Record<string, string> = {
  AUD: 'en-AU',
  CAD: 'en-CA',
  EUR: 'en-IE',
  GBP: 'en-GB',
  GHS: 'en-GH',
  JPY: 'ja-JP',
  NGN: 'en-NG',
  USD: 'en-US',
};

export function CurrencyProvider({
  initialCurrency,
  initialRates,
  children,
}: {
  initialCurrency: string;
  initialRates: ExchangeRates | null;
  children: ReactNode;
}) {
  const [currency, setCurrency] = useState(
    initialRates?.rates[initialCurrency] ? initialCurrency : initialRates ? 'NGN' : initialCurrency,
  );
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(initialRates);
  const [isLoading, setIsLoading] = useState(!initialRates);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRates) return;

    let cancelled = false;

    async function loadRates() {
      try {
        const response = await call<unknown>('currency-rates');
        if (!response.ok || !isExchangeRates(response.data)) {
          throw new Error('Currency rates could not be loaded.');
        }

        if (!cancelled) {
          setExchangeRates(response.data);
          if (!response.data.rates[initialCurrency]) setCurrency('NGN');
        }
      } catch {
        if (!cancelled) setError('Currency rates are unavailable; prices are shown in USD.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadRates();

    return () => {
      cancelled = true;
    };
  }, [initialCurrency, initialRates]);

  const selectCurrency = useCallback((selected: string) => {
    if (!exchangeRates?.rates[selected]) {
      setError(`An exchange rate for ${selected} is unavailable.`);
      return;
    }

    setCurrency(selected);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `ka_currency=${selected}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setError(null);
  }, [exchangeRates]);

  const format = useCallback((amount: number | string | null | undefined) => {
    const value = Number(amount) || 0;
    const rate = exchangeRates?.rates[currency];
    if (!rate) return usd(value);

    return new Intl.NumberFormat(locales[currency] ?? 'en', {
      style: 'currency',
      currency,
    }).format(value * rate);
  }, [currency, exchangeRates]);

  const currencies = useMemo(
    () => Object.keys(exchangeRates?.rates ?? {}).sort(),
    [exchangeRates],
  );

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    currencies,
    isLoading,
    isStale: exchangeRates?.stale ?? false,
    error,
    format,
    selectCurrency,
  }), [currency, currencies, isLoading, exchangeRates, error, format, selectCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider.');
  return context;
}
