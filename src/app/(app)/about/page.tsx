import Link from 'next/link';
import { PILLARS, BANDS } from '@/lib/scoring';
import { BENCHMARKS } from '@/lib/quick';
import { Card, SectionTitle } from '@/components/ui';

export default function About() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Methodology</h1>
        <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
          What the score measures, how the money is calculated, and — just as importantly — what this
          model cannot tell you.
        </p>
      </header>

      <Card>
        <SectionTitle title="What a circular economy is" />
        <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
          A linear economy takes a material, makes something, and disposes of it. A circular economy
          keeps that material in use: narrowing the loop by using less, slowing it by making products
          last and be repairable, closing it by recovering material at end of life, and regenerating
          by shifting inputs and energy to renewable sources. The score below is organised around
          exactly those moves, which is why each recommendation names the strategy it belongs to.
        </p>
      </Card>

      <Card>
        <SectionTitle title="The score" sub="Six pillars, weights summing to 1.00, maximum 100." />
        <div className="rounded-xl border border-line bg-bone-100 p-4 text-center text-sm">
          <code className="text-[var(--ink-secondary)]">
            Score = Σ<sub>i</sub> ( pillar<sub>i</sub> × weight<sub>i</sub> )
          </code>
        </div>
        <dl className="mt-4 divide-y divide-line text-sm">
          {PILLARS.map((p) => (
            <div key={p.id} className="flex items-baseline justify-between gap-4 py-3">
              <dt>{p.label}</dt>
              <dd className="shrink-0 font-semibold tabular-nums text-sage-700">{(p.weight * 100).toFixed(0)}%</dd>
            </div>
          ))}
        </dl>
        <Link href="/score" className="btn-ghost mt-4 w-full text-xs">See a worked example with every input</Link>
      </Card>

      <Card>
        <SectionTitle title="Performance bands" />
        <dl className="divide-y divide-line text-sm">
          {[...BANDS].reverse().map((b, i, arr) => (
            <div key={b.label} className="flex items-baseline justify-between py-2.5">
              <dt style={{ color: b.color }}>{b.label}</dt>
              <dd className="tabular-nums text-[var(--ink-secondary)]">
                {b.min}–{i === arr.length - 1 ? 100 : arr[i + 1].min - 1}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <SectionTitle title="How the financial impact is calculated" />
        <div className="space-y-3 text-sm leading-relaxed text-[var(--ink-secondary)]">
          <p>
            One cash-flow series per project is the single source of truth. Year 0 carries the
            circular investment as a negative flow; each subsequent year carries the annual circular
            benefit, defined as reuse savings plus recycling savings plus revenue from recovered
            material.
          </p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li><b className="text-[var(--ink-primary)]">NPV</b> — each year&apos;s net flow discounted at the project rate and summed.</li>
            <li><b className="text-[var(--ink-primary)]">IRR</b> — the discount rate at which NPV is zero, solved by bisection over [−0.95, 10]. Reported as n/a when no sign change exists.</li>
            <li><b className="text-[var(--ink-primary)]">Payback</b> — the year the cumulative position crosses zero, interpolated within the year. Reported both undiscounted and discounted.</li>
            <li><b className="text-[var(--ink-primary)]">ROI</b> — total benefit over the horizon, less the investment, divided by the investment.</li>
            <li><b className="text-[var(--ink-primary)]">Profitability index</b> — present value of benefits divided by the investment. Above 1.00 clears the hurdle.</li>
          </ul>
          <p>
            Because every metric reads the same array, they cannot disagree. Change a lever on the
            Financial Impact page and all five re-solve together.
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Working with very little data" sub="The intake form asks for eight numbers." />
        <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
          Most clients do not have a material-flow inventory. Quick Intake therefore asks only for
          what a site can read off an invoice or estimate in a minute, and fills the remaining ~35
          fields from a sector benchmark. Every derived field is listed on the review step with the
          basis it came from, so the assumptions are visible before the project is created and can be
          replaced field by field as real measurements arrive.
        </p>
        <dl className="mt-4 divide-y divide-line text-sm">
          {Object.entries(BENCHMARKS).map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt>{v.label}</dt>
              <dd className="shrink-0 text-xs tabular-nums text-[var(--ink-muted)]">
                {v.carbonIntensity} tCO₂e/t · ${v.recoveryValuePerKg}/kg recovered · {(v.discountRate * 100).toFixed(0)}% rate
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <SectionTitle title="Limitations" sub="Read this before quoting a score externally." />
        <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
          <li>
            This is a <b className="text-[var(--ink-primary)]">prototype methodology (v1.0)</b>. The
            weights are a defensible starting point, not a standard. They are configuration values and
            are expected to be replaced by validated academic or industry weights.
          </li>
          <li>
            The score is <b className="text-[var(--ink-primary)]">not a life-cycle assessment</b>. It
            does not model transport, use-phase impact or supply-chain tiers, and it is not a
            substitute for an ISO 14040/14044 study.
          </li>
          <li>
            Scores are <b className="text-[var(--ink-primary)]">comparable within this portfolio</b>,
            not across organisations. A software project and a packaging project score on the same
            scale but are not competing on it.
          </li>
          <li>
            Where a project was created through Quick Intake, roughly 80% of its fields are sector
            benchmarks rather than measurements. Those projects are tagged <i>Estimated data</i>
            throughout the platform.
          </li>
          <li>
            The 12-month trend charts are <b className="text-[var(--ink-primary)]">modelled</b>,
            reconstructed backwards from the current measured state. They are labelled as such and
            are replaced by observations as reporting periods close.
          </li>
          <li>
            Waste Intelligence findings are currently rule-based. They are deterministic and
            explainable, but they do not learn from history yet.
          </li>
        </ul>
      </Card>
    </div>
  );
}
