import type { Project } from './types';
import { circularBenefit } from './scoring';

// ---------------------------------------------------------------------------
// Investor-facing metrics. The cash-flow series is the single source of truth:
// NPV, IRR, payback and MIRR are all derived from the same array so the
// valuation dashboard can never disagree with itself.
// ---------------------------------------------------------------------------

export interface CashFlow {
  year: number;
  investment: number;
  savings: number;
  revenue: number;
  net: number;
  discounted: number;
  cumulative: number;
}

export interface FinanceResult {
  flows: CashFlow[];
  npv: number;
  irr: number | null;
  roi: number;
  paybackYears: number | null;
  discountedPaybackYears: number | null;
  annualBenefit: number;
  totalBenefit: number;
  investment: number;
  profitabilityIndex: number;
  benefitCostRatio: number;
  wasteDisposalAvoided: number;
}

export function cashFlows(p: Project, opts?: { benefitOverride?: number }): CashFlow[] {
  const f = p.financials;
  const annual = opts?.benefitOverride ?? circularBenefit(p);
  const flows: CashFlow[] = [];
  let cumulative = -f.circularInvestment;
  flows.push({
    year: 0,
    investment: f.circularInvestment,
    savings: 0,
    revenue: 0,
    net: -f.circularInvestment,
    discounted: -f.circularInvestment,
    cumulative,
  });
  const savingsShare = safeShare(f.reuseSavings + f.recyclingSavings, circularBenefit(p));
  for (let y = 1; y <= f.horizonYears; y++) {
    const net = annual;
    const discounted = net / Math.pow(1 + f.discountRate, y);
    cumulative += net;
    flows.push({
      year: y,
      investment: 0,
      savings: net * savingsShare,
      revenue: net * (1 - savingsShare),
      net,
      discounted,
      cumulative,
    });
  }
  return flows;
}

const safeShare = (a: number, b: number) => (b === 0 ? 1 : a / b);

export function npv(flows: CashFlow[]): number {
  return flows.reduce((s, f) => s + f.discounted, 0);
}

/** IRR by bisection on [-0.95, 10]. Returns null when no sign change exists. */
export function irr(flows: CashFlow[]): number | null {
  const f = (rate: number) =>
    flows.reduce((s, c) => s + c.net / Math.pow(1 + rate, c.year), 0);
  let lo = -0.95;
  let hi = 10;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Year at which cumulative cash turns positive, interpolated within the year. */
function crossing(values: number[]): number | null {
  for (let i = 1; i < values.length; i++) {
    if (values[i] >= 0) {
      const prev = values[i - 1];
      const step = values[i] - prev;
      return step === 0 ? i : i - 1 + -prev / step;
    }
  }
  return null;
}

export function analyse(p: Project, opts?: { benefitOverride?: number }): FinanceResult {
  const flows = cashFlows(p, opts);
  const annual = opts?.benefitOverride ?? circularBenefit(p);
  const investment = p.financials.circularInvestment;
  const total = annual * p.financials.horizonYears;

  let running = 0;
  const discCum = flows.map((f) => (running += f.discounted));

  const value = npv(flows);
  return {
    flows,
    npv: value,
    irr: irr(flows),
    roi: investment === 0 ? 0 : ((total - investment) / investment) * 100,
    paybackYears: crossing(flows.map((f) => f.cumulative)),
    discountedPaybackYears: crossing(discCum),
    annualBenefit: annual,
    totalBenefit: total,
    investment,
    profitabilityIndex: investment === 0 ? 0 : (value + investment) / investment,
    benefitCostRatio: investment === 0 ? 0 : total / investment,
    wasteDisposalAvoided: p.financials.wasteDisposalCost,
  };
}

export const money = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

export const pct = (n: number | null, digits = 1) =>
  n === null ? 'n/a' : `${(n * 100).toFixed(digits)}%`;
