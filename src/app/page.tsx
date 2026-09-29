import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CLUSTERS } from '@/lib/data';
import { LoopDiagram } from '@/components/loop';

const STAGES = ['Materials', 'Manufacturing', 'Product', 'Use', 'Recovery', 'Reuse'];

const STEPS = [
  ['Submit', 'Eight numbers off an invoice. No material-flow inventory required.'],
  ['Score', 'Six weighted pillars produce one number, with every input on show.'],
  ['Value', 'The same data becomes NPV, IRR, payback and capital requirement.'],
  ['Publish', 'A QR code on the product opens a public transparency page.'],
];

export default function Home() {
  return (
    <div className="bg-bone-100">
      {/* ---------------------------------------------------------------- hero */}
      <section className="band-dark relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'radial-gradient(120% 90% at 50% -10%, #3C5540 0%, transparent 55%), radial-gradient(80% 60% at 85% 110%, #2A3D2C 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <header className="flex items-center justify-between py-6">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[22px] leading-none">Tokuma</span>
              <span className="h-1.5 w-1.5 rounded-full bg-sage-400" aria-hidden />
            </div>
            <nav className="flex items-center gap-2 text-[13px]">
              <Link href="/about" className="btn border border-bone-100/25 text-bone-100 hover:bg-bone-100/10">
                Methodology
              </Link>
              <Link href="/dashboard" className="btn bg-sage-500 text-forest-900 hover:bg-sage-400">
                Explore Dashboard
              </Link>
            </nav>
          </header>

          <div className="grid items-center gap-14 pb-4 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:pt-24">
            <div>
              <p className="label-plain text-sage-400">[ Industry Innovation · Circular Economy · V.I.P. ]</p>
              <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.06] tracking-[-0.01em] sm:text-[3.4rem] lg:text-[4rem]">
                Measure circularity.
                <br />
                Discover value.
                <br />
                Design the <em className="italic text-sage-300">next lifecycle</em>.
              </h1>
              <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-bone-100/70">
                Tokuma connects material flows, waste reduction, lifecycle performance and
                financial impact into one circular-economy platform — and translates every one of
                them into the metrics an investment committee actually asks for.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/dashboard" className="btn bg-bone-100 text-forest-900 hover:bg-bone-200">
                  Explore Dashboard <ArrowRight size={15} />
                </Link>
                <Link href="/add" className="btn border border-bone-100/25 text-bone-100 hover:bg-bone-100/10">
                  Add a Project
                </Link>
              </div>
            </div>
            <LoopDiagram stages={STAGES} />
          </div>

          <dl className="mt-16 grid gap-8 border-t border-bone-100/15 py-9 sm:grid-cols-3">
            {[
              ['Eight numbers', 'is all the intake form asks a client for'],
              ['NPV · IRR · PI', 'derived from a single cash-flow series'],
              ['One QR code', 'per product, opening a public transparency page'],
            ].map(([a, b]) => (
              <div key={a}>
                <dt className="font-serif text-[1.6rem] leading-none text-sage-300">{a}</dt>
                <dd className="mt-2.5 text-[13px] leading-relaxed text-bone-100/60">{b}</dd>
              </div>
            ))}
          </dl>

          <div className="overflow-hidden pb-2 pt-4">
            <div className="wordmark whitespace-nowrap text-center">Tokuma</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- process */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="label-plain">[ A simple application process ]</p>
        <h2 className="mt-4 max-w-2xl font-serif text-[2rem] leading-tight sm:text-[2.5rem]">
          Grounded in <em className="italic text-sage-600">clearer standards</em>
        </h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="bg-paper p-7">
              <span className="label-plain">[ 0{i + 1} ]</span>
              <h3 className="mt-4 font-serif text-[1.35rem] leading-none">{title}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--ink-secondary)]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ clusters */}
      <section className="border-y border-line bg-bone-200">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label-plain">[ Seven clusters, one model ]</p>
              <h2 className="mt-4 max-w-xl font-serif text-[2rem] leading-tight sm:text-[2.5rem]">
                Every cluster publishes into the <em className="italic text-sage-600">same system model</em>
              </h2>
            </div>
            <Link href="/connections" className="btn-ghost">View the ecosystem <ArrowRight size={15} /></Link>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {CLUSTERS.map((c, i) => (
              <Link key={c.id} href="/connections" className="group bg-paper p-6 transition hover:bg-bone-50">
                <span className="label-plain">[ {String(i + 1).padStart(2, '0')} ]</span>
                <h3 className="mt-3.5 font-serif text-[1.2rem] leading-tight">{c.short}</h3>
                <p className="mt-2.5 line-clamp-4 text-[12.5px] leading-relaxed text-[var(--ink-secondary)]">
                  {c.purpose}
                </p>
              </Link>
            ))}
            <div className="bg-bone-100 p-6">
              <span className="label-plain">[ + ]</span>
              <h3 className="mt-3.5 font-serif text-[1.2rem] leading-tight">Your project</h3>
              <Link href="/add" className="mt-3 inline-flex text-[12.5px] text-sage-700 underline underline-offset-4">
                Add it in four steps
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- cta */}
      <section className="band-dark">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <p className="label-plain text-sage-400">[ Ready when you are ]</p>
          <h2 className="mx-auto mt-5 max-w-2xl font-serif text-[2.2rem] leading-tight sm:text-[2.8rem]">
            Make your circular values <em className="italic text-sage-300">visible</em>
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="btn bg-bone-100 text-forest-900 hover:bg-bone-200">Explore Dashboard</Link>
            <Link href="/about" className="btn border border-bone-100/25 text-bone-100 hover:bg-bone-100/10">View Methodology</Link>
          </div>
          <p className="mt-14 border-t border-bone-100/15 pt-6 text-[11px] leading-relaxed text-bone-100/45">
            Tokuma — prototype circular-economy intelligence platform. Scores are produced by a
            configurable methodology (v1.0) and are not a certification.
          </p>
        </div>
      </section>
    </div>
  );
}
