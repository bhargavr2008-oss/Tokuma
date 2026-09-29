'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { scoreProject, band } from '@/lib/scoring';
import { analyse, money, pct } from '@/lib/finance';
import { recommendations } from '@/lib/recommend';
import { CLUSTER_BY_ID } from '@/lib/data';
import { Card, ScoreRing, SectionTitle, Tag, Bar, Modal } from '@/components/ui';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { PillarRadar, StackedBars, CashflowChart } from '@/components/charts';
import { QrModal } from '@/components/qr';
import { CAT } from '@/lib/palette';
import { QrCode, Calculator, ArrowLeft, Trash2 } from 'lucide-react';

const TABS = ['Circular', 'Materials', 'Waste', 'Lifecycle', 'Financial', 'Environmental', 'Recommendations'] as const;

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { projects, remove, hydrated } = useStore();
  const project = projects.find((p) => p.slug === slug);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Circular');
  const [showCalc, setShowCalc] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const score = useMemo(() => (project ? scoreProject(project) : null), [project]);
  const fin = useMemo(() => (project ? analyse(project) : null), [project]);
  const recs = useMemo(() => (project ? recommendations(project) : []), [project]);

  if (!hydrated) return <p className="text-sm text-[var(--ink-muted)]">Loading…</p>;
  if (!project || !score || !fin) return notFound();

  const b = band(score.overall);
  const cluster = CLUSTER_BY_ID[project.cluster];
  const wasteTotal = project.waste.manufacturingWasteKg + project.waste.packagingWasteKg;
  const diverted = project.waste.reusedInternallyKg + project.waste.recycledExternallyKg;
  const isSeed = project.id.startsWith('p-') && !/^p-[a-z0-9]{8,}$/.test(project.id);

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-sage-700">
        <ArrowLeft size={14} /> All projects
      </Link>

      <header className="glass p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Tag color={b.color}>{b.label}</Tag>
              <Tag>{project.status}</Tag>
              <Tag>{cluster.short}</Tag>
              <Tag>{project.confidence === 'measured' ? 'Measured data' : 'Estimated data'}</Tag>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-secondary)]">{project.description}</p>
            <p className="mt-3 text-[11px] text-[var(--ink-muted)]">
              {project.organization} · {project.team.join(', ') || 'No team recorded'} · updated {project.updatedAt}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => setShowCalc(true)} className="btn-primary text-xs"><Calculator size={14} /> How is this score calculated?</button>
              <button onClick={() => setShowQr(true)} className="btn-ghost text-xs"><QrCode size={14} /> Generate QR code</button>
              <Link href={`/p/${project.slug}`} target="_blank" className="btn-ghost text-xs">Public page</Link>
              {!isSeed && (
                <button
                  onClick={() => { if (confirm(`Delete "${project.name}"? This cannot be undone.`)) { remove(project.id); location.href = '/projects'; } }}
                  className="btn-ghost text-xs text-clay-600"
                ><Trash2 size={14} /> Delete</button>
              )}
            </div>
          </div>
          <div className="mx-auto shrink-0"><ScoreRing score={score.overall} /></div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Net present value" value={money(fin.npv)} sub={`${(project.financials.discountRate * 100).toFixed(0)}% discount, ${project.financials.horizonYears}-yr horizon`} accent={fin.npv >= 0 ? CAT[0] : '#95492A'} />
        <Metric label="Internal rate of return" value={pct(fin.irr, 0)} sub={fin.irr === null ? 'No positive return in horizon' : 'On circular capital deployed'} />
        <Metric label="Simple payback" value={fin.paybackYears ? `${fin.paybackYears.toFixed(1)} yrs` : 'Beyond horizon'} sub={fin.discountedPaybackYears ? `${fin.discountedPaybackYears.toFixed(1)} yrs discounted` : 'Discounted: beyond horizon'} />
        <Metric label="Waste diverted" value={`${Math.round(diverted).toLocaleString()} kg`} sub={wasteTotal ? `${((diverted / wasteTotal) * 100).toFixed(0)}% diversion rate` : 'No physical waste stream'} />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition ${
              tab === t ? 'bg-sage-500/15 text-sage-700 ring-1 ring-sage-600/30' : 'text-[var(--ink-secondary)] hover:bg-bone-100'
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === 'Circular' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle title="Pillar profile" sub="Each axis is a pillar score out of 100, before its weight is applied." />
            <PillarRadar data={score.pillars.map((p) => ({ label: p.label.split(' ')[0], score: p.score }))} />
          </Card>
          <Card>
            <SectionTitle title="Contribution to the overall score" />
            <ul className="space-y-3">
              {score.pillars.map((p) => (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[var(--ink-secondary)]">{p.label}</span>
                    <span className="tabular-nums">{p.score.toFixed(1)} × {(p.weight * 100).toFixed(0)}% = <b>{p.contribution.toFixed(1)}</b></span>
                  </div>
                  <div className="mt-1.5"><Bar value={p.score} color={band(p.score).color} height={5} /></div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'Materials' && (
        <Card>
          <SectionTitle title="Material composition" sub={`Primary material: ${project.materials.primaryMaterial} · ${project.materials.quantityKg.toLocaleString()} kg/yr`} />
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['Recycled content', project.materials.recycledPct],
              ['Renewable content', project.materials.renewablePct],
              ['Bio-based content', project.materials.bioBasedPct],
              ['Reusable content', project.materials.reusablePct],
              ['Recyclable content', project.materials.recyclablePct],
            ] as const).map(([label, v]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[var(--ink-secondary)]">{label}</span>
                  <span className="tabular-nums">{v}%</span>
                </div>
                <div className="mt-1.5"><Bar value={v} color={CAT[0]} height={6} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Waste' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle title="Waste destination" sub={`${Math.round(wasteTotal).toLocaleString()} kg/yr total, against ${project.waste.totalInputKg.toLocaleString()} kg of input.`} />
            {wasteTotal > 0 ? (
              <StackedBars
                data={[{
                  label: 'Annual waste',
                  Reused: Math.round(project.waste.reusedInternallyKg),
                  Recycled: Math.round(project.waste.recycledExternallyKg),
                  Landfill: Math.round(project.waste.landfillKg),
                }]}
                series={[{ key: 'Reused', name: 'Reused internally' }, { key: 'Recycled', name: 'Recycled externally' }, { key: 'Landfill', name: 'Landfill' }]}
                fmt={(v) => `${v.toLocaleString()} kg`}
                layout="vertical" height={160}
              />
            ) : <p className="py-8 text-center text-sm text-[var(--ink-muted)]">No physical waste stream for this project.</p>}
          </Card>
          <Card>
            <SectionTitle title="Waste detail" />
            <Rows rows={[
              ['Manufacturing waste', `${Math.round(project.waste.manufacturingWasteKg).toLocaleString()} kg`],
              ['Packaging waste', `${Math.round(project.waste.packagingWasteKg).toLocaleString()} kg`],
              ['Hazardous waste', `${Math.round(project.waste.hazardousKg).toLocaleString()} kg`],
              ['Diverted from landfill', `${Math.round(diverted).toLocaleString()} kg`],
              ['Waste intensity', wasteTotal ? `${((wasteTotal / project.waste.totalInputKg) * 100).toFixed(1)}% of input` : '—'],
            ]} />
          </Card>
        </div>
      )}

      {tab === 'Lifecycle' && (
        <Card>
          <SectionTitle title="Lifecycle and recovery" sub="Design attributes that determine how many times this product can come back." />
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['Repairability', project.lifecycle.repairability],
              ['Modularity', project.lifecycle.modularity],
              ['Reusability', project.lifecycle.reusability],
              ['Remanufacturability', project.lifecycle.remanufacturability],
              ['End-of-life recovery rate', project.lifecycle.recoveryRatePct],
            ] as const).map(([label, v]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-[var(--ink-secondary)]">{label}</span>
                  <span className="tabular-nums">{v}</span>
                </div>
                <div className="mt-1.5"><Bar value={v} color={band(v).color} height={6} /></div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <Rows rows={[
              ['Expected service life', `${project.lifecycle.expectedLifeYears} years`],
              ['Take-back programme', project.lifecycle.takeBackProgram ? 'Active' : 'None'],
            ]} />
          </div>
        </Card>
      )}

      {tab === 'Financial' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle title="Cumulative cash position" sub="Break-even is the first bar above the zero line." />
            <CashflowChart flows={fin.flows} />
          </Card>
          <Card>
            <SectionTitle title="Investment case" />
            <Rows rows={[
              ['Circular investment required', money(fin.investment)],
              ['Annual circular benefit', money(fin.annualBenefit)],
              [`Total benefit over ${project.financials.horizonYears} years`, money(fin.totalBenefit)],
              ['Net present value', money(fin.npv)],
              ['Internal rate of return', pct(fin.irr, 1)],
              ['Return on investment', `${fin.roi.toFixed(0)}%`],
              ['Profitability index', fin.profitabilityIndex.toFixed(2)],
              ['Benefit–cost ratio', fin.benefitCostRatio.toFixed(2)],
              ['Simple payback', fin.paybackYears ? `${fin.paybackYears.toFixed(1)} years` : 'Beyond horizon'],
              ['Discounted payback', fin.discountedPaybackYears ? `${fin.discountedPaybackYears.toFixed(1)} years` : 'Beyond horizon'],
              ['Discount rate applied', `${(project.financials.discountRate * 100).toFixed(1)}%`],
            ]} />
            <Link href="/financial" className="btn-ghost mt-4 w-full text-xs">Open scenario modelling</Link>
          </Card>
        </div>
      )}

      {tab === 'Environmental' && (
        <Card>
          <SectionTitle title="Environmental performance" />
          <Rows rows={[
            ['Carbon footprint', `${project.environmental.carbonFootprintTco2e.toFixed(0)} tCO₂e/yr`],
            ['Carbon reduction achieved', `${project.environmental.carbonReductionTco2e.toFixed(0)} tCO₂e/yr`],
            ['Water usage', `${Math.round(project.environmental.waterUsageM3).toLocaleString()} m³/yr`],
            ['Water savings', `${Math.round(project.environmental.waterSavingsM3).toLocaleString()} m³/yr`],
            ['Energy usage', `${Math.round(project.environmental.energyUsageMwh).toLocaleString()} MWh/yr`],
            ['Energy savings', `${Math.round(project.environmental.energySavingsMwh).toLocaleString()} MWh/yr`],
            ['Renewable energy share', `${project.environmental.renewableEnergyPct}%`],
          ]} />
        </Card>
      )}

      {tab === 'Recommendations' && (
        <div className="grid gap-4 md:grid-cols-2">
          {recs.length === 0 && <Card><p className="text-sm text-[var(--ink-muted)]">No material improvements detected — this project is already near the top of every pillar.</p></Card>}
          {recs.map((r) => (
            <Card key={r.title}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{r.title}</h3>
                <span className="shrink-0 rounded-lg bg-sage-500/15 px-2 py-1 text-xs font-semibold text-sage-700">+{r.scoreGain.toFixed(1)} pts</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-secondary)]">{r.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag>{r.pillar}</Tag>
                <Tag>{r.strategy}</Tag>
                <Tag color={r.priority === 'Critical' ? '#95492A' : r.priority === 'High' ? '#C2811A' : undefined}>{r.priority}</Tag>
                <Tag>{r.difficulty} effort</Tag>
                {r.financialImpact !== 0 && <Tag color={r.financialImpact > 0 ? CAT[0] : '#C2811A'}>{money(r.financialImpact)}/yr</Tag>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCalc} onClose={() => setShowCalc(false)} title={`Score calculation — ${project.name}`} wide>
        <ScoreBreakdown project={project} />
      </Modal>
      <QrModal project={showQr ? project : null} onClose={() => setShowQr(false)} />
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="glass p-4">
      <div className="label">{label}</div>
      <div className="mt-2 text-xl font-semibold tabular-nums" style={{ color: accent }}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-[var(--ink-muted)]">{sub}</div>}
    </div>
  );
}

function Rows({ rows }: { rows: (readonly [string, string])[] }) {
  return (
    <dl className="divide-y divide-line text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-[var(--ink-secondary)]">{k}</dt>
          <dd className="shrink-0 tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
