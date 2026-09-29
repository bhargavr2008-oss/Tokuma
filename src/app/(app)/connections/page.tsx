'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { CLUSTERS, CLUSTER_BY_ID } from '@/lib/data';
import { scoreProject, band } from '@/lib/scoring';
import { analyse, money } from '@/lib/finance';
import { Card, SectionTitle, Tag, Bar } from '@/components/ui';
import { CAT } from '@/lib/palette';
import type { ClusterId } from '@/lib/types';

export default function Connections() {
  const { projects } = useStore();
  const [sel, setSel] = useState<ClusterId>('mbse');

  const byCluster = useMemo(() => {
    const m = new Map<ClusterId, typeof projects>();
    CLUSTERS.forEach((c) => m.set(c.id, projects.filter((p) => p.cluster === c.id)));
    return m;
  }, [projects]);

  const size = 620;
  const c = size / 2;
  const r = 218;
  const nodes = CLUSTERS.map((cl, i) => {
    const a = (i / CLUSTERS.length) * Math.PI * 2 - Math.PI / 2;
    return { cl, x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  });
  const pos = Object.fromEntries(nodes.map((n) => [n.cl.id, n])) as Record<ClusterId, (typeof nodes)[number]>;

  const selected = CLUSTER_BY_ID[sel];
  const selProjects = byCluster.get(sel) ?? [];
  const selScore = selProjects.length
    ? selProjects.reduce((s, p) => s + scoreProject(p).overall, 0) / selProjects.length
    : 0;
  const selFin = selProjects.reduce((s, p) => s + analyse(p).npv, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Project Ecosystem</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--ink-secondary)]">
          Seven clusters, one system model. Click any node to see what it contributes, what it
          depends on, and what it is currently worth.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img"
            aria-label="Ecosystem graph of the seven project clusters connected to Tokuma at the centre">
            {/* edges between related clusters */}
            {CLUSTERS.flatMap((cl) =>
              cl.connectsTo
                .filter((t) => CLUSTERS.findIndex((x) => x.id === t) > CLUSTERS.findIndex((x) => x.id === cl.id))
                .map((t) => {
                  const a = pos[cl.id], b = pos[t];
                  const active = sel === cl.id || sel === t;
                  return (
                    <line key={`${cl.id}-${t}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={active ? CAT[0] : 'rgba(22,33,24,.14)'}
                      strokeWidth={active ? 2 : 1} />
                  );
                }))}
            {/* spokes to the hub */}
            {nodes.map((n) => (
              <line key={`hub-${n.cl.id}`} x1={c} y1={c} x2={n.x} y2={n.y}
                stroke={sel === n.cl.id ? 'rgba(63,122,50,.5)' : 'rgba(22,33,24,.10)'}
                strokeWidth={1.5} strokeDasharray="4 6" />
            ))}

            <circle cx={c} cy={c} r="54" fill="#162118" stroke="#162118" strokeWidth="2" />
            <text x={c} y={c + 1} textAnchor="middle" fill="#F4F2EA" fontSize="18"
              fontFamily="var(--font-serif), Georgia, serif">Tokuma</text>
            <text x={c} y={c + 19} textAnchor="middle" fill="rgba(244,242,234,.55)" fontSize="9"
              letterSpacing="0.14em">SHARED MODEL</text>

            {nodes.map((n, i) => {
              const ps = byCluster.get(n.cl.id) ?? [];
              const s = ps.length ? ps.reduce((a, p) => a + scoreProject(p).overall, 0) / ps.length : 0;
              const active = sel === n.cl.id;
              return (
                <g key={n.cl.id} onClick={() => setSel(n.cl.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x} cy={n.y} r={active ? 38 : 33}
                    fill={active ? 'rgba(63,122,50,.12)' : '#FFFEFB'}
                    stroke={active ? CAT[0] : CAT[i % CAT.length]} strokeWidth={active ? 2.25 : 1.5} />
                  <text x={n.x} y={n.y + 2} textAnchor="middle" fill="#162118" fontSize="16"
                    fontFamily="var(--font-serif), Georgia, serif">
                    {s ? s.toFixed(0) : '—'}
                  </text>
                  <text x={n.x} y={n.y + (n.y < c ? -50 : 58)} textAnchor="middle" fill="#162118"
                    fontSize="12.5" fontFamily="var(--font-serif), Georgia, serif">
                    {n.cl.short}
                  </text>
                  <text x={n.x} y={n.y + (n.y < c ? -36 : 72)} textAnchor="middle" fill="#7C8878"
                    fontSize="9.5" letterSpacing="0.1em">
                    {ps.length} PROJECT{ps.length === 1 ? '' : 'S'}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="mt-2 text-center text-[11px] text-[var(--ink-muted)]">
            Node number is the average circular score of that cluster&apos;s projects. Solid lines are declared dependencies.
          </p>
        </Card>

        <Card>
          <SectionTitle title={selected.short} sub={selected.purpose} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-bone-100 p-3">
                <div className="label">Cluster score</div>
                <div className="mt-1.5 text-xl font-semibold tabular-nums" style={{ color: band(selScore).color }}>
                  {selScore ? selScore.toFixed(1) : '—'}
                </div>
                <div className="mt-2"><Bar value={selScore} color={band(selScore).color} height={5} /></div>
              </div>
              <div className="rounded-xl border border-line bg-bone-100 p-3">
                <div className="label">Cluster NPV</div>
                <div className="mt-1.5 text-xl font-semibold tabular-nums" style={{ color: selFin >= 0 ? CAT[0] : '#95492A' }}>
                  {money(selFin)}
                </div>
              </div>
            </div>

            <div>
              <div className="label mb-2">Connects to</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.connectsTo.map((t) => (
                  <button key={t} onClick={() => setSel(t)} className="pill hover:border-sage-600 hover:text-sage-700">
                    {CLUSTER_BY_ID[t].short}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="label mb-2">Projects in this cluster</div>
              {selProjects.length === 0 && <p className="text-xs text-[var(--ink-muted)]">No projects assigned yet.</p>}
              <ul className="space-y-2">
                {selProjects.map((p) => {
                  const s = scoreProject(p).overall;
                  return (
                    <li key={p.id}>
                      <Link href={`/projects/${p.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-bone-100 p-3 transition hover:border-sage-600">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{p.status} · {p.products.length} product{p.products.length === 1 ? '' : 's'}</div>
                        </div>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: band(s).color }}>{s.toFixed(1)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Relationship chains"
          sub="Project → Product → Material → Waste stream → Circular strategy → Financial effect. This is the chain the score walks for every project."
        />
        <ul className="space-y-3">
          {projects.filter((p) => p.waste.manufacturingWasteKg > 0).map((p) => {
            const strategy = p.waste.reusedInternallyKg > p.waste.recycledExternallyKg ? 'Internal reuse' : 'External recycling';
            const waste = p.waste.manufacturingWasteKg + p.waste.packagingWasteKg;
            const perKg = p.financials.materialCost / Math.max(1, p.materials.quantityKg);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bone-100 p-3.5 text-xs">
                <Chain>{p.name}</Chain><Arrow />
                <Chain>{p.products[0]?.name ?? 'No product yet'}</Chain><Arrow />
                <Chain>{p.materials.primaryMaterial}</Chain><Arrow />
                <Chain>{Math.round(waste).toLocaleString()} kg scrap</Chain><Arrow />
                <Chain>{strategy}</Chain><Arrow />
                <Tag color={CAT[0]}>{money((p.waste.reusedInternallyKg + p.waste.recycledExternallyKg) * perKg)}/yr avoided</Tag>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

const Chain = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-lg border border-line bg-bone-100 px-2.5 py-1 text-[var(--ink-secondary)]">{children}</span>
);
const Arrow = () => <span className="text-[var(--ink-muted)]" aria-hidden>→</span>;
