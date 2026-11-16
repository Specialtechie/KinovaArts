export const usd = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

export const ngn = (n: number | string | null | undefined) =>
  '₦' + new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(Number(n) || 0);

export const mainImage = (p: any): string | null =>
  p?.featured_image?.url || p?.images?.[0]?.url || null;

export const dateLabel = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const one = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;
