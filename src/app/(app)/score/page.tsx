'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { PILLARS, BANDS, scoreProject } from '@/lib/scoring';
import { Card, SectionTitle, ScoreRing, Bar } from '@/components/ui';
import { ScoreBreakdown } from '@/components/score-breakdown';
import { StackedBars } from '@/components/charts';
import { band } from '@/lib/scoring';

export default function ScorePage() {
  const { projects } = useStore();
  const [sel, setSel] = useState(0);
  const project = projects[Math.min(sel, projects.length - 1)];
  const score = useMemo(() => (project ? scoreProject(project) : null), [project]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Circular Economy Score</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--ink-secondary)]">
          One number out of 100, built from six weighted pillars. Nothing about it is hidden: pick a
          project and every input, weight and multiplication that produced its score is listed below.
        </p>
      </header>

      <Card>
        <SectionTitle title="The formula" sub="Weights are configuration values. Changing one here changes every score in the platform." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.id} className="rounded-xl border border-line bg-bone-100 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{p.label}</span>
                <span className="text-sm font-semibold text-sage-700">{(p.weight * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-2.5"><Bar value={p.weight * 100 * 5} color="#00a657" height={5} /></div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">{PILLAR_NOTES[p.id]}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-line bg-bone-100 px-4 py-3 text-xs text-[var(--ink-secondary)]">
          Score = Σ (pillar score × pillar weight) — the six weights sum to 1.00, so the maximum
          attainable score is exactly 100.
        </p>
      </Card>

      <Card>
        <SectionTitle title="Performance bands" />
        <div className="grid gap-3 sm:grid-cols-4">
          {[...BANDS].reverse().map((b, i, arr) => {
            const hi = i === arr.length - 1 ? 100 : arr[i + 1].min - 1;
            return (
              <div key={b.label} className="rounded-xl border p-4" style={{ borderColor: `${b.color}33`, background: `${b.color}0f` }}>
                <div className="text-sm font-semibold" style={{ color: b.color }}>{b.label}</div>
                <div className="mt-1 text-xs tabular-nums text-[var(--ink-secondary)]">{b.min}–{hi}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {project && score && (
        <Card>
          <SectionTitle
            title="Worked example"
            sub="The full audit trail for one project — expand any pillar to see its individual inputs."
            right={
              <select className="field w-auto" value={sel} onChange={(e) => setSel(Number(e.target.value))} aria-label="Choose project">
                {projects.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
              </select>
            }
          />
          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            <div className="mx-auto"><ScoreRing score={score.overall} size={172} /></div>
            <ScoreBreakdown project={project} />
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle title="Pillar comparison across the portfolio" sub="Weighted contribution of each pillar, per project. The full bar length is the overall score." />
        <StackedBars
          data={projects.map((p) => {
            const s = scoreProject(p);
            const row: Record<string, string | number> = { label: p.name.length > 24 ? `${p.name.slice(0, 22)}…` : p.name };
            s.pillars.forEach((pi) => { row[pi.label.split(' ')[0]] = pi.contribution; });
            return row;
          })}
          series={PILLARS.slice(0, 4).map((p) => ({ key: p.label.split(' ')[0], name: p.label }))}
          fmt={(v) => `${v.toFixed(1)} pts`}
          layout="vertical"
          height={340}
        />
        <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
          Showing the four highest-weight pillars. Financial and Environmental contributions are on each project page.
        </p>
      </Card>
    </div>
  );
}

const PILLAR_NOTES: Record<string, string> = {
  materials: 'Recycled, renewable, bio-based, reusable and recyclable share of the input, weighted 30/20/15/15/20 inside the pillar.',
  waste: 'Diversion rate, internal reuse, landfill avoidance, waste intensity per unit of input, and hazardous-waste avoidance.',
  lifecycle: 'Service life against a 10-year full-marks reference, plus repairability, modularity, reusability and remanufacturability.',
  recovery: 'Recovery rate, whether a take-back route exists at all, material recyclability and a remanufacturing pathway.',
  financial: 'Circular ROI over the horizon, payback speed, savings share of the cost base, and revenue from recovered material.',
  environmental: 'Carbon reduction share, renewable energy use, and energy and water savings against total consumption.',
};
