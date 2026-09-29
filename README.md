# Tokuma

Circular-economy intelligence platform for the Industry Innovation V.I.P. programme.
Scores projects and products on circularity, translates that score into
investor-grade financial metrics, and publishes a public transparency page behind
a QR code on every product.

```bash
npm install
npm run dev      # http://localhost:3010
npm test         # engine tests (13)
npm run build
```

## What it does

| Page | What it answers |
|---|---|
| `/dashboard` | Portfolio score, waste, savings, NPV, insights, recommendations |
| `/projects`, `/projects/[slug]` | Per-project analysis across seven tabs, with the full score audit trail |
| `/score` | The formula, the weights, the bands, and a worked example |
| `/financial` | NPV / IRR / ROI / payback / PI, plus live scenario modelling |
| `/waste` | Rule-based waste-pattern detection and value at stake |
| `/connections` | The seven clusters as an interactive ecosystem graph |
| `/add` | Quick Intake — eight numbers in, a scored project out |
| `/qr` | Every QR code, ready to print |
| `/p/[slug]`, `/p/[slug]/[product]` | The mobile-first public page a scan lands on |
| `/about` | Methodology, including what the model cannot tell you |

## The engine

Four pure modules, no framework dependencies, all covered by `test/engine.test.mjs`:

- **`src/lib/scoring.ts`** — the Circular Economy Score. Six pillars weighted
  20/20/20/15/15/10. Every pillar returns its input terms alongside its score, which
  is what makes the breakdown modal an audit trail rather than a re-implementation.
- **`src/lib/finance.ts`** — one cash-flow series per project; NPV, IRR (bisection),
  simple and discounted payback, ROI, profitability index and benefit–cost ratio are
  all derived from it, so they cannot disagree.
- **`src/lib/recommend.ts`** — recommendations re-run the scorer against a mutated
  clone, so the "+3.2 pts" shown to the user is the delta the engine actually produces.
- **`src/lib/intelligence.ts`** — waste-pattern rules behind a single
  `insights(projects) => Insight[]` contract, so a Python model can replace any rule
  without the UI changing.

### Designed for clients with almost no data

`src/lib/quick.ts` takes eight answers — annual material input, waste share, landfill
share, recycled content, product life, and three dollar figures — and expands them into
a fully scoreable project using sector benchmarks. **Every derived field is listed on the
review step with the basis it came from**, so nobody mistakes a benchmark for a measurement.
Those projects are tagged *Estimated data* throughout.

## Data

Runs on a seeded local store (`src/lib/store.tsx`) with no backend, so it is demoable
offline. `supabase/schema.sql` mirrors `src/lib/types.ts` exactly — tables, enums, RLS
policies and a `score_weights` table so the methodology version that produced a printed
QR code can always be recovered. Set the two variables in `.env.example` to switch over.

## Charts

The categorical palette in `src/lib/palette.ts` was validated against the bone chart
surface (`#F4F2EA`) for lightness band, chroma floor, adjacent- and all-pairs CVD separation, the
normal-vision floor and contrast. Four slots, assigned in fixed order, never cycled.

## Deployment

Next.js 14 App Router, TypeScript, Tailwind, Recharts. Deploys to Vercel as-is; add the
Supabase variables in the project settings if you want the backend.

## Limitations

This is a prototype methodology (v1.0). The weights are a defensible starting point, not
a standard; the score is not a life-cycle assessment; scores compare within a portfolio,
not across organisations; and the 12-month trend charts are modelled, not observed. All of
this is stated on `/about` and in the UI where it matters.
