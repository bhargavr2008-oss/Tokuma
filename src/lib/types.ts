// Tokuma domain model. Every numeric input carries a `confidence` so that
// clients with almost no data can still be scored honestly.

export type Confidence = 'measured' | 'estimated' | 'default';

export interface Materials {
  primaryMaterial: string;
  quantityKg: number;
  recycledPct: number;
  renewablePct: number;
  bioBasedPct: number;
  reusablePct: number;
  recyclablePct: number;
}

export interface Waste {
  totalInputKg: number;
  manufacturingWasteKg: number;
  reusedInternallyKg: number;
  recycledExternallyKg: number;
  landfillKg: number;
  hazardousKg: number;
  packagingWasteKg: number;
}

export interface Lifecycle {
  expectedLifeYears: number;
  repairability: number;      // 0-100
  modularity: number;         // 0-100
  reusability: number;        // 0-100
  remanufacturability: number;// 0-100
  recoveryRatePct: number;    // 0-100
  takeBackProgram: boolean;
}

export interface Financials {
  materialCost: number;
  wasteDisposalCost: number;
  productionCost: number;
  reuseSavings: number;
  recyclingSavings: number;
  circularRevenue: number;
  circularInvestment: number;
  discountRate: number;   // e.g. 0.10
  horizonYears: number;   // e.g. 7
}

export interface Environmental {
  carbonFootprintTco2e: number;
  carbonReductionTco2e: number;
  waterUsageM3: number;
  waterSavingsM3: number;
  energyUsageMwh: number;
  energySavingsMwh: number;
  renewableEnergyPct: number;
}

export type ProjectStatus = 'Concept' | 'Prototype' | 'Pilot' | 'Scaling' | 'Production';

export interface Project {
  id: string;
  slug: string;
  name: string;
  cluster: ClusterId;
  category: string;
  organization: string;
  team: string[];
  status: ProjectStatus;
  description: string;
  accent: string;
  startDate: string;
  updatedAt: string;
  confidence: Confidence;
  materials: Materials;
  waste: Waste;
  lifecycle: Lifecycle;
  financials: Financials;
  environmental: Environmental;
  products: Product[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  endOfLife: string;
  repairNotes: string;
}

export type ClusterId =
  | 'business-model'
  | 'platform'
  | 'lca'
  | 'mbse'
  | 'bio-materials'
  | 'product-design'
  | 'biomedical';

export interface Cluster {
  id: ClusterId;
  name: string;
  short: string;
  purpose: string;
  connectsTo: ClusterId[];
}
