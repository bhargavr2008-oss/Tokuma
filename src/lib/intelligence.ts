import type { Project } from './types';
import { scoreProject } from './scoring';
import { analyse } from './finance';
import { STATUS } from './palette';

export interface Insight {
  title: string;
  detail: string;
  severity: 'Critical' | 'Watch' | 'Opportunity';
  severityColor: string;
  projectId?: string;
}

const SEV = {
  Critical: STATUS.critical,
  Watch: STATUS.warning,
  Opportunity: STATUS.good,
} as const;

const make = (title: string, detail: string, severity: Insight['severity'], projectId?: string): Insight =>
  ({ title, detail, severity, severityColor: SEV[severity], projectId });

/**
 * Rule-based waste intelligence. Each rule is a pure function of the portfolio,
 * so a trained model can replace any individual rule later without the UI
 * changing shape — the contract is this Insight array.
 */
export function insights(projects: Project[]): Insight[] {
  const physical = projects.filter((p) => p.waste.manufacturingWasteKg > 0);
  if (!physical.length) return [make('No physical waste streams recorded', 'Every project in the portfolio is infrastructure or software. Add a manufacturing project to activate waste analysis.', 'Watch')];

  const out: Insight[] = [];
  const withWaste = physical.map((p) => {
    const total = p.waste.manufacturingWasteKg + p.waste.packagingWasteKg;
    return {
      p,
      total,
      landfillShare: total ? p.waste.landfillKg / total : 0,
      intensity: p.waste.totalInputKg ? total / p.waste.totalInputKg : 0,
      reuseShare: total ? p.waste.reusedInternallyKg / total : 0,
    };
  });

  // 1. highest absolute waste category
  const biggest = [...withWaste].sort((a, b) => b.total - a.total)[0];
  out.push(make(
    `Highest waste volume: ${biggest.p.name}`,
    `${Math.round(biggest.total).toLocaleString()} kg/yr, ${(biggest.landfillShare * 100).toFixed(0)}% of it to landfill. This is the largest single stream in the portfolio and sets the ceiling on portfolio diversion.`,
    biggest.landfillShare > 0.3 ? 'Critical' : 'Watch',
    biggest.p.id,
  ));

  // 2. landfill outliers against the portfolio mean
  const meanLandfill = withWaste.reduce((s, w) => s + w.landfillShare, 0) / withWaste.length;
  withWaste
    .filter((w) => w.landfillShare > meanLandfill * 1.35 && w.landfillShare > 0.2)
    .forEach((w) => out.push(make(
      `Landfill rate outlier: ${w.p.name}`,
      `${(w.landfillShare * 100).toFixed(0)}% of this project's waste is landfilled against a portfolio mean of ${(meanLandfill * 100).toFixed(0)}%. Disposal fees and replacement material are both being paid on the same tonnage.`,
      'Critical', w.p.id,
    )));

  // 3. waste intensity anomaly
  const meanIntensity = withWaste.reduce((s, w) => s + w.intensity, 0) / withWaste.length;
  withWaste
    .filter((w) => w.intensity > meanIntensity * 1.3)
    .forEach((w) => out.push(make(
      `Waste intensity spike: ${w.p.name}`,
      `${(w.intensity * 100).toFixed(1)} kg of waste per 100 kg of input, against a portfolio mean of ${(meanIntensity * 100).toFixed(1)}. A yield problem upstream usually costs more than the disposal line suggests.`,
      'Watch', w.p.id,
    )));

  // 4. repeated materials — reuse opportunity across projects
  const byMaterial = new Map<string, Project[]>();
  physical.forEach((p) => {
    const key = p.materials.primaryMaterial.split(/[\/+]/)[0].trim().toLowerCase();
    byMaterial.set(key, [...(byMaterial.get(key) ?? []), p]);
  });
  byMaterial.forEach((ps, mat) => {
    if (ps.length > 1) out.push(make(
      `Shared feedstock: ${mat}`,
      `${ps.length} projects run on the same base material (${ps.map((x) => x.name).join(', ')}). Offcuts from one are a qualified input for another — the cheapest reuse loop in the portfolio is between your own projects.`,
      'Opportunity',
    ));
  });

  // 5. strongest financial ROI available
  const roi = projects.map((p) => ({ p, fin: analyse(p) }))
    .filter((x) => x.fin.investment > 0)
    .sort((a, b) => (b.fin.irr ?? -1) - (a.fin.irr ?? -1))[0];
  if (roi?.fin.irr != null) out.push(make(
    `Strongest return: ${roi.p.name}`,
    `${(roi.fin.irr * 100).toFixed(0)}% IRR on ${Math.round(roi.fin.investment).toLocaleString()} of circular capital, paying back in ${roi.fin.paybackYears?.toFixed(1) ?? '—'} years. This is where the next dollar of investment goes.`,
    'Opportunity', roi.p.id,
  ));

  // 6. weakest pillar in the portfolio
  const weakest = projects
    .map((p) => ({ p, s: scoreProject(p) }))
    .flatMap(({ p, s }) => s.pillars.map((pi) => ({ p, pi })))
    .sort((a, b) => a.pi.score - b.pi.score)[0];
  if (weakest) out.push(make(
    `Weakest pillar: ${weakest.pi.label}`,
    `${weakest.p.name} scores ${weakest.pi.score} on ${weakest.pi.label}, costing ${((100 - weakest.pi.score) * weakest.pi.weight).toFixed(1)} points of its overall score.`,
    'Watch', weakest.p.id,
  ));

  const rank = { Critical: 0, Watch: 1, Opportunity: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
