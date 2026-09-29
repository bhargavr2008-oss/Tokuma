import type { Project } from './types';

// ---------------------------------------------------------------------------
// Circular Economy Score. Every weight lives here so the methodology page and
// the score-breakdown modal read from exactly the same numbers the engine uses.
// ---------------------------------------------------------------------------

export const PILLARS = [
  { id: 'materials', label: 'Materials Circularity', weight: 0.20 },
  { id: 'waste', label: 'Waste Management', weight: 0.20 },
  { id: 'lifecycle', label: 'Product Lifecycle', weight: 0.20 },
  { id: 'recovery', label: 'End-of-Life Recovery', weight: 0.15 },
  { id: 'financial', label: 'Financial Circularity', weight: 0.15 },
  { id: 'environmental', label: 'Environmental Performance', weight: 0.10 },
] as const;

export type PillarId = (typeof PILLARS)[number]['id'];

export const BANDS = [
  { min: 80, label: 'Circular Leader', color: '#3F7A32' },
  { min: 60, label: 'Advanced', color: '#6E7F5C' },
  { min: 40, label: 'Developing', color: '#C2811A' },
  { min: 0, label: 'Early Stage', color: '#B4603A' },
];

export function band(score: number) {
  return BANDS.find((b) => score >= b.min)!;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

export interface Term {
  label: string;
  value: number;   // the 0-100 input
  weight: number;  // weight inside the pillar
  unit?: string;
}

export interface PillarResult {
  id: PillarId;
  label: string;
  weight: number;
  score: number;        // 0-100
  contribution: number; // score * weight
  terms: Term[];
}

export interface ScoreResult {
  overall: number;
  pillars: PillarResult[];
}

function weighted(terms: Term[]): number {
  const total = terms.reduce((s, t) => s + t.weight, 0);
  return clamp(safeDiv(terms.reduce((s, t) => s + t.value * t.weight, 0), total));
}

export function materialsScore(p: Project): Term[] {
  const m = p.materials;
  return [
    { label: 'Recycled content', value: clamp(m.recycledPct), weight: 0.30, unit: '%' },
    { label: 'Renewable content', value: clamp(m.renewablePct), weight: 0.20, unit: '%' },
    { label: 'Bio-based content', value: clamp(m.bioBasedPct), weight: 0.15, unit: '%' },
    { label: 'Reusable content', value: clamp(m.reusablePct), weight: 0.15, unit: '%' },
    { label: 'Recyclable content', value: clamp(m.recyclablePct), weight: 0.20, unit: '%' },
  ];
}

export function wasteScore(p: Project): Term[] {
  const w = p.waste;
  const total = w.manufacturingWasteKg + w.packagingWasteKg;
  const diverted = w.reusedInternallyKg + w.recycledExternallyKg;
  const diversion = clamp(safeDiv(diverted, total) * 100);
  const internalReuse = clamp(safeDiv(w.reusedInternallyKg, total) * 100);
  const landfillAvoided = clamp(100 - safeDiv(w.landfillKg, total) * 100);
  // Waste intensity: waste per kg of material input, capped at 20% = score 0.
  const intensity = clamp(100 - safeDiv(total, w.totalInputKg) * 500);
  const hazardFree = clamp(100 - safeDiv(w.hazardousKg, total) * 1000);
  return [
    { label: 'Waste diversion rate', value: diversion, weight: 0.30, unit: '%' },
    { label: 'Internal reuse rate', value: internalReuse, weight: 0.20, unit: '%' },
    { label: 'Landfill avoidance', value: landfillAvoided, weight: 0.25, unit: '%' },
    { label: 'Waste intensity (per unit input)', value: intensity, weight: 0.15, unit: 'idx' },
    { label: 'Hazardous waste avoidance', value: hazardFree, weight: 0.10, unit: 'idx' },
  ];
}

export function lifecycleScore(p: Project): Term[] {
  const l = p.lifecycle;
  // 10 years of service life is treated as a full-marks design life.
  const life = clamp((l.expectedLifeYears / 10) * 100);
  return [
    { label: 'Expected service life', value: life, weight: 0.25, unit: 'idx' },
    { label: 'Repairability', value: clamp(l.repairability), weight: 0.25 },
    { label: 'Modularity', value: clamp(l.modularity), weight: 0.20 },
    { label: 'Reusability', value: clamp(l.reusability), weight: 0.15 },
    { label: 'Remanufacturability', value: clamp(l.remanufacturability), weight: 0.15 },
  ];
}

export function recoveryScore(p: Project): Term[] {
  const l = p.lifecycle;
  const m = p.materials;
  return [
    { label: 'End-of-life recovery rate', value: clamp(l.recoveryRatePct), weight: 0.40, unit: '%' },
    { label: 'Take-back / collection system', value: l.takeBackProgram ? 100 : 0, weight: 0.25 },
    { label: 'Recyclability of materials', value: clamp(m.recyclablePct), weight: 0.20, unit: '%' },
    { label: 'Remanufacturing pathway', value: clamp(l.remanufacturability), weight: 0.15 },
  ];
}

export function financialScore(p: Project): Term[] {
  const f = p.financials;
  const benefit = circularBenefit(p);
  const roi = safeDiv(benefit - f.circularInvestment, f.circularInvestment) * 100;
  // 100% ROI over the horizon is treated as full marks.
  const roiScore = clamp(roi);
  const payback = paybackYears(p);
  // 1 year payback = 100, 6 years or never = 0.
  const paybackScore = payback === null ? 0 : clamp(((6 - payback) / 5) * 100);
  const costBase = f.materialCost + f.productionCost + f.wasteDisposalCost;
  const savingsShare = clamp(safeDiv(f.reuseSavings + f.recyclingSavings, costBase) * 400);
  const revenueShare = clamp(safeDiv(f.circularRevenue, costBase) * 400);
  return [
    { label: 'Circular ROI over horizon', value: roiScore, weight: 0.30, unit: 'idx' },
    { label: 'Payback speed', value: paybackScore, weight: 0.25, unit: 'idx' },
    { label: 'Reuse & recycling savings share', value: savingsShare, weight: 0.25, unit: 'idx' },
    { label: 'Revenue from recovered material', value: revenueShare, weight: 0.20, unit: 'idx' },
  ];
}

export function environmentalScore(p: Project): Term[] {
  const e = p.environmental;
  const carbon = clamp(safeDiv(e.carbonReductionTco2e, e.carbonFootprintTco2e + e.carbonReductionTco2e) * 100);
  const water = clamp(safeDiv(e.waterSavingsM3, e.waterUsageM3 + e.waterSavingsM3) * 100);
  const energy = clamp(safeDiv(e.energySavingsMwh, e.energyUsageMwh + e.energySavingsMwh) * 100);
  return [
    { label: 'Carbon reduction share', value: carbon, weight: 0.35, unit: '%' },
    { label: 'Renewable energy use', value: clamp(e.renewableEnergyPct), weight: 0.25, unit: '%' },
    { label: 'Energy savings share', value: energy, weight: 0.20, unit: '%' },
    { label: 'Water savings share', value: water, weight: 0.20, unit: '%' },
  ];
}

const TERM_FNS: Record<PillarId, (p: Project) => Term[]> = {
  materials: materialsScore,
  waste: wasteScore,
  lifecycle: lifecycleScore,
  recovery: recoveryScore,
  financial: financialScore,
  environmental: environmentalScore,
};

export function scoreProject(p: Project): ScoreResult {
  const pillars = PILLARS.map((def) => {
    const terms = TERM_FNS[def.id](p);
    const score = weighted(terms);
    return {
      id: def.id,
      label: def.label,
      weight: def.weight,
      score: round(score),
      contribution: round(score * def.weight),
      terms: terms.map((t) => ({ ...t, value: round(t.value) })),
    };
  });
  return {
    overall: round(pillars.reduce((s, p2) => s + p2.contribution, 0)),
    pillars,
  };
}

// --- shared financial primitives used by both the score and the finance page

export function circularBenefit(p: Project): number {
  const f = p.financials;
  return f.reuseSavings + f.recyclingSavings + f.circularRevenue;
}

/** Simple payback in years, or null if the project never pays back. */
export function paybackYears(p: Project): number | null {
  const annual = circularBenefit(p);
  if (annual <= 0) return null;
  const years = p.financials.circularInvestment / annual;
  return years > p.financials.horizonYears ? null : years;
}

export const round = (n: number) => Math.round(n * 10) / 10;
