import type { Project } from './types';
import { scoreProject, circularBenefit } from './scoring';
import { analyse } from './finance';

export interface Portfolio {
  projects: number;
  products: number;
  avgScore: number;
  wasteDivertedKg: number;
  wasteTotalKg: number;
  landfillKg: number;
  costSavings: number;
  revenueOpportunity: number;
  investment: number;
  npv: number;
  carbonReduction: number;
  diversionRate: number;
}

export function portfolio(projects: Project[]): Portfolio {
  const agg = projects.reduce(
    (a, p) => {
      const s = scoreProject(p).overall;
      const fin = analyse(p);
      const wasteTotal = p.waste.manufacturingWasteKg + p.waste.packagingWasteKg;
      a.scoreSum += s;
      a.products += p.products.length;
      a.wasteTotalKg += wasteTotal;
      a.wasteDivertedKg += p.waste.reusedInternallyKg + p.waste.recycledExternallyKg;
      a.landfillKg += p.waste.landfillKg;
      a.costSavings += p.financials.reuseSavings + p.financials.recyclingSavings;
      a.revenueOpportunity += p.financials.circularRevenue;
      a.investment += p.financials.circularInvestment;
      a.npv += fin.npv;
      a.carbonReduction += p.environmental.carbonReductionTco2e;
      return a;
    },
    { scoreSum: 0, products: 0, wasteTotalKg: 0, wasteDivertedKg: 0, landfillKg: 0,
      costSavings: 0, revenueOpportunity: 0, investment: 0, npv: 0, carbonReduction: 0 },
  );

  return {
    projects: projects.length,
    products: agg.products,
    avgScore: projects.length ? Math.round((agg.scoreSum / projects.length) * 10) / 10 : 0,
    wasteDivertedKg: agg.wasteDivertedKg,
    wasteTotalKg: agg.wasteTotalKg,
    landfillKg: agg.landfillKg,
    costSavings: agg.costSavings,
    revenueOpportunity: agg.revenueOpportunity,
    investment: agg.investment,
    npv: agg.npv,
    carbonReduction: agg.carbonReduction,
    diversionRate: agg.wasteTotalKg ? (agg.wasteDivertedKg / agg.wasteTotalKg) * 100 : 0,
  };
}

/**
 * Twelve-month history. Real observations do not exist yet for a prototype, so
 * the series is reconstructed backwards from the current measured state with a
 * fixed improvement curve — labelled as modelled everywhere it is shown.
 */
export function modelledHistory(projects: Project[], months = 12) {
  const now = portfolio(projects);
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const t = (months - 1 - i) / (months - 1);
    const ramp = 0.62 + 0.38 * t;              // improvement curve
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    out.push({
      label: d.toLocaleString('en', { month: 'short' }),
      score: Math.round(now.avgScore * ramp * 10) / 10,
      diverted: Math.round((now.wasteDivertedKg / 12) * ramp),
      landfill: Math.round((now.landfillKg / 12) * (1.9 - ramp)),
      savings: Math.round((now.costSavings / 12) * ramp),
      revenue: Math.round((now.revenueOpportunity / 12) * ramp),
    });
  }
  return out;
}

export const benefit = circularBenefit;
