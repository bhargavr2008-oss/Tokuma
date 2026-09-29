'use client';

/**
 * Hero visual: material flow drawn as a closed loop, one node per lifecycle
 * stage. It sits inside the forest band, so it is drawn in bone and sage.
 */
export function LoopDiagram({ stages }: { stages: string[] }) {
  const size = 420;
  const c = size / 2;
  const r = 146;
  const pts = stages.map((s, i) => {
    const a = (i / stages.length) * Math.PI * 2 - Math.PI / 2;
    return { s, x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  });

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <svg
        viewBox={`0 0 ${size} ${size}`} className="w-full" role="img"
        aria-label={`Circular lifecycle loop: ${stages.join(' to ')}, returning to the start`}
      >
        <defs>
          <radialGradient id="loop-glow">
            <stop offset="0%" stopColor="#A4B391" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#A4B391" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={c} cy={c} r={r + 48} fill="url(#loop-glow)" />
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(244,242,234,.16)" strokeWidth="1" />

        {/* a single arc travelling the loop, so the cycle reads as continuous */}
        <circle
          cx={c} cy={c} r={r} fill="none" stroke="#A4B391" strokeWidth="2"
          strokeLinecap="round" strokeDasharray="70 848"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-918" dur="9s" repeatCount="indefinite" />
        </circle>

        {pts.map((p) => (
          <g key={p.s}>
            <circle cx={p.x} cy={p.y} r="5.5" fill="#162118" stroke="#C3CDB4" strokeWidth="1.75" />
            <text
              x={p.x} y={p.y + (p.y < c ? -16 : 25)} textAnchor="middle"
              fill="rgba(244,242,234,.72)" fontSize="12" letterSpacing="0.02em"
            >
              {p.s}
            </text>
          </g>
        ))}

        <text
          x={c} y={c - 4} textAnchor="middle" fill="#F4F2EA"
          fontSize="21" fontFamily="var(--font-serif), Georgia, serif"
        >
          Tokuma
        </text>
        <text
          x={c} y={c + 19} textAnchor="middle" fill="rgba(244,242,234,.5)"
          fontSize="10.5" letterSpacing="0.16em"
        >
          ANALYSING EACH STAGE
        </text>
      </svg>
    </div>
  );
}
