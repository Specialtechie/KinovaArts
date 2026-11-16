'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { firstError } from '@/lib/client';
import { useAuth } from './store';

export default function AuthModal() {
  const { modal, closeAuth, setTab, setUser } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modal.open) return;
    setError(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuth();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.open, modal.tab, closeAuth]);

  if (!modal.open) return null;

  const signin = modal.tab === 'signin';

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch(signin ? '/api/auth/login' : '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);

    if (!res || !res.ok) {
      setError(firstError(data));
      return;
    }

    setUser(data.user);
    closeAuth();

    // Only follow same-site relative paths.
    if (modal.next && modal.next.startsWith('/') && !modal.next.startsWith('//')) {
      window.location.assign(modal.next);
    } else {
      router.refresh();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAuth();
      }}
    >
      <div className="w-full max-w-md rounded-md bg-panel p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={() => setTab('signin')} className={`pill ${signin ? 'pill-active' : 'border-transparent'}`}>
              Sign in
            </button>
            <button type="button" onClick={() => setTab('signup')} className={`pill ${!signin ? 'pill-active' : 'border-transparent'}`}>
              Sign up
            </button>
          </div>
          <button type="button" onClick={closeAuth} aria-label="Close" className="p-1 text-ink/50 hover:text-ink">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form key={modal.tab} onSubmit={submit} className="mt-5 flex flex-col gap-3">
          {!signin && (
            <div>
              <label className="field-label">Full name</label>
              <input name="name" required autoComplete="name" className="field-input" />
            </div>
          )}
          <div>
            <label className="field-label">Email</label>
            <input name="email" type="email" required autoComplete="email" className="field-input" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input name="password" type="password" required minLength={signin ? undefined : 8} autoComplete={signin ? 'current-password' : 'new-password'} className="field-input" />
          </div>
          {!signin && (
            <div>
              <label className="field-label">Confirm password</label>
              <input name="password_confirmation" type="password" required autoComplete="new-password" className="field-input" />
            </div>
          )}

          {error && <div className="rounded-md border border-clay bg-clay/10 p-3 text-sm text-clay">{error}</div>}

          <button disabled={busy} className="btn-primary">
            {busy ? 'Please wait…' : signin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/70">
          {signin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => setTab(signin ? 'signup' : 'signin')} className="font-semibold underline">
            {signin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
