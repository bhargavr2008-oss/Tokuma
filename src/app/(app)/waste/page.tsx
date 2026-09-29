'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { insights } from '@/lib/intelligence';
import { portfolio } from '@/lib/portfolio';
import { money } from '@/lib/finance';
import { Card, SectionTitle, Stat, Tag } from '@/components/ui';
import { StackedBars, RankedBars } from '@/components/charts';
import { Sparkles } from 'lucide-react';

export default function Waste() {
  const { projects } = useStore();
  const ai = useMemo(() => insights(projects), [projects]);
  const p = useMemo(() => portfolio(projects), [projects]);
  const physical = projects.filter((pr) => pr.waste.manufacturingWasteKg > 0);

  const byDestination = physical.map((pr) => ({
    label: pr.name.length > 22 ? `${pr.name.slice(0, 20)}…` : pr.name,
    Reused: Math.round(pr.waste.reusedInternallyKg),
    Recycled: Math.round(pr.waste.recycledExternallyKg),
    Landfill: Math.round(pr.waste.landfillKg),
  }));

  const intensity = physical.map((pr) => ({
    label: pr.name.length > 24 ? `${pr.name.slice(0, 22)}…` : pr.name,
    value: Math.round(((pr.waste.manufacturingWasteKg + pr.waste.packagingWasteKg) / pr.waste.totalInputKg) * 1000) / 10,
  })).sort((a, b) => b.value - a.value);

  // Value at stake: every landfilled kilo is a disposal fee plus a replacement purchase.
  const recoverable = physical.reduce((s, pr) => {
    const waste = pr.waste.manufacturingWasteKg + pr.waste.packagingWasteKg;
    const perKgDisposal = pr.financials.wasteDisposalCost / Math.max(1, waste);
    const perKgMaterial = pr.financials.materialCost / Math.max(1, pr.materials.quantityKg);
    return s + pr.waste.landfillKg * (perKgDisposal + perKgMaterial);
  }, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Waste Intelligence</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--ink-secondary)]">
          Pattern detection across every waste stream in the portfolio. Each finding below is a pure
          function of the recorded data — the same contract a trained model will publish into, which
          is why the rules can be replaced one at a time without the page changing.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total waste generated" value={Math.round(p.wasteTotalKg)} suffix=" kg/yr" />
        <Stat label="Diverted from landfill" value={Math.round(p.wasteDivertedKg)} suffix=" kg/yr" sub={`${p.diversionRate.toFixed(0)}% diversion rate`} />
        <Stat label="Still landfilled" value={Math.round(p.landfillKg)} suffix=" kg/yr" accent="#95492A" />
        <Stat label="Value at stake in that stream" value={recoverable} prefix="$" sub="Disposal fee + replacement material" accent="#C2811A" />
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-sage-700" />
          <h2 className="text-lg font-semibold tracking-tight">Detected patterns</h2>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {ai.map((i) => (
            <li key={i.title} className="rounded-xl border border-line bg-bone-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium">{i.title}</h3>
                <Tag color={i.severityColor}>{i.severity}</Tag>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-secondary)]">{i.detail}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Destination by project" sub="Annual tonnage split across reuse, recycling and landfill." />
          {byDestination.length ? (
            <StackedBars
              data={byDestination}
              series={[{ key: 'Reused', name: 'Reused internally' }, { key: 'Recycled', name: 'Recycled externally' }, { key: 'Landfill', name: 'Landfill' }]}
              fmt={(v) => `${v.toLocaleString()} kg`} layout="vertical" height={300}
            />
          ) : <p className="py-10 text-center text-sm text-[var(--ink-muted)]">No physical waste streams recorded.</p>}
        </Card>

        <Card>
          <SectionTitle title="Waste intensity" sub="Waste as a percentage of material input. A yield problem shows up here before it shows up on the disposal invoice." />
          {intensity.length ? (
            <RankedBars data={intensity} fmt={(v) => `${v}% of input`} height={300} color="#C2811A" tickFormatter={(v) => `${v}%`} />
          ) : <p className="py-10 text-center text-sm text-[var(--ink-muted)]">No physical waste streams recorded.</p>}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Roadmap: from rules to models" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {[
            ['Anomaly detection', 'Flags a stream that departs from its own history, not just from the portfolio mean.'],
            ['Waste forecasting', 'Projects next-quarter tonnage from production plan and seasonality.'],
            ['Material classification', 'Maps free-text material descriptions onto a canonical recovery route.'],
            ['Cost prediction', 'Learns the site-specific $/kg of disposal and recovered-material price.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-bone-100 p-4">
              <div className="text-sm font-medium text-[var(--ink-primary)]">{t}</div>
              <p className="mt-1.5 leading-relaxed text-[var(--ink-muted)]">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-[var(--ink-muted)]">
          The engine boundary is <code className="text-[var(--ink-secondary)]">insights(projects) → Insight[]</code>.
          A Python service can serve that array over HTTP without a single change on this page.
        </p>
      </Card>

      <Link href="/projects" className="btn-ghost w-full">Review the projects behind these findings</Link>
    </div>
  );
}
