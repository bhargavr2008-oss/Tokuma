'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { scoreProject } from '@/lib/scoring';
import { analyse } from '@/lib/finance';
import { CLUSTERS } from '@/lib/data';
import { ProjectCard } from '@/components/project-card';
import { QrModal } from '@/components/qr';
import type { Project } from '@/lib/types';
import { Search } from 'lucide-react';

type Sort = 'score' | 'name' | 'npv' | 'waste';

export default function Projects() {
  const { projects } = useStore();
  const [q, setQ] = useState('');
  const [cluster, setCluster] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<Sort>('score');
  const [qr, setQr] = useState<Project | null>(null);

  const statuses = useMemo(() => [...new Set(projects.map((p) => p.status))], [projects]);

  const list = useMemo(() => {
    const filtered = projects.filter((p) =>
      (cluster === 'all' || p.cluster === cluster) &&
      (status === 'all' || p.status === status) &&
      (q === '' || `${p.name} ${p.description} ${p.category} ${p.organization}`.toLowerCase().includes(q.toLowerCase())));
    const key = {
      score: (p: Project) => -scoreProject(p).overall,
      name: (p: Project) => p.name,
      npv: (p: Project) => -analyse(p).npv,
      waste: (p: Project) => -(p.waste.manufacturingWasteKg + p.waste.packagingWasteKg),
    }[sort];
    return [...filtered].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  }, [projects, q, cluster, status, sort]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">{list.length} of {projects.length} projects</p>
        </div>
        <Link href="/add" className="btn-primary">Add / Import Project</Link>
      </header>

      <div className="glass flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            className="field pl-9" placeholder="Search projects…" value={q}
            onChange={(e) => setQ(e.target.value)} aria-label="Search projects"
          />
        </div>
        <select className="field w-auto" value={cluster} onChange={(e) => setCluster(e.target.value)} aria-label="Filter by cluster">
          <option value="all">All clusters</option>
          {CLUSTERS.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}
        </select>
        <select className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="field w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort projects">
          <option value="score">Sort: score</option>
          <option value="npv">Sort: NPV</option>
          <option value="waste">Sort: waste volume</option>
          <option value="name">Sort: name</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p className="glass p-12 text-center text-sm text-[var(--ink-muted)]">No projects match those filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <ProjectCard key={p.id} project={p} onQr={setQr} />)}
        </div>
      )}

      <QrModal project={qr} onClose={() => setQr(null)} />
    </div>
  );
}
