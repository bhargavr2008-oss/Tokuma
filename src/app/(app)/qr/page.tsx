'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, SectionTitle, Tag } from '@/components/ui';
import { QrThumb, publicPath, QrModal } from '@/components/qr';
import { scoreProject, band } from '@/lib/scoring';
import type { Project, Product } from '@/lib/types';

export default function QrPage() {
  const { projects } = useStore();
  const [origin, setOrigin] = useState('');
  const [sel, setSel] = useState<{ project: Project; product?: Product } | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);

  const targets = useMemo(
    () => projects.flatMap((p) => [
      { project: p, product: undefined as Product | undefined, label: p.name, kind: 'Project' },
      ...p.products.map((pr) => ({ project: p, product: pr, label: pr.name, kind: 'Product' })),
    ]),
    [projects],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">QR Codes</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--ink-secondary)]">
          One code per project and per product, each resolving to a public transparency page. Print
          onto the product, the packaging or the pilot-line label — the page updates whenever the
          underlying data does, so the printed code never goes stale.
        </p>
      </header>

      <Card>
        <SectionTitle title={`${targets.length} codes`} sub="Click any code to open the print and download panel." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {targets.map(({ project, product, label, kind }) => {
            const s = scoreProject(project).overall;
            return (
              <button
                key={`${project.id}-${product?.id ?? 'root'}`}
                onClick={() => setSel({ project, product })}
                className="glass glass-hover flex flex-col items-center p-4 text-center"
              >
                {origin && <QrThumb url={`${origin}${publicPath(project, product)}`} size={104} />}
                <div className="mt-3 line-clamp-2 text-xs font-medium">{label}</div>
                <div className="mt-2 flex gap-1.5">
                  <Tag>{kind}</Tag>
                  <Tag color={band(s).color}>{s.toFixed(0)}</Tag>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <QrModal project={sel?.project ?? null} product={sel?.product} onClose={() => setSel(null)} />
    </div>
  );
}
