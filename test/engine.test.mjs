// Engine tests. Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { register } from 'node:module';
register('../scripts/ts-loader.mjs', import.meta.url);

const { scoreProject, PILLARS, band } = await import('../src/lib/scoring.ts');
const { analyse, irr, cashFlows } = await import('../src/lib/finance.ts');
const { expand, QUICK_DEFAULTS } = await import('../src/lib/quick.ts');
const { recommendations } = await import('../src/lib/recommend.ts');
const { PROJECTS } = await import('../src/lib/data.ts');
const { portfolio } = await import('../src/lib/portfolio.ts');

test('pillar weights sum to exactly 1', () => {
  const total = PILLARS.reduce((s, p) => s + p.weight, 0);
  assert.equal(Math.round(total * 1000) / 1000, 1);
});

test('every seed project scores inside 0..100', () => {
  for (const p of PROJECTS) {
    const s = scoreProject(p).overall;
    assert.ok(s >= 0 && s <= 100, `${p.name} scored ${s}`);
    for (const pi of s === s ? scoreProject(p).pillars : []) {
      assert.ok(pi.score >= 0 && pi.score <= 100, `${p.name}/${pi.id} = ${pi.score}`);
    }
  }
});

test('overall score equals the sum of its pillar contributions', () => {
  for (const p of PROJECTS) {
    const s = scoreProject(p);
    const sum = s.pillars.reduce((a, x) => a + x.contribution, 0);
    assert.ok(Math.abs(sum - s.overall) < 0.11, `${p.name}: ${sum} vs ${s.overall}`);
  }
});

test('a perfect project scores 100 and a null project scores 0', () => {
  const base = structuredClone(PROJECTS[0]);
  const perfect = structuredClone(base);
  Object.assign(perfect.materials, { recycledPct: 100, renewablePct: 100, bioBasedPct: 100, reusablePct: 100, recyclablePct: 100 });
  Object.assign(perfect.waste, { totalInputKg: 1e9, manufacturingWasteKg: 1, packagingWasteKg: 0, reusedInternallyKg: 1, recycledExternallyKg: 0, landfillKg: 0, hazardousKg: 0 });
  Object.assign(perfect.lifecycle, { expectedLifeYears: 20, repairability: 100, modularity: 100, reusability: 100, remanufacturability: 100, recoveryRatePct: 100, takeBackProgram: true });
  Object.assign(perfect.financials, { materialCost: 100, productionCost: 100, wasteDisposalCost: 100, reuseSavings: 1000, recyclingSavings: 1000, circularRevenue: 1000, circularInvestment: 1000, discountRate: 0.1, horizonYears: 7 });
  Object.assign(perfect.environmental, { carbonFootprintTco2e: 0, carbonReductionTco2e: 100, waterUsageM3: 0, waterSavingsM3: 100, energyUsageMwh: 0, energySavingsMwh: 100, renewableEnergyPct: 100 });
  assert.equal(scoreProject(perfect).overall, 100);

  const worst = structuredClone(base);
  Object.assign(worst.materials, { recycledPct: 0, renewablePct: 0, bioBasedPct: 0, reusablePct: 0, recyclablePct: 0 });
  Object.assign(worst.waste, { totalInputKg: 100, manufacturingWasteKg: 100, packagingWasteKg: 0, reusedInternallyKg: 0, recycledExternallyKg: 0, landfillKg: 100, hazardousKg: 100 });
  Object.assign(worst.lifecycle, { expectedLifeYears: 0, repairability: 0, modularity: 0, reusability: 0, remanufacturability: 0, recoveryRatePct: 0, takeBackProgram: false });
  Object.assign(worst.financials, { materialCost: 100, productionCost: 100, wasteDisposalCost: 100, reuseSavings: 0, recyclingSavings: 0, circularRevenue: 0, circularInvestment: 1000, discountRate: 0.1, horizonYears: 7 });
  Object.assign(worst.environmental, { carbonFootprintTco2e: 100, carbonReductionTco2e: 0, waterUsageM3: 100, waterSavingsM3: 0, energyUsageMwh: 100, energySavingsMwh: 0, renewableEnergyPct: 0 });
  assert.equal(scoreProject(worst).overall, 0);
});

test('bands partition 0..100 without a gap', () => {
  assert.equal(band(0).label, 'Early Stage');
  assert.equal(band(39.9).label, 'Early Stage');
  assert.equal(band(40).label, 'Developing');
  assert.equal(band(60).label, 'Advanced');
  assert.equal(band(80).label, 'Circular Leader');
  assert.equal(band(100).label, 'Circular Leader');
});

test('IRR is the rate at which NPV is zero', () => {
  for (const p of PROJECTS) {
    const f = analyse(p);
    if (f.irr === null) continue;
    const atIrr = f.flows.reduce((s, c) => s + c.net / Math.pow(1 + f.irr, c.year), 0);
    assert.ok(Math.abs(atIrr) < 1, `${p.name}: NPV at IRR was ${atIrr}`);
  }
});

test('NPV falls as the discount rate rises', () => {
  const p = structuredClone(PROJECTS[1]);
  const low = analyse(p).npv;
  p.financials.discountRate = 0.25;
  assert.ok(analyse(p).npv < low);
});

test('payback and cumulative cash agree', () => {
  for (const p of PROJECTS) {
    const f = analyse(p);
    if (f.paybackYears === null) continue;
    const yr = Math.ceil(f.paybackYears);
    assert.ok(f.flows[yr].cumulative >= 0, `${p.name} not positive by Y${yr}`);
    assert.ok(f.flows[yr - 1].cumulative < 0, `${p.name} was already positive before Y${yr}`);
  }
});

test('IRR returns null when there is no sign change', () => {
  const p = structuredClone(PROJECTS[0]);
  p.financials.reuseSavings = 0;
  p.financials.recyclingSavings = 0;
  p.financials.circularRevenue = 0;
  assert.equal(irr(cashFlows(p)), null);
});

test('Quick Intake produces a scoreable project from eight numbers', () => {
  const { project, notes } = expand({ ...QUICK_DEFAULTS, name: 'Test pouch' });
  const s = scoreProject(project).overall;
  assert.ok(s > 0 && s < 100);
  assert.ok(notes.length >= 8, 'every derived field must be disclosed');
  assert.equal(project.slug, 'test-pouch');
  const waste = project.waste.manufacturingWasteKg + project.waste.packagingWasteKg;
  const routed = project.waste.reusedInternallyKg + project.waste.recycledExternallyKg + project.waste.landfillKg;
  assert.ok(Math.abs(waste - routed) < 0.01, 'waste mass must balance');
});

test('recommendations report the score gain the engine actually produces', () => {
  for (const p of PROJECTS) {
    const before = scoreProject(p).overall;
    for (const r of recommendations(p)) {
      assert.ok(r.scoreGain > 0, `${p.name}: "${r.title}" claimed no gain`);
      assert.ok(before + r.scoreGain <= 100.01, `${p.name}: "${r.title}" would exceed 100`);
    }
  }
});

test('portfolio aggregate matches the per-project figures', () => {
  const agg = portfolio(PROJECTS);
  const mean = PROJECTS.reduce((s, p) => s + scoreProject(p).overall, 0) / PROJECTS.length;
  assert.ok(Math.abs(agg.avgScore - mean) < 0.11);
  assert.equal(agg.projects, PROJECTS.length);
  assert.equal(agg.products, PROJECTS.reduce((s, p) => s + p.products.length, 0));
});

test('project slugs are unique', () => {
  const slugs = PROJECTS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});
