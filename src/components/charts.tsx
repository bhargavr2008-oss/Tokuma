'use client';

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, ReferenceLine,
} from 'recharts';
import { CAT, GRID, INK } from '@/lib/palette';

const axis = { stroke: 'rgba(22,33,24,.18)', tick: { fill: INK.muted, fontSize: 11 }, tickLine: false };

function TipBox({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-card">
      <div className="mb-1.5 font-medium text-[var(--ink-primary)]">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />
          <span className="text-[var(--ink-secondary)]">{p.name}</span>
          <span className="ml-auto tabular-nums text-[var(--ink-primary)]">
            {fmt ? fmt(p.value) : Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
        </div>
      ))}
    </div>
  );
}

const legendStyle = { fontSize: 11, color: INK.secondary, paddingTop: 8 };

export function TrendChart({ data, series, xKey = 'label', fmt, height = 240 }: {
  data: any[]; series: { key: string; name: string }[]; xKey?: string; fmt?: (v: number) => string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axis} axisLine={{ stroke: GRID }} />
        <YAxis {...axis} axisLine={false} width={48} />
        <Tooltip content={<TipBox fmt={fmt} />} cursor={{ stroke: 'rgba(22,33,24,.28)', strokeDasharray: '3 3' }} />
        {series.length > 1 && <Legend wrapperStyle={legendStyle} iconType="plainline" iconSize={14} />}
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name}
            stroke={CAT[i % CAT.length]} strokeWidth={2} dot={{ r: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#F4F2EA' }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaTrend({ data, dataKey, name, fmt, height = 200 }: {
  data: any[]; dataKey: string; name: string; fmt?: (v: number) => string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CAT[0]} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CAT[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} axisLine={{ stroke: GRID }} />
        <YAxis {...axis} axisLine={false} width={48} />
        <Tooltip content={<TipBox fmt={fmt} />} cursor={{ stroke: 'rgba(22,33,24,.28)', strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey={dataKey} name={name} stroke={CAT[0]} strokeWidth={2} fill={`url(#g-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StackedBars({ data, series, fmt, height = 260, layout = 'horizontal' }: {
  data: any[]; series: { key: string; name: string }[]; fmt?: (v: number) => string;
  height?: number; layout?: 'horizontal' | 'vertical';
}) {
  const vertical = layout === 'vertical';
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout} margin={{ top: 8, right: 16, left: vertical ? 8 : 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={vertical} horizontal={!vertical} />
        {vertical ? <XAxis type="number" {...axis} axisLine={false} /> : <XAxis dataKey="label" {...axis} axisLine={{ stroke: GRID }} />}
        {vertical ? <YAxis type="category" dataKey="label" {...axis} axisLine={false} width={132} /> : <YAxis {...axis} axisLine={false} width={48} />}
        <Tooltip content={<TipBox fmt={fmt} />} cursor={{ fill: 'rgba(22,33,24,.05)' }} />
        {series.length > 1 && <Legend wrapperStyle={legendStyle} iconType="square" iconSize={10} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a"
            fill={CAT[i % CAT.length]} stroke="#F4F2EA" strokeWidth={2}
            radius={i === series.length - 1 ? (vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0}
            maxBarSize={vertical ? 22 : 44} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Cumulative cash position with the break-even crossing marked. */
export function CashflowChart({ flows, height = 260 }: { flows: { year: number; cumulative: number; net: number }[]; height?: number }) {
  const data = flows.map((f) => ({ label: `Y${f.year}`, cumulative: f.cumulative, net: f.net }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...axis} axisLine={{ stroke: GRID }} />
        <YAxis {...axis} axisLine={false} width={56}
          tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`)} />
        <Tooltip content={<TipBox fmt={(v: number) => `$${Math.round(v).toLocaleString()}`} />} cursor={{ fill: 'rgba(22,33,24,.05)' }} />
        <ReferenceLine y={0} stroke="rgba(22,33,24,.35)" />
        <Bar dataKey="cumulative" name="Cumulative cash position" stroke="#F4F2EA" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={44}>
          {data.map((d, i) => <Cell key={i} fill={d.cumulative >= 0 ? CAT[0] : '#95492A'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PillarRadar({ data, height = 280 }: { data: { label: string; score: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="label" tick={{ fill: INK.secondary, fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: INK.muted, fontSize: 9 }} axisLine={false} />
        <Radar name="Pillar score" dataKey="score" stroke={CAT[0]} strokeWidth={2} fill={CAT[0]} fillOpacity={0.22} />
        <Tooltip content={<TipBox />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function RankedBars({ data, fmt, height = 260, color = CAT[0], tickFormatter }: {
  data: { label: string; value: number }[]; fmt?: (v: number) => string; height?: number;
  color?: string; tickFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axis} axisLine={false} tickFormatter={tickFormatter} />
        <YAxis type="category" dataKey="label" {...axis} axisLine={false} width={150} />
        <Tooltip content={<TipBox fmt={fmt} />} cursor={{ fill: 'rgba(22,33,24,.05)' }} />
        <Bar dataKey="value" name="Value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
