'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { portfolio, modelledHistory } from '@/lib/portfolio';
import { scoreProject, band, PILLARS } from '@/lib/scoring';
import { analyse, money } from '@/lib/finance';
import { recommendations } from '@/lib/recommend';
import { insights } from '@/lib/intelligence';
import { Card, ScoreRing, SectionTitle, Stat, Tag, Bar } from '@/components/ui';
import { TrendChart, AreaTrend, StackedBars, RankedBars, PillarRadar } from '@/components/charts';
import { CAT } from '@/lib/palette';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { projects } = useStore();
  const p = useMemo(() => portfolio(projects), [projects]);
  const history = useMemo(() => modelledHistory(projects), [projects]);
  const recs = useMemo(
    () => projects.flatMap((pr) => recommendations(pr).slice(0, 2).map((r) => ({ ...r, project: pr })))
      .sort((a, b) => b.scoreGain - a.scoreGain).slice(0, 5),
    [projects],
  );
  const ai = useMemo(() => insights(projects), [projects]);

  const ranked = useMemo(
    () => projects.map((pr) => ({ project: pr, score: scoreProject(pr).overall }))
      .sort((a, b) => b.score - a.score),
    [projects],
  );

  const pillarAvg = useMemo(() => PILLARS.map((def) => {
    const avg = projects.reduce((s, pr) => s + scoreProject(pr).pillars.find((x) => x.id === def.id)!.score, 0) /
      Math.max(1, projects.length);
    return { label: def.label.replace(/ (Circularity|Management|Performance|Recovery)$/, ''), score: Math.round(avg * 10) / 10 };
  }), [projects]);

  const wasteByProject = useMemo(
    () => projects.filter((pr) => pr.waste.manufacturingWasteKg > 0).map((pr) => ({
      label: pr.name.length > 22 ? `${pr.name.slice(0, 20)}…` : pr.name,
      Reused: Math.round(pr.waste.reusedInternallyKg),
      Recycled: Math.round(pr.waste.recycledExternallyKg),
      Landfill: Math.round(pr.waste.landfillKg),
    })),
    [projects],
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio Overview</h1>
          <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
            {p.projects} projects · {p.products} products · methodology v1.0
          </p>
        </div>
        <Link href="/add" className="btn-primary">Add / Import Project</Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Average Circular Score" value={p.avgScore} decimals={1} suffix=" / 100" accent={band(p.avgScore).color} sub={band(p.avgScore).label} />
        <Stat label="Waste Diverted" value={Math.round(p.wasteDivertedKg)} suffix=" kg/yr" sub={`${p.diversionRate.toFixed(0)}% diversion rate`} />
        <Stat label="Annual Cost Savings" value={p.costSavings} prefix="$" sub={`+ ${money(p.revenueOpportunity)} recovered-material revenue`} />
        <Stat label="Portfolio NPV" value={p.npv} prefix="$" sub={`on ${money(p.investment)} of circular capital`} accent={p.npv >= 0 ? CAT[0] : '#95492A'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col items-center justify-center">
          <ScoreRing score={p.avgScore} />
          <p className="mt-5 text-center text-xs leading-relaxed text-[var(--ink-muted)]">
            Weighted mean of {p.projects} project scores. Each is the sum of six pillar
            contributions — open any project to see every input that produced it.
          </p>
          <Link href="/score" className="btn-ghost mt-4 w-full">How is this calculated?</Link>
        </Card>

        <Card>
          <SectionTitle
            title="Score and diversion trend"
            sub="Modelled 12-month history reconstructed from the current measured state — replaced by observations as each reporting period closes."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="label mb-1">Circular score (0–100)</div>
              <TrendChart data={history} series={[{ key: 'score', name: 'Circular score' }]} height={200} />
            </div>
            <div>
              <div className="label mb-1">Waste diverted (kg / month)</div>
              <AreaTrend data={history} dataKey="diverted" name="Waste diverted" fmt={(v) => `${Math.round(v).toLocaleString()} kg`} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Where the waste goes" sub="Annual tonnage by destination, per project. A long landfill segment is money leaving the site twice — once as a disposal fee, once as replacement material." />
          {wasteByProject.length ? (
            <StackedBars
              data={wasteByProject}
              series={[{ key: 'Reused', name: 'Reused internally' }, { key: 'Recycled', name: 'Recycled externally' }, { key: 'Landfill', name: 'Landfill' }]}
              fmt={(v) => `${v.toLocaleString()} kg`}
              layout="vertical"
              height={280}
            />
          ) : <Empty />}
        </Card>

        <Card>
          <SectionTitle title="Pillar profile" sub="Portfolio average across the six weighted pillars. The dents are where the headroom is." />
          <PillarRadar data={pillarAvg} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Financial savings by project" sub="Annual reuse, recycling and recovered-material benefit." />
          <RankedBars
            data={projects.map((pr) => ({
              label: pr.name.length > 24 ? `${pr.name.slice(0, 22)}…` : pr.name,
              value: Math.round(analyse(pr).annualBenefit),
            })).sort((a, b) => b.value - a.value)}
            fmt={(v) => money(v)}
            height={280}
            tickFormatter={money}
          />
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-sage-700" />
            <h2 className="text-lg font-semibold tracking-tight">Waste Pattern Insights</h2>
          </div>
          <ul className="space-y-3">
            {ai.slice(0, 5).map((i) => (
              <li key={i.title} className="rounded-xl border border-line bg-bone-100 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium">{i.title}</span>
                  <Tag color={i.severityColor}>{i.severity}</Tag>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-secondary)]">{i.detail}</p>
              </li>
            ))}
          </ul>
          <Link href="/waste" className="btn-ghost mt-4 w-full">Open Waste Intelligence <ArrowRight size={15} /></Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <SectionTitle title="Active projects" sub="Ranked by circular economy score." right={<Link href="/projects" className="text-xs text-sage-700 hover:underline">View all</Link>} />
          <ul className="divide-y divide-line">
            {ranked.map(({ project, score }) => (
              <li key={project.id}>
                <Link href={`/projects/${project.slug}`} className="flex items-center gap-4 py-3 transition hover:opacity-80">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{project.name}</div>
                    <div className="mt-1 text-[11px] text-[var(--ink-muted)]">{project.category} · {project.status}</div>
                  </div>
                  <div className="hidden w-32 sm:block"><Bar value={score} color={band(score).color} /></div>
                  <div className="w-14 text-right text-sm font-semibold tabular-nums" style={{ color: band(score).color }}>
                    {score.toFixed(1)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle title="Top recommendations" sub="Ranked by the score gain the engine measures when the change is applied." />
          <ul className="space-y-3">
            {recs.map((r, i) => (
              <li key={i} className="rounded-xl border border-line bg-bone-100 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium">{r.title}</span>
                  <span className="shrink-0 text-xs font-semibold text-sage-700">+{r.scoreGain.toFixed(1)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag>{r.project.name}</Tag>
                  <Tag>{r.difficulty} effort</Tag>
                  {r.financialImpact !== 0 && <Tag color={r.financialImpact > 0 ? CAT[0] : '#C2811A'}>{money(r.financialImpact)}/yr</Tag>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Empty() {
  return <p className="py-10 text-center text-sm text-[var(--ink-muted)]">No waste data recorded yet.</p>;
}
