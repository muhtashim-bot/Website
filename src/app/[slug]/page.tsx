import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { allPages, pageBySlug } from '@/content/offerings';
import { OfferingPage } from '@/components/OfferingPage';

export const dynamicParams = false;

export function generateStaticParams() {
  return allPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = pageBySlug(slug);
  if (!page) return {};
  return { title: page.seo.title, description: page.seo.description, alternates: { canonical: `/${slug}/` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pageBySlug(slug);
  if (!page) notFound();
  return <OfferingPage page={page} />;
}
