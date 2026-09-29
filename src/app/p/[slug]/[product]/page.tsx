'use client';

import { notFound, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { PublicView } from '@/components/public-view';

export default function PublicProduct() {
  const { slug, product: productSlug } = useParams<{ slug: string; product: string }>();
  const { projects, hydrated } = useStore();
  if (!hydrated) return <p className="p-10 text-center text-sm text-[var(--ink-muted)]">Loading…</p>;
  const project = projects.find((p) => p.slug === slug);
  const product = project?.products.find((pr) => pr.slug === productSlug);
  if (!project || !product) return notFound();
  return <PublicView project={project} product={product} />;
}
