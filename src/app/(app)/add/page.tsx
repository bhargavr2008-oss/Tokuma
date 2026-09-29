'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { CLUSTERS } from '@/lib/data';
import { BENCHMARKS, QUICK_DEFAULTS, expand, type QuickInput, type SectorId } from '@/lib/quick';
import { scoreProject, band } from '@/lib/scoring';
import { analyse, money, pct } from '@/lib/finance';
import type { ProjectStatus, ClusterId, Project } from '@/lib/types';
import { Card, SectionTitle, ScoreRing, Tag } from '@/components/ui';
import { Upload, Check, Info } from 'lucide-react';

const STEPS = ['Identity', 'Materials & waste', 'Money', 'Review'] as const;

export default function Add() {
  const { add } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [q, setQ] = useState<QuickInput>(QUICK_DEFAULTS);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { project, notes } = useMemo(() => expand(q), [q]);
  const score = scoreProject(project);
  const fin = analyse(project);

  const set = <K extends keyof QuickInput>(k: K, v: QuickInput[K]) => setQ((s) => ({ ...s, [k]: v }));
  const canAdvance = step > 0 || q.name.trim().length > 1;

  const submit = () => {
    add(project);
    router.push(`/projects/${project.slug}`);
  };

  const onImport = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const rows: Partial<QuickInput>[] = file.name.endsWith('.json')
        ? (() => { const j = JSON.parse(text); return Array.isArray(j) ? j : [j]; })()
        : parseCsv(text);
      if (!rows.length) throw new Error('No rows found in the file.');
      let n = 0;
      rows.forEach((row) => {
        const merged = { ...QUICK_DEFAULTS, ...row } as QuickInput;
        if (!merged.name) return;
        add(expand(merged).project);
        n++;
      });
      if (n === 0) throw new Error('No row had a "name" column.');
      router.push('/projects');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add a Project</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-secondary)]">
            Eight numbers is all this needs. Everything else is filled from a sector benchmark and
            listed openly on the review step, so you always know which figures are yours and which
            are assumptions waiting to be replaced.
          </p>
        </div>
        <div>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs"><Upload size={14} /> Import CSV / JSON</button>
          <input ref={fileRef} type="file" accept=".csv,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
        </div>
      </header>

      {importError && <p className="rounded-xl border border-clay-500/40 bg-clay-500/10 px-4 py-3 text-sm text-clay-600">{importError}</p>}

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              onClick={() => i <= step + 1 && canAdvance && setStep(i)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                i === step ? 'bg-sage-500/15 text-sage-700 ring-1 ring-sage-600/30'
                  : i < step ? 'text-sage-700/70 hover:bg-bone-100' : 'text-[var(--ink-muted)]'
              }`}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full border border-current text-[10px]">
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          {step === 0 && (
            <div className="space-y-4">
              <SectionTitle title="What is this project?" />
              <Field label="Project name" required>
                <input className="field" value={q.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Compostable retail pouch" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company / team">
                  <input className="field" value={q.organization} onChange={(e) => set('organization', e.target.value)} placeholder="e.g. I2CE Lab" />
                </Field>
                <Field label="Cluster">
                  <select className="field" value={q.cluster} onChange={(e) => set('cluster', e.target.value as ClusterId)}>
                    {CLUSTERS.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}
                  </select>
                </Field>
                <Field label="Sector" hint="Chooses the benchmark set used to fill everything you don't have.">
                  <select className="field" value={q.sector} onChange={(e) => set('sector', e.target.value as SectorId)}>
                    {Object.entries(BENCHMARKS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="field" value={q.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
                    {['Concept', 'Prototype', 'Pilot', 'Scaling', 'Production'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea className="field min-h-[88px]" value={q.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="One or two sentences on what it is and what it replaces." />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <SectionTitle title="Materials and waste" sub="Rough annual figures are fine — the review step will tell you which assumptions they drive." />
              <Num label="Material used per year" unit="kg" value={q.annualMaterialKg} onChange={(v) => set('annualMaterialKg', v)} step={100}
                hint="If you only know tonnes, multiply by 1,000." />
              <Range label="Roughly what share of that becomes waste?" unit="%" value={q.wastePctOfInput} onChange={(v) => set('wastePctOfInput', v)} max={60}
                hint="Trim, offcuts, rejects and start-up scrap. Most manufacturing sites land between 5% and 20%." />
              <Range label="Of that waste, how much goes to landfill?" unit="%" value={q.landfillShareOfWaste} onChange={(v) => set('landfillShareOfWaste', v)}
                hint="Anything you pay someone to take away and never see again." />
              <Range label="Recycled content of your input material" unit="%" value={q.recycledContentPct} onChange={(v) => set('recycledContentPct', v)}
                hint="If your supplier does not state it, leave it at zero — an honest zero scores better than a guess that gets audited." />
              <Num label="Expected product life" unit="years" value={q.productLifeYears} onChange={(v) => set('productLifeYears', v)} step={1}
                hint="For single-use packaging, use 1." />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle title="Money" sub="Three annual figures. Everything on the investor dashboard is derived from these." />
              <Num label="Annual material spend" unit="$" value={q.annualMaterialSpend} onChange={(v) => set('annualMaterialSpend', v)} step={10000} />
              <Num label="Annual waste disposal spend" unit="$" value={q.wasteDisposalSpend} onChange={(v) => set('wasteDisposalSpend', v)} step={1000}
                hint="Haulage plus tipping fees. Check one invoice and multiply." />
              <Num label="Capital available for circular changes" unit="$" value={q.investmentBudget} onChange={(v) => set('investmentBudget', v)} step={10000}
                hint="Equipment, tooling, qualification work. This is the denominator of every return figure." />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle title="Review" sub="What you entered, and every figure the platform derived from it." />
              <div>
                <div className="label mb-2">Your inputs</div>
                <Rows rows={[
                  ['Project', q.name || '—'],
                  ['Sector benchmark', BENCHMARKS[q.sector].label],
                  ['Material input', `${q.annualMaterialKg.toLocaleString()} kg/yr`],
                  ['Waste share of input', `${q.wastePctOfInput}%`],
                  ['Landfill share of waste', `${q.landfillShareOfWaste}%`],
                  ['Recycled content', `${q.recycledContentPct}%`],
                  ['Product life', `${q.productLifeYears} years`],
                  ['Material spend', money(q.annualMaterialSpend)],
                  ['Disposal spend', money(q.wasteDisposalSpend)],
                  ['Capital available', money(q.investmentBudget)],
                ]} />
              </div>
              <div>
                <div className="label mb-2 flex items-center gap-1.5"><Info size={12} /> Derived — replace these as real data arrives</div>
                <ul className="divide-y divide-line text-xs">
                  {notes.map((n) => (
                    <li key={n.field} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                      <span className="text-[var(--ink-secondary)]">{n.field}</span>
                      <span className="tabular-nums">{n.value}</span>
                      <span className="w-full text-[11px] text-[var(--ink-muted)]">{n.basis}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={submit} disabled={!q.name.trim()} className="btn-primary w-full disabled:opacity-40">
                Create project and generate score
              </button>
            </div>
          )}

          {step < 3 && (
            <div className="mt-6 flex justify-between gap-3 border-t border-line pt-5">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost text-xs disabled:opacity-30">Back</button>
              <button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} className="btn-primary text-xs disabled:opacity-40">Continue</button>
            </div>
          )}
        </Card>

        <aside className="space-y-4">
          <Card className="flex flex-col items-center">
            <div className="label mb-3 self-start">Live preview</div>
            <ScoreRing score={score.overall} size={150} stroke={11} />
            <div className="mt-4 w-full space-y-2">
              {score.pillars.map((p) => (
                <div key={p.id} className="flex items-baseline justify-between text-[11px]">
                  <span className="text-[var(--ink-secondary)]">{p.label}</span>
                  <span className="tabular-nums" style={{ color: band(p.score).color }}>{p.score.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="label mb-3">Investor view</div>
            <Rows rows={[
              ['NPV', money(fin.npv)],
              ['IRR', pct(fin.irr, 0)],
              ['Payback', fin.paybackYears ? `${fin.paybackYears.toFixed(1)} yrs` : 'Beyond horizon'],
              ['Annual benefit', money(fin.annualBenefit)],
              ['Capital required', money(fin.investment)],
            ]} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag color={band(score.overall).color}>{band(score.overall).label}</Tag>
              <Tag>Estimated data</Tag>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="ml-1 text-clay-600">*</span>}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">{hint}</p>}
    </label>
  );
}

function Num({ label, unit, value, onChange, step = 1, hint }: {
  label: string; unit: string; value: number; onChange: (v: number) => void; step?: number; hint?: string;
}) {
  return (
    <Field label={`${label} (${unit})`} hint={hint}>
      <input type="number" className="field" value={value} step={step} min={0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} />
    </Field>
  );
}

function Range({ label, unit, value, onChange, max = 100, hint }: {
  label: string; unit: string; value: number; onChange: (v: number) => void; max?: number; hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-sage-700">{value}{unit}</span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-sage-600" aria-label={label} />
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-muted)]">{hint}</p>}
    </div>
  );
}

function Rows({ rows }: { rows: (readonly [string, string])[] }) {
  return (
    <dl className="divide-y divide-line text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-[var(--ink-secondary)]">{k}</dt>
          <dd className="shrink-0 tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Minimal CSV reader: header row, comma separated, numeric coercion. */
function parseCsv(text: string): Partial<QuickInput>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const raw = (cells[i] ?? '').trim();
      const n = Number(raw);
      row[h] = raw !== '' && !Number.isNaN(n) ? n : raw;
    });
    return row as Partial<QuickInput>;
  });
}
