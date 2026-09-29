'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Project, Product } from '@/lib/types';
import { scoreProject, band } from '@/lib/scoring';
import { ScoreRing, Bar } from './ui';
import { ChevronDown } from 'lucide-react';
import { CAT } from '@/lib/palette';

/**
 * The page a QR scan lands on. Mobile-first, and deliberately free of the
 * financial detail — nothing here is commercially sensitive.
 */
export function PublicView({ project, product }: { project: Project; product?: Product }) {
  const s = scoreProject(project);
  const b = band(s.overall);
  const waste = project.waste.manufacturingWasteKg + project.waste.packagingWasteKg;
  const diverted = project.waste.reusedInternallyKg + project.waste.recycledExternallyKg;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 pb-16 pt-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-[19px] leading-none">Tokuma</span>
          <span className="h-1.5 w-1.5 rounded-full bg-sage-500" aria-hidden />
        </Link>
        <span className="pill">Verified transparency page</span>
      </header>

      <section className="mt-10 text-center">
        <h1 className="font-serif text-[28px] leading-[1.15]">{product?.name ?? project.name}</h1>
        <p className="mt-2 text-sm text-[var(--ink-secondary)]">{project.organization} · {project.category}</p>
        <div className="mt-7 flex justify-center"><ScoreRing score={s.overall} size={200} stroke={13} /></div>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--ink-secondary)]">
          This product scores <b style={{ color: b.color }}>{s.overall.toFixed(1)} out of 100</b> on the
          Tokuma Circular Economy Score — a weighted measure of what it is made of, what it wastes,
          how long it lasts and what happens to it at the end.
        </p>
      </section>

      <section className="mt-9 grid grid-cols-2 gap-3">
        <Tile label="Recycled content" value={`${project.materials.recycledPct}%`} />
        <Tile label="Bio-based content" value={`${project.materials.bioBasedPct}%`} />
        <Tile label="Waste diverted from landfill" value={waste ? `${((diverted / waste) * 100).toFixed(0)}%` : 'n/a'} />
        <Tile label="Designed service life" value={`${project.lifecycle.expectedLifeYears} yr${project.lifecycle.expectedLifeYears === 1 ? '' : 's'}`} />
      </section>

      <Accordion title="How this score is calculated">
        <ul className="space-y-2.5">
          {s.pillars.map((p) => (
            <li key={p.id}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-[var(--ink-secondary)]">{p.label}</span>
                <span className="tabular-nums">{p.score.toFixed(0)} × {(p.weight * 100).toFixed(0)}% = <b>{p.contribution.toFixed(1)}</b></span>
              </div>
              <div className="mt-1.5"><Bar value={p.score} color={band(p.score).color} height={5} /></div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between rounded-xl border border-sage-600/35 bg-sage-500/12 px-3.5 py-2.5 text-sm">
          <span className="font-medium">Total</span>
          <span className="font-semibold tabular-nums">{s.overall.toFixed(1)} / 100</span>
        </div>
      </Accordion>

      <Accordion title="What happens at end of life?">
        <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
          {product?.endOfLife ??
            `${project.lifecycle.recoveryRatePct}% of this project's output is recovered at end of life.` +
            (project.lifecycle.takeBackProgram
              ? ' A take-back programme is active — return the product through it rather than binning it.'
              : ' No take-back programme is active yet; recover through your local recycling route.')}
        </p>
        <dl className="mt-4 divide-y divide-line text-xs">
          <Row k="Recovery rate" v={`${project.lifecycle.recoveryRatePct}%`} />
          <Row k="Take-back programme" v={project.lifecycle.takeBackProgram ? 'Active' : 'Not yet available'} />
          <Row k="Recyclable material share" v={`${project.materials.recyclablePct}%`} />
        </dl>
      </Accordion>

      <Accordion title="How to reuse or repair this product">
        <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
          {product?.repairNotes ??
            `Repairability is rated ${project.lifecycle.repairability}/100 and modularity ${project.lifecycle.modularity}/100.`}
        </p>
      </Accordion>

      <Accordion title="Materials and environment">
        <dl className="divide-y divide-line text-xs">
          <Row k="Primary material" v={project.materials.primaryMaterial} />
          <Row k="Recycled content" v={`${project.materials.recycledPct}%`} />
          <Row k="Renewable content" v={`${project.materials.renewablePct}%`} />
          <Row k="Bio-based content" v={`${project.materials.bioBasedPct}%`} />
          <Row k="Carbon reduction" v={`${project.environmental.carbonReductionTco2e.toFixed(0)} tCO₂e/yr`} />
          <Row k="Renewable energy share" v={`${project.environmental.renewableEnergyPct}%`} />
        </dl>
      </Accordion>

      <section className="mt-8 rounded-2xl border border-line bg-bone-100 p-4">
        <div className="text-xs font-medium">About this project</div>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-secondary)]">{project.description}</p>
        <p className="mt-3 text-[11px] text-[var(--ink-muted)]">
          Published by {project.organization}. Data last updated {project.updatedAt}. Score produced by
          Tokuma methodology v1.0 — a configurable prototype framework, not a third-party certification.
        </p>
      </section>

      <footer className="mt-10 text-center">
        <Link href="/about" className="text-xs text-[var(--ink-muted)] underline-offset-4 hover:text-sage-700 hover:underline">
          Read the full methodology
        </Link>
      </footer>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-4 text-center">
      <div className="font-serif text-[1.6rem] leading-none tabular-nums" style={{ color: CAT[0] }}>{value}</div>
      <div className="mt-1.5 text-[11px] leading-snug text-[var(--ink-muted)]">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[var(--ink-secondary)]">{k}</dt>
      <dd className="shrink-0 tabular-nums">{v}</dd>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-line bg-bone-100">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-serif text-[15px] transition hover:bg-bone-100">
        {title}
        <ChevronDown size={16} className={`shrink-0 text-[var(--ink-muted)] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-line px-4 py-4">{children}</div>}
    </section>
  );
}
