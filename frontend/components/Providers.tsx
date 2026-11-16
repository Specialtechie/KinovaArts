'use client';

import { Suspense, useEffect, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, CartProvider, useAuth } from './store';
import AuthModal from './AuthModal';

/** Server pages redirect signed-out visitors to /?signin=1&next=...; this opens the popup for them. */
function AuthQueryOpener() {
  const sp = useSearchParams();
  const { openAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (sp.get('signin') === '1') {
      openAuth('signin', sp.get('next'));
      router.replace(pathname);
    }
  }, [sp, openAuth, router, pathname]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Suspense fallback={null}>
          <AuthQueryOpener />
        </Suspense>
        <AuthModal />
      </CartProvider>
    </AuthProvider>
  );
}
