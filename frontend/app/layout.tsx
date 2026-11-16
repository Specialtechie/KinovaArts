import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Mono, Work_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${work.variable} ${plex.variable}`}>
      <body>
        <Providers>
          <Chrome footer={<Footer />}>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
