'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export default function ProductFilters({
  categories,
  current,
}: {
  categories: any[];
  current: { q?: string; category?: string; sort?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(current.q || '');
  const [category, setCategory] = useState(current.category || '');
  const [sort, setSort] = useState(current.sort || '');

  function go(next: { q?: string; category?: string; sort?: string }) {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.category) params.set('category', next.category);
    if (next.sort) params.set('sort', next.sort);
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    go({ q, category, sort });
  }

  return (
    <form onSubmit={submit} className="mb-8 grid gap-3 md:grid-cols-[1fr_200px_200px_auto]">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pieces, materials, origins…" className="field-input" />
      <select
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          go({ q, category: e.target.value, sort });
        }}
        className="field-input"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => {
          setSort(e.target.value);
          go({ q, category, sort: e.target.value });
        }}
        className="field-input"
      >
        <option value="">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
      <button className="btn-primary">Search</button>
    </form>
  );
}
