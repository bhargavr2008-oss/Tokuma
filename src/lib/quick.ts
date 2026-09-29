import type { Project, ProjectStatus, ClusterId, Confidence } from './types';

// ---------------------------------------------------------------------------
// Quick Intake. Clients arrive with almost no data, so the form asks for eight
// numbers and derives the remaining ~35 from sector benchmarks. Every derived
// field is tagged so the UI can show the user exactly what was assumed.
// ---------------------------------------------------------------------------

export interface QuickInput {
  name: string;
  organization: string;
  cluster: ClusterId;
  category: string;
  description: string;
  status: ProjectStatus;
  sector: SectorId;
  annualMaterialKg: number;      // how much material goes in per year
  wastePctOfInput: number;       // roughly what share becomes waste
  landfillShareOfWaste: number;  // of that waste, how much is binned
  recycledContentPct: number;    // recycled share of the input
  productLifeYears: number;
  annualMaterialSpend: number;
  wasteDisposalSpend: number;
  investmentBudget: number;
}

export type SectorId = 'packaging' | 'device' | 'materials' | 'software' | 'general';

interface Benchmark {
  label: string;
  renewablePct: number;
  bioBasedPct: number;
  reusablePct: number;
  recyclablePct: number;
  repairability: number;
  modularity: number;
  reusability: number;
  remanufacturability: number;
  recoveryRatePct: number;
  renewableEnergyPct: number;
  /** tCO2e per tonne of material input */
  carbonIntensity: number;
  /** m3 water per tonne */
  waterIntensity: number;
  /** MWh per tonne */
  energyIntensity: number;
  /** $ recovered per kg diverted from landfill */
  recoveryValuePerKg: number;
  discountRate: number;
}

export const BENCHMARKS: Record<SectorId, Benchmark> = {
  packaging:  { label: 'Packaging & converting', renewablePct: 30, bioBasedPct: 20, reusablePct: 20, recyclablePct: 60, repairability: 10, modularity: 15, reusability: 25, remanufacturability: 15, recoveryRatePct: 45, renewableEnergyPct: 35, carbonIntensity: 2.1, waterIntensity: 1.4, energyIntensity: 0.19, recoveryValuePerKg: 0.42, discountRate: 0.10 },
  device:     { label: 'Devices & electronics', renewablePct: 15, bioBasedPct: 8,  reusablePct: 60, recyclablePct: 65, repairability: 55, modularity: 60, reusability: 70, remanufacturability: 50, recoveryRatePct: 40, renewableEnergyPct: 30, carbonIntensity: 4.6, waterIntensity: 2.0, energyIntensity: 0.43, recoveryValuePerKg: 1.15, discountRate: 0.12 },
  materials:  { label: 'Materials & chemicals', renewablePct: 45, bioBasedPct: 40, reusablePct: 20, recyclablePct: 45, repairability: 5,  modularity: 10, reusability: 15, remanufacturability: 10, recoveryRatePct: 55, renewableEnergyPct: 35, carbonIntensity: 2.8, waterIntensity: 3.2, energyIntensity: 0.26, recoveryValuePerKg: 0.55, discountRate: 0.11 },
  software:   { label: 'Software & digital', renewablePct: 0, bioBasedPct: 0, reusablePct: 0, recyclablePct: 0, repairability: 85, modularity: 90, reusability: 88, remanufacturability: 70, recoveryRatePct: 0, renewableEnergyPct: 75, carbonIntensity: 0.1, waterIntensity: 0.05, energyIntensity: 0.02, recoveryValuePerKg: 0, discountRate: 0.10 },
  general:    { label: 'General manufacturing', renewablePct: 25, bioBasedPct: 12, reusablePct: 30, recyclablePct: 55, repairability: 40, modularity: 45, reusability: 45, remanufacturability: 35, recoveryRatePct: 45, renewableEnergyPct: 35, carbonIntensity: 3.0, waterIntensity: 1.8, energyIntensity: 0.30, recoveryValuePerKg: 0.60, discountRate: 0.11 },
};

export interface DerivedNote {
  field: string;
  value: string;
  basis: string;
}

export const QUICK_DEFAULTS: QuickInput = {
  name: '', organization: '', cluster: 'product-design', category: '', description: '',
  status: 'Prototype', sector: 'general',
  annualMaterialKg: 5000, wastePctOfInput: 12, landfillShareOfWaste: 40,
  recycledContentPct: 20, productLifeYears: 3,
  annualMaterialSpend: 250000, wasteDisposalSpend: 20000, investmentBudget: 150000,
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';

/** Expand eight answers into a fully scoreable project, plus an audit trail. */
export function expand(q: QuickInput): { project: Project; notes: DerivedNote[] } {
  const b = BENCHMARKS[q.sector];
  const notes: DerivedNote[] = [];
  const note = (field: string, value: string, basis: string) => { notes.push({ field, value, basis }); return undefined; };

  const input = Math.max(1, q.annualMaterialKg);
  const waste = (input * q.wastePctOfInput) / 100;
  const packaging = waste * 0.12;
  const manufacturing = waste - packaging;
  const landfill = (waste * q.landfillShareOfWaste) / 100;
  const diverted = waste - landfill;
  // Split the diverted stream two-to-one toward internal reuse, which is the
  // route most sites already run informally before anyone measures it.
  const reused = diverted * 0.62;
  const recycled = diverted - reused;
  const tonnes = input / 1000;

  note('Packaging / manufacturing waste split', `${Math.round(packaging)} kg / ${Math.round(manufacturing)} kg`, '12% of total waste assumed to be packaging');
  note('Diverted stream split', `${Math.round(reused)} kg reused, ${Math.round(recycled)} kg recycled`, '62/38 split, typical where internal regrind already exists');
  note('Renewable / bio-based content', `${b.renewablePct}% / ${b.bioBasedPct}%`, `${b.label} sector benchmark`);
  note('Repairability & modularity', `${b.repairability} / ${b.modularity}`, `${b.label} sector benchmark`);
  note('End-of-life recovery rate', `${b.recoveryRatePct}%`, `${b.label} sector benchmark`);
  note('Carbon footprint', `${(tonnes * b.carbonIntensity).toFixed(0)} tCO2e/yr`, `${b.carbonIntensity} tCO2e per tonne of input`);
  note('Water use', `${(tonnes * b.waterIntensity * 1000).toFixed(0)} m³/yr`, `${b.waterIntensity} m³ per kg of input`);
  note('Energy use', `${(tonnes * b.energyIntensity * 1000).toFixed(0)} MWh/yr`, `${b.energyIntensity} MWh per kg of input`);
  note('Discount rate', `${(b.discountRate * 100).toFixed(0)}%`, 'Sector cost of capital, editable on the finance page');

  const reuseSavings = reused * (q.annualMaterialSpend / input) + reused * (q.wasteDisposalSpend / Math.max(1, waste));
  const recyclingSavings = recycled * (q.wasteDisposalSpend / Math.max(1, waste));
  const circularRevenue = diverted * b.recoveryValuePerKg;
  note('Reuse savings', `$${Math.round(reuseSavings).toLocaleString()}/yr`, 'Avoided material purchase + avoided disposal fee on the reused tonnage');
  note('Recovered-material revenue', `$${Math.round(circularRevenue).toLocaleString()}/yr`, `$${b.recoveryValuePerKg}/kg recovered-material price for ${b.label}`);

  const now = new Date().toISOString().slice(0, 10);
  const project: Project = {
    id: `p-${Date.now().toString(36)}`,
    slug: slugify(q.name),
    name: q.name || 'Untitled project',
    cluster: q.cluster,
    category: q.category || BENCHMARKS[q.sector].label,
    organization: q.organization || 'Unassigned',
    team: [],
    status: q.status,
    accent: '#3ef08a',
    description: q.description,
    startDate: now,
    updatedAt: now,
    confidence: 'estimated' as Confidence,
    materials: {
      primaryMaterial: BENCHMARKS[q.sector].label,
      quantityKg: input,
      recycledPct: q.recycledContentPct,
      renewablePct: b.renewablePct,
      bioBasedPct: b.bioBasedPct,
      reusablePct: b.reusablePct,
      recyclablePct: b.recyclablePct,
    },
    waste: {
      totalInputKg: input,
      manufacturingWasteKg: manufacturing,
      reusedInternallyKg: reused,
      recycledExternallyKg: recycled,
      landfillKg: landfill,
      hazardousKg: waste * 0.01,
      packagingWasteKg: packaging,
    },
    lifecycle: {
      expectedLifeYears: q.productLifeYears,
      repairability: b.repairability,
      modularity: b.modularity,
      reusability: b.reusability,
      remanufacturability: b.remanufacturability,
      recoveryRatePct: b.recoveryRatePct,
      takeBackProgram: false,
    },
    financials: {
      materialCost: q.annualMaterialSpend,
      wasteDisposalCost: q.wasteDisposalSpend,
      productionCost: q.annualMaterialSpend * 1.6,
      reuseSavings,
      recyclingSavings,
      circularRevenue,
      circularInvestment: q.investmentBudget,
      discountRate: b.discountRate,
      horizonYears: 7,
    },
    environmental: {
      carbonFootprintTco2e: tonnes * b.carbonIntensity,
      carbonReductionTco2e: (diverted / 1000) * b.carbonIntensity * 0.85,
      waterUsageM3: tonnes * b.waterIntensity * 1000,
      waterSavingsM3: (diverted / 1000) * b.waterIntensity * 700,
      energyUsageMwh: tonnes * b.energyIntensity * 1000,
      energySavingsMwh: (diverted / 1000) * b.energyIntensity * 650,
      renewableEnergyPct: b.renewableEnergyPct,
    },
    products: [],
  };
  return { project, notes };
}
