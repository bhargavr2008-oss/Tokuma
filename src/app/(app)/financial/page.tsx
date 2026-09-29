'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { portfolio, modelledHistory } from '@/lib/portfolio';
import { analyse, money, pct } from '@/lib/finance';
import { scoreProject, band } from '@/lib/scoring';
import type { Project } from '@/lib/types';
import { Card, SectionTitle, Stat, ScoreRing } from '@/components/ui';
import { CashflowChart, TrendChart, RankedBars } from '@/components/charts';
import { CAT } from '@/lib/palette';

export default function Financial() {
  const { projects } = useStore();
  const p = useMemo(() => portfolio(projects), [projects]);
  const history = useMemo(() => modelledHistory(projects), [projects]);
  const [sel, setSel] = useState(0);
  const base = projects[Math.min(sel, projects.length - 1)];

  // Scenario levers. Each is a multiplier or absolute override applied to a
  // clone of the project, so the baseline is never mutated.
  const [recycled, setRecycled] = useState<number | null>(null);
  const [landfillCut, setLandfillCut] = useState(0);
  const [lifeExtra, setLifeExtra] = useState(0);
  const [discount, setDiscount] = useState<number | null>(null);

  const scenario: Project | null = useMemo(() => {
    if (!base) return null;
    const d: Project = structuredClone(base);
    d.materials.recycledPct = recycled ?? d.materials.recycledPct;
    const moved = (d.waste.landfillKg * landfillCut) / 100;
    d.waste.landfillKg -= moved;
    d.waste.reusedInternallyKg += moved;
    d.lifecycle.expectedLifeYears += lifeExtra;
    d.financials.discountRate = discount ?? d.financials.discountRate;
    // Diverting a kilo both avoids a disposal fee and replaces a purchased kilo.
    const perKgDisposal = d.financials.wasteDisposalCost /
      Math.max(1, base.waste.manufacturingWasteKg + base.waste.packagingWasteKg);
    const perKgMaterial = d.financials.materialCost / Math.max(1, base.materials.quantityKg);
    d.financials.reuseSavings += moved * (perKgDisposal + perKgMaterial);
    // A longer service life spreads the same embodied cost over more years.
    if (lifeExtra > 0 && base.lifecycle.expectedLifeYears > 0) {
      d.financials.circularRevenue *= 1 + lifeExtra / base.lifecycle.expectedLifeYears * 0.35;
    }
    return d;
  }, [base, recycled, landfillCut, lifeExtra, discount]);

  const baseFin = base ? analyse(base) : null;
  const scenFin = scenario ? analyse(scenario) : null;
  const baseScore = base ? scoreProject(base).overall : 0;
  const scenScore = scenario ? scoreProject(scenario).overall : 0;

  const reset = () => { setRecycled(null); setLandfillCut(0); setLifeExtra(0); setDiscount(null); };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Financial Impact</h1>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--ink-secondary)]">
          Circular performance translated into the metrics an investment committee asks for. Every
          figure below is derived from one cash-flow series per project, so NPV, IRR, payback and the
          profitability index can never disagree with each other.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Portfolio NPV" value={p.npv} prefix="$" accent={p.npv >= 0 ? CAT[0] : '#95492A'} sub="Sum of discounted project cash flows" />
        <Stat label="Annual cost savings" value={p.costSavings} prefix="$" sub="Reuse + recycling, recurring" />
        <Stat label="Recovered-material revenue" value={p.revenueOpportunity} prefix="$" sub="New circular revenue line" />
        <Stat label="Capital deployed" value={p.investment} prefix="$" sub="Circular investment across the portfolio" />
      </div>

      <Card>
        <SectionTitle title="Savings and revenue trend" sub="Modelled monthly benefit in dollars, reconstructed from the current measured run rate. Both series share one dollar axis." />
        <TrendChart
          data={history}
          series={[{ key: 'savings', name: 'Cost savings ($/mo)' }, { key: 'revenue', name: 'Recovered-material revenue ($/mo)' }]}
          fmt={(v) => `$${Math.round(v).toLocaleString()}`}
        />
      </Card>

      <Card>
        <SectionTitle title="Return by project" sub="Net present value on the deployed circular capital." />
        <RankedBars
          data={projects.map((pr) => ({
            label: pr.name.length > 26 ? `${pr.name.slice(0, 24)}…` : pr.name,
            value: Math.round(analyse(pr).npv),
          })).sort((a, b) => b.value - a.value)}
          fmt={(v) => money(v)}
          height={300}
          tickFormatter={money}
        />
      </Card>

      {base && scenario && baseFin && scenFin && (
        <Card>
          <SectionTitle
            title="Scenario modelling"
            sub="Move a lever and the score, the cash flows and every investor metric re-solve against the same engine — nothing here is a lookup table."
            right={
              <select className="field w-auto" value={sel} onChange={(e) => { setSel(Number(e.target.value)); reset(); }} aria-label="Choose project">
                {projects.map((pr, i) => <option key={pr.id} value={i}>{pr.name}</option>)}
              </select>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <div className="space-y-5">
              <Slider label="Recycled content" unit="%" min={0} max={100}
                value={recycled ?? base.materials.recycledPct} baseline={base.materials.recycledPct}
                onChange={setRecycled} />
              <Slider label="Landfill stream diverted to reuse" unit="%" min={0} max={100}
                value={landfillCut} baseline={0} onChange={setLandfillCut} />
              <Slider label="Additional service life" unit=" yrs" min={0} max={8}
                value={lifeExtra} baseline={0} onChange={setLifeExtra} />
              <Slider label="Discount rate" unit="%" min={4} max={25}
                value={Math.round((discount ?? base.financials.discountRate) * 100)}
                baseline={Math.round(base.financials.discountRate * 100)}
                onChange={(v) => setDiscount(v / 100)} />
              <button onClick={reset} className="btn-ghost w-full text-xs">Reset to baseline</button>
            </div>

            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="glass flex flex-col items-center gap-3 p-4 text-center">
                  <ScoreRing score={scenScore} size={104} stroke={9} label={false} />
                  <div>
                    <div className="label">Circular score</div>
                    <div className="mt-1 text-sm" style={{ color: band(scenScore).color }}>{band(scenScore).label}</div>
                    <Delta base={baseScore} next={scenScore} fmt={(v) => v.toFixed(1)} />
                  </div>
                </div>
                <div className="glass p-4">
                  <div className="label">Net present value</div>
                  <div className="mt-2 text-xl font-semibold tabular-nums">{money(scenFin.npv)}</div>
                  <Delta base={baseFin.npv} next={scenFin.npv} fmt={money} />
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Mini label="IRR" value={pct(scenFin.irr, 1)} baseline={pct(baseFin.irr, 1)} />
                <Mini label="Payback" value={scenFin.paybackYears ? `${scenFin.paybackYears.toFixed(1)} yrs` : '—'} baseline={baseFin.paybackYears ? `${baseFin.paybackYears.toFixed(1)} yrs` : '—'} />
                <Mini label="Annual benefit" value={money(scenFin.annualBenefit)} baseline={money(baseFin.annualBenefit)} />
              </div>

              <div className="mt-4">
                <div className="label mb-2">Cumulative cash position under this scenario</div>
                <CashflowChart flows={scenFin.flows} height={220} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle title="Investor summary table" sub="Every project, every metric, one screen." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                <th className="py-2.5 font-medium">Project</th>
                <th className="py-2.5 text-right font-medium">Score</th>
                <th className="py-2.5 text-right font-medium">Capital</th>
                <th className="py-2.5 text-right font-medium">Annual benefit</th>
                <th className="py-2.5 text-right font-medium">NPV</th>
                <th className="py-2.5 text-right font-medium">IRR</th>
                <th className="py-2.5 text-right font-medium">ROI</th>
                <th className="py-2.5 text-right font-medium">Payback</th>
                <th className="py-2.5 text-right font-medium">PI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {projects.map((pr) => {
                const f = analyse(pr);
                const s = scoreProject(pr).overall;
                return (
                  <tr key={pr.id}>
                    <td className="py-2.5 pr-4">{pr.name}</td>
                    <td className="py-2.5 text-right tabular-nums" style={{ color: band(s).color }}>{s.toFixed(1)}</td>
                    <td className="py-2.5 text-right tabular-nums">{money(f.investment)}</td>
                    <td className="py-2.5 text-right tabular-nums">{money(f.annualBenefit)}</td>
                    <td className="py-2.5 text-right tabular-nums" style={{ color: f.npv >= 0 ? CAT[0] : '#95492A' }}>{money(f.npv)}</td>
                    <td className="py-2.5 text-right tabular-nums">{pct(f.irr, 0)}</td>
                    <td className="py-2.5 text-right tabular-nums">{f.roi.toFixed(0)}%</td>
                    <td className="py-2.5 text-right tabular-nums">{f.paybackYears ? `${f.paybackYears.toFixed(1)}y` : '—'}</td>
                    <td className="py-2.5 text-right tabular-nums">{f.profitabilityIndex.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Slider({ label, unit, min, max, value, baseline, onChange }: {
  label: string; unit: string; min: number; max: number; value: number; baseline: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs text-[var(--ink-secondary)]">{label}</label>
        <span className="text-xs tabular-nums">
          {value}{unit}
          {value !== baseline && <span className="ml-1.5 text-[var(--ink-muted)]">was {baseline}{unit}</span>}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-sage-600" aria-label={label}
      />
    </div>
  );
}

function Delta({ base, next, fmt }: { base: number; next: number; fmt: (v: number) => string }) {
  const d = next - base;
  if (Math.abs(d) < 0.05) return <div className="mt-1 text-[11px] text-[var(--ink-muted)]">at baseline</div>;
  return (
    <div className="mt-1 text-[11px] font-medium" style={{ color: d > 0 ? CAT[0] : '#95492A' }}>
      {d > 0 ? '+' : '−'}{fmt(Math.abs(d))} vs baseline
    </div>
  );
}

function Mini({ label, value, baseline }: { label: string; value: string; baseline: string }) {
  return (
    <div className="glass p-3.5">
      <div className="label">{label}</div>
      <div className="mt-1.5 text-base font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--ink-muted)]">baseline {baseline}</div>
    </div>
  );
}
