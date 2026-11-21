import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { api, catalog } from '@/lib/api';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await api(`/pages/${slug}`, { revalidate: 60 });
  return { title: r.ok ? r.data.title : 'Page' };
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await catalog(`/pages/${slug}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <h1 className="section-title mb-6">{page.title}</h1>
      {/* Page content is plain text: line breaks are kept, markup is never executed. */}
      <div className="whitespace-pre-line leading-relaxed text-ink/80">{page.content}</div>
      {slug === 'contact' && <ContactForm />}
    </div>
  );
}
