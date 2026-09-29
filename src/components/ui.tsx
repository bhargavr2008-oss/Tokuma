'use client';

import { useEffect, useRef, useState } from 'react';
import { band } from '@/lib/scoring';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-[1.25rem] leading-tight">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-[var(--ink-secondary)]">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Counts up to `value` once the element scrolls into view. */
export function Counter({ value, decimals = 0, prefix = '', suffix = '' }: {
  value: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(value); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - start) / 900));
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span ref={ref}>{prefix}{n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

export function Stat({ label, value, sub, accent, decimals = 0, prefix = '', suffix = '' }: {
  label: string; value: number; sub?: string; accent?: string; decimals?: number; prefix?: string; suffix?: string;
}) {
  return (
    <div className="glass glass-hover p-4">
      <div className="label">{label}</div>
      <div className="mt-2.5 font-serif text-[1.9rem] leading-none tabular-nums" style={{ color: accent ?? 'var(--ink-primary)' }}>
        <Counter value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
      {sub && <div className="mt-1 text-xs text-[var(--ink-muted)]">{sub}</div>}
    </div>
  );
}

export function ScoreRing({ score, size = 168, stroke = 12, label = true }: {
  score: number; size?: number; stroke?: number; label?: boolean;
}) {
  const b = band(score);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    const id = setTimeout(() => setOffset(circ * (1 - score / 100)), 60);
    return () => clearTimeout(id);
  }, [score, circ]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Circular economy score ${score} out of 100, ${b.label}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E3DFD0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={b.color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-serif text-[2.1rem] leading-none tabular-nums">
          <Counter value={score} decimals={1} />
        </div>
        {label && (
          <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: b.color }}>
            {b.label}
          </div>
        )}
      </div>
    </div>
  );
}

export function Bar({ value, color = '#3F7A32', height = 6 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-bone-200" style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-forest-900/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`glass my-10 w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-[1.3rem] leading-tight">{title}</h3>
          <button onClick={onClose} className="btn-ghost px-3 py-1.5 text-xs" aria-label="Close">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="pill" style={color ? { color, borderColor: `${color}40`, background: `${color}14` } : undefined}>
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}
