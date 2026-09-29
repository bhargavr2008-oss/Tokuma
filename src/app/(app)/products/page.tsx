'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { scoreProject, band } from '@/lib/scoring';
import { Card, Tag, Bar } from '@/components/ui';
import { QrModal } from '@/components/qr';
import type { Project, Product } from '@/lib/types';
import { QrCode, Search } from 'lucide-react';

export default function Products() {
  const { projects } = useStore();
  const [q, setQ] = useState('');
  const [qr, setQr] = useState<{ project: Project; product: Product } | null>(null);

  const rows = useMemo(
    () => projects.flatMap((p) => p.products.map((pr) => ({ project: p, product: pr })))
      .filter(({ project, product }) =>
        q === '' || `${product.name} ${product.description} ${project.name}`.toLowerCase().includes(q.toLowerCase())),
    [projects, q],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--ink-secondary)]">
          Every physical thing the portfolio produces, and the project that manages it. Each carries
          its own QR code and public transparency page.
        </p>
      </header>

      <div className="glass p-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input className="field pl-9" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="glass p-12 text-center text-sm text-[var(--ink-muted)]">
          No products match. Products are added on a project — open a project to attach one.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ project, product }) => {
            const s = scoreProject(project).overall;
            const b = band(s);
            return (
              <Card key={product.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold">{product.name}</h3>
                    <Link href={`/projects/${project.slug}`} className="mt-1 block truncate text-[11px] text-[var(--ink-muted)] hover:text-sage-700">
                      from {project.name}
                    </Link>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-semibold tabular-nums" style={{ color: b.color }}>{s.toFixed(1)}</div>
                    <div className="text-[10px] text-[var(--ink-muted)]">/ 100</div>
                  </div>
                </div>
                <div className="mt-3"><Bar value={s} color={b.color} /></div>
                <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-[var(--ink-secondary)]">{product.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Tag color={b.color}>{b.label}</Tag>
                  <Tag>{project.materials.primaryMaterial}</Tag>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/p/${project.slug}/${product.slug}`} target="_blank" className="btn-primary flex-1 text-xs">Public page</Link>
                  <button onClick={() => setQr({ project, product })} className="btn-ghost px-3 text-xs" aria-label={`QR code for ${product.name}`}>
                    <QrCode size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <QrModal project={qr?.project ?? null} product={qr?.product} onClose={() => setQr(null)} />
    </div>
  );
}
