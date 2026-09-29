'use client';

import Link from 'next/link';
import type { Project } from '@/lib/types';
import { scoreProject, band } from '@/lib/scoring';
import { analyse, money } from '@/lib/finance';
import { Bar, Tag } from './ui';
import { QrCode, ArrowRight } from 'lucide-react';

export function ProjectCard({ project, onQr }: { project: Project; onQr?: (p: Project) => void }) {
  const score = scoreProject(project).overall;
  const b = band(score);
  const fin = analyse(project);
  const diverted = project.waste.reusedInternallyKg + project.waste.recycledExternallyKg;

  return (
    <article className="glass glass-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{project.name}</h3>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">{project.category} · {project.organization}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-semibold tabular-nums" style={{ color: b.color }}>{score.toFixed(1)}</div>
          <div className="text-[10px] text-[var(--ink-muted)]">/ 100</div>
        </div>
      </div>

      <div className="mt-3"><Bar value={score} color={b.color} /></div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--ink-secondary)]">{project.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag color={b.color}>{b.label}</Tag>
        <Tag>{project.status}</Tag>
        {diverted > 0 && <Tag>{Math.round(diverted).toLocaleString()} kg diverted</Tag>}
        <Tag color={fin.npv >= 0 ? '#3F7A32' : '#95492A'}>NPV {money(fin.npv)}</Tag>
      </div>

      <div className="mt-4 flex gap-2 pt-1">
        <Link href={`/projects/${project.slug}`} className="btn-primary flex-1 text-xs">
          View Analysis <ArrowRight size={14} />
        </Link>
        {onQr && (
          <button onClick={() => onQr(project)} className="btn-ghost px-3 text-xs" aria-label={`Generate QR code for ${project.name}`}>
            <QrCode size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
