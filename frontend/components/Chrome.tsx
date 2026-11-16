'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';

/** The storefront header/footer wrap every page except the admin, which has its own shell. */
export default function Chrome({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/admin')) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      {footer}
    </>
  );
}
