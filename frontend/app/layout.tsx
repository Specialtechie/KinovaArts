import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import countryToCurrency from 'country-to-currency';
import { Fraunces, IBM_Plex_Mono, Work_Sans } from 'next/font/google';
import './globals.css';
import { api } from '@/lib/api';
import Providers from '@/components/Providers';
import type { ExchangeRates } from '@/components/CurrencyProvider';
import Chrome from '@/components/Chrome';
import Footer from '@/components/Footer';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const work = Work_Sans({ subsets: ['latin'], variable: '--font-work', display: 'swap' });
const plex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex', display: 'swap' });

// Pages read live data from the Laravel API, so they render per request (the API calls themselves are cached).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Kinova Arts', template: '%s · Kinova Arts' },
  description: 'A curated destination for hand-made African art, furniture, and craft.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const country = requestHeaders.get('x-vercel-ip-country')?.toUpperCase() ?? '';
  const detectedCurrency = Object.prototype.hasOwnProperty.call(countryToCurrency, country)
    ? countryToCurrency[country as keyof typeof countryToCurrency]
    : 'NGN';
  const savedCurrency = cookieStore.get('ka_currency')?.value?.toUpperCase();
  const initialCurrency = savedCurrency && /^[A-Z]{3}$/.test(savedCurrency)
    ? savedCurrency
    : detectedCurrency;
  const ratesResponse = await api<ExchangeRates>('/currency-rates', { revalidate: 86400 });
  const initialRates = ratesResponse.ok ? ratesResponse.data : null;

  return (
    <html lang="en" className={`${fraunces.variable} ${work.variable} ${plex.variable}`}>
      <body>
        <Providers initialCurrency={initialCurrency} initialRates={initialRates}>
          <Chrome footer={<Footer />}>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
