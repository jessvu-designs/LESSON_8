# Sunny Scoops — Daily Cart Dashboard

A small, story-driven sales dashboard for an artisanal ice cream cart business.

This project is **not** a generic admin or SaaS analytics template. It is intentionally
narrow, warm, and operational: a single screen the cart owner can glance at after a
shift (or partway through one) to understand how the day went and what to do next.

---

## Why this dashboard exists

The cart owner doesn't need pivot tables, cohort funnels, or 30 KPI tiles. They need
three answers, fast:

1. **How did we do today?**
2. **What sold and when?**
3. **What should we do next?**

Every section in the UI exists to answer one of those three questions. If a future
change does not clearly support one of them, it probably doesn't belong here.

---

## Product principles

These principles override "more features" by default. When in doubt, simplify.

- **Story, not surface area.** The page reads top-to-bottom like a short daily recap.
- **One focal point per row.** Avoid competing charts or duplicated metrics.
- **Calm and artisanal, not corporate.** Warm cream background, serif headlines, one
  restrained accent color (raspberry). No rainbow palettes or heavy chrome.
- **Operational, not analytical.** Copy is written for a cart operator
  ("Bring more waffle cones") not a marketing manager ("Optimize conversion funnel").
- **Decisions over completeness.** Hide, merge, or remove anything that isn't
  carrying its weight.

The full original brief (audience, tone, layout goals, and simplification rules)
lives in [`context/BRIEF.md`](context/BRIEF.md). Read it before any non-trivial
redesign.

---

## Information architecture

The dashboard has exactly six surfaces, in this order:

| # | Section            | Purpose                                                |
|---|--------------------|--------------------------------------------------------|
| 1 | Top bar            | Brand, current date/weather, period filter             |
| 2 | Header             | Title + one-sentence subtitle                          |
| 3 | KPI row (4 cards)  | Scoops Sold, Total Sales, Orders Served, Best Flavor   |
| 4 | Main chart         | Sales / Orders / Scoops by Hour (or Week, or Month)    |
| 5 | Top Flavors        | Compact ranked list with trend                         |
| 5 | Needs Attention    | Operational alerts (today only)                        |
| 6 | Tomorrow's Prep    | 2–3 next-step recommendations (today only)             |

**Period filter (`Today` / `This Month` / `Year to Date`)** lives in the top bar and
controls the KPIs, the main chart's buckets and axis label, and the trend comparison
copy ("vs yesterday" / "vs last month" / "vs prior year"). `Needs Attention` and
`Tomorrow's Prep` are intentionally hidden outside the `Today` view — they are daily
operations content, not aggregate analytics.

---

## Data model

All data is static and lives in [`src/data/metrics.json`](src/data/metrics.json).
There is no backend, no API, no auth. Reload the page to "re-fetch."

Shape (high level):

```jsonc
{
  "periods": {
    "today": { "label", "dateLabel", "trendLabel", "scoopLabelSuffix",
               "kpis": { "scoopsSold", "totalSales", "ordersServed" },
               "chart": { "axisLabel", "labels", "scoops", "sales", "orders" },
               "topFlavor": { "name", "scoops" } },
    "month": { /* same shape, weekly buckets */ },
    "ytd":   { /* same shape, monthly buckets */ }
  },
  "flavors":  [ { "name", "scoops", "trend" } ],   // Top Flavors panel
  "alerts":   [ "..." ],                            // Needs Attention (today only)
  "tomorrow": [ "..." ]                             // Tomorrow's Prep (today only)
}
```

Invariants worth preserving:

- Each period's `chart.sales` sums to its `kpis.totalSales.value`.
  Same for `orders` and `scoops`. The "Total today: …" subtitle under the chart
  surfaces this — if the math drifts, that label will visibly disagree with the KPI.
- `trendLabel` is the comparison phrase shown under each KPI; it is period-aware.
- `scoopLabelSuffix` ("today" / "this month" / "YTD") is used in the Best-Selling
  Flavor sub-label and the chart total label to keep tense consistent.

---

## Code layout

```
src/
  views/HomeView.vue          ← entire dashboard (template + script + scoped styles)
  components/BarChart.vue     ← thin vue-chartjs wrapper (only chart in active use)
  components/*.vue            ← legacy chart wrappers, currently unused
  data/metrics.json           ← all sample data
  router/index.ts             ← single-route router
  main.ts                     ← Vue + Vuetify + router bootstrap
  style.css                   ← global resets; forces cream background on v-app
context/BRIEF.md              ← original product brief (source of truth for intent)
```

`HomeView.vue` is intentionally a single file. The dashboard is small enough that
splitting it would add navigation cost without clarity. If it grows past a few
screens of scrollable code, split by **section** (KPIs, Chart, Flavors, Ops) — not
by atomic component.

---

## Visual system

Keep these constrained. Adding a new color or font is a design decision, not a bug fix.

- **Background:** `#fdf6ec` (warm cream) — applied to `body`, `.v-application`, top
  bar, and page container so the surface is continuous.
- **Cards:** `#ffffff` with a `1px` `#efe2cf` border, `12px` radius, no shadow.
- **Accent:** `#c63d5d` (raspberry) — used sparingly for the brand mark, KPI icons,
  chart bars, and selected toggle states.
- **Trend colors:** `#2e8a5f` up, `#b54a3b` down, `#8a6e5d` flat/muted.
- **Type:** Georgia serif for titles and KPI values; system sans for everything else.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Tech: Vue 3 (`<script setup>` + TypeScript), Vite, Vuetify 3, Chart.js via
vue-chartjs, vue-router. No state management library — `ref` + `computed` is enough.

---

## When making changes

Before adding anything, ask:

1. Which of the three questions does this serve?
2. Can it replace something that's already there instead of adding a row?
3. Does the copy sound like an ice cream cart operator, or like a SaaS dashboard?

If the answer to (1) is "none," push back on the change or move it behind the
period filter so it only appears in the context where it's useful.
