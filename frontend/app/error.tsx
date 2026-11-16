'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="section-title mb-3">Something went wrong</h1>
      <p className="text-ink/70">{error.message || 'We could not load this page.'}</p>
      <button onClick={reset} className="btn-primary mt-8">Try again</button>
    </div>
  );
}
