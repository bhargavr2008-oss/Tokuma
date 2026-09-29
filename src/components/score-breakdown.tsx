'use client';

import { useState } from 'react';
import type { Project } from '@/lib/types';
import { scoreProject, band } from '@/lib/scoring';
import { Bar } from './ui';
import { ChevronDown } from 'lucide-react';

/** The audit trail: every pillar, its weight, its terms and the arithmetic. */
export function ScoreBreakdown({ project }: { project: Project }) {
  const s = scoreProject(project);
  const [open, setOpen] = useState<string | null>(s.pillars[0]?.id ?? null);

  return (
    <div>
      <div className="mb-4 rounded-xl border border-line bg-bone-100 p-4 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-[var(--ink-secondary)]">Overall Circular Economy Score</span>
          <span className="text-xl font-semibold tabular-nums" style={{ color: band(s.overall).color }}>
            {s.overall.toFixed(1)} / 100
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {s.pillars.map((p) => {
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="overflow-hidden rounded-xl border border-line bg-bone-100">
              <button
                onClick={() => setOpen(isOpen ? null : p.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-bone-100"
              >
                <ChevronDown size={15} className={`shrink-0 text-[var(--ink-muted)] transition ${isOpen ? 'rotate-180' : ''}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.label}</span>
                <span className="hidden w-28 sm:block"><Bar value={p.score} color={band(p.score).color} height={5} /></span>
                <span className="w-36 shrink-0 text-right text-xs tabular-nums text-[var(--ink-secondary)]">
                  {p.score.toFixed(1)} × {(p.weight * 100).toFixed(0)}% ={' '}
                  <span className="font-semibold text-[var(--ink-primary)]">{p.contribution.toFixed(1)}</span>
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-line px-4 py-3">
                  <table className="w-full text-xs">
                    <caption className="sr-only">Input terms for {p.label}</caption>
                    <thead>
                      <tr className="text-left text-[var(--ink-muted)]">
                        <th className="pb-2 font-medium">Input</th>
                        <th className="pb-2 text-right font-medium">Value</th>
                        <th className="pb-2 text-right font-medium">Weight in pillar</th>
                        <th className="pb-2 text-right font-medium">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {p.terms.map((t) => (
                        <tr key={t.label}>
                          <td className="py-2 text-[var(--ink-secondary)]">{t.label}</td>
                          <td className="py-2 text-right tabular-nums">{t.value.toFixed(1)}{t.unit === '%' ? '%' : ''}</td>
                          <td className="py-2 text-right tabular-nums text-[var(--ink-muted)]">{(t.weight * 100).toFixed(0)}%</td>
                          <td className="py-2 text-right tabular-nums">{(t.value * t.weight).toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr className="font-semibold">
                        <td className="pt-2.5">Pillar score</td>
                        <td className="pt-2.5 text-right tabular-nums" colSpan={3}>{p.score.toFixed(1)} / 100</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-baseline justify-between rounded-xl border border-sage-600/35 bg-sage-500/12 px-4 py-3">
        <span className="text-sm font-medium">TOTAL</span>
        <span className="text-lg font-semibold tabular-nums">{s.overall.toFixed(1)}</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--ink-muted)]">
        Every number above is produced by the same engine that renders the score ring. Weights are
        configuration values (methodology v1.0), not fixed constants — see the Methodology page.
      </p>
    </div>
  );
}
