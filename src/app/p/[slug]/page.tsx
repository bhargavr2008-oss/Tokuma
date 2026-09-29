'use client';

import { notFound, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { PublicView } from '@/components/public-view';

export default function PublicProject() {
  const { slug } = useParams<{ slug: string }>();
  const { projects, hydrated } = useStore();
  if (!hydrated) return <p className="p-10 text-center text-sm text-[var(--ink-muted)]">Loading…</p>;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return notFound();
  return <PublicView project={project} />;
}
