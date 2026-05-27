<template>
  <v-app-bar color="surface" flat class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <v-icon icon="mdi-ice-cream" size="24" class="brand-icon" />
        <span class="brand-name">Sunny Scoops</span>
      </div>
      <div class="topbar-right">
        <span class="topbar-date">{{ period.dateLabel }}</span>
        <v-select
          v-model="periodKey"
          :items="periodOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
          class="period-filter"
        />
      </div>
    </div>
  </v-app-bar>

  <v-container fluid class="page">

    <!-- Header -->
    <header class="header">
      <h1 class="page-title">Today at the Cart</h1>
      <p class="page-sub">A quick look at sales, flavors, and what to prep next.</p>
    </header>

    <!-- KPIs -->
    <v-row align="stretch" class="mb-10">
      <v-col v-for="card in kpiCards" :key="card.label" cols="12" sm="6" md="3">
        <v-card class="kpi" elevation="0">
          <div class="kpi-label">{{ card.label }}</div>
          <div class="kpi-value">{{ card.value }}</div>
          <div v-if="card.trend !== null" class="kpi-trend" :class="trendClass(card.trend)">
            <v-icon size="14" :icon="card.trend > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'" />
            {{ card.trend > 0 ? '+' : '' }}{{ card.trend }}% {{ period.trendLabel }}
          </div>
          <div v-else class="kpi-trend kpi-trend--muted">{{ card.sub }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main chart -->
    <v-card class="panel mb-10" elevation="0">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">{{ chartTitle }}</h2>
          <div class="panel-sub">{{ chartTotalLabel }}</div>
        </div>
        <v-btn-toggle
          v-model="hourlyMetric"
          mandatory density="compact" variant="outlined" color="primary"
        >
          <v-btn value="sales">Sales</v-btn>
          <v-btn value="orders">Orders</v-btn>
          <v-btn value="scoops">Scoops</v-btn>
        </v-btn-toggle>
      </div>
      <div class="chart-wrap">
        <BarChart :chart-data="hourlyChartData" :chart-options="barOptions" />
      </div>
    </v-card>

    <v-row>
      <!-- Top Flavors -->
      <v-col cols="12" md="6">
        <v-card class="panel" elevation="0">
          <h2 class="panel-title mb-4">Top Flavors</h2>
          <div class="flavor-list">
            <div v-for="(f, i) in data.flavors" :key="f.name" class="flavor-row">
              <span class="flavor-rank">{{ i + 1 }}</span>
              <span class="flavor-name">{{ f.name }}</span>
              <span class="flavor-scoops">{{ f.scoops }} scoops</span>
              <span class="flavor-trend" :class="trendClass(f.trend)">
                {{ f.trend > 0 ? '+' : '' }}{{ f.trend }}%
              </span>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Needs Attention (today only) -->
      <v-col v-if="periodKey === 'today'" cols="12" md="6">
        <v-card class="panel" elevation="0">
          <h2 class="panel-title mb-4">Needs Attention</h2>
          <ul class="bullet-list">
            <li v-for="a in data.alerts" :key="a">
              <v-icon icon="mdi-alert-circle-outline" size="16" class="bullet-icon bullet-icon--alert" />
              <span>{{ a }}</span>
            </li>
          </ul>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tomorrow's Prep (today only) -->
    <v-card v-if="periodKey === 'today'" class="panel mt-6" elevation="0">
      <h2 class="panel-title mb-4">Tomorrow's Prep</h2>
      <ul class="bullet-list">
        <li v-for="t in data.tomorrow" :key="t">
          <v-icon icon="mdi-check-circle-outline" size="16" class="bullet-icon bullet-icon--ok" />
          <span>{{ t }}</span>
        </li>
      </ul>
    </v-card>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BarChart from '../components/BarChart.vue'
import data from '../data/metrics.json'

type PeriodKey = 'today' | 'month' | 'ytd'
type Metric = 'sales' | 'orders' | 'scoops'

const periodKey = ref<PeriodKey>('today')
const hourlyMetric = ref<Metric>('sales')

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'month', label: 'This Month' },
  { value: 'ytd',   label: 'Year to Date' },
]

const period = computed(() => data.periods[periodKey.value])

function pctChange(curr: number, prev: number) {
  if (!prev) return 0
  return +(((curr - prev) / prev) * 100).toFixed(1)
}

const kpiCards = computed(() => {
  const p = period.value
  const k = p.kpis
  return [
    { label: 'Scoops Sold',         value: k.scoopsSold.value.toLocaleString(),         trend: pctChange(k.scoopsSold.value, k.scoopsSold.prev),     sub: '' },
    { label: 'Total Sales',         value: '$' + k.totalSales.value.toLocaleString(),   trend: pctChange(k.totalSales.value, k.totalSales.prev),     sub: '' },
    { label: 'Orders Served',       value: k.ordersServed.value.toLocaleString(),       trend: pctChange(k.ordersServed.value, k.ordersServed.prev), sub: '' },
    { label: 'Best-Selling Flavor', value: p.topFlavor.name,                            trend: null as number | null,                                sub: `${p.topFlavor.scoops.toLocaleString()} scoops ${p.scoopLabelSuffix}` },
  ]
})

const chartTitle = computed(() => {
  const axis = period.value.chart.axisLabel
  return {
    sales:  `Sales by ${axis}`,
    orders: `Orders by ${axis}`,
    scoops: `Scoops by ${axis}`,
  }[hourlyMetric.value]
})

const chartTotalLabel = computed(() => {
  const series = (period.value.chart as any)[hourlyMetric.value] as number[]
  const total = series.reduce((s, v) => s + v, 0)
  const suffix = period.value.scoopLabelSuffix
  if (hourlyMetric.value === 'sales')  return `Total ${suffix}: $${total.toLocaleString()}`
  if (hourlyMetric.value === 'orders') return `Total ${suffix}: ${total.toLocaleString()} orders`
  return `Total ${suffix}: ${total.toLocaleString()} scoops`
})

const hourlyChartData = computed(() => {
  const c = period.value.chart
  const key = hourlyMetric.value
  return {
    labels: c.labels,
    datasets: [{
      label: key,
      data: (c as any)[key] as number[],
      backgroundColor: '#e8a3b4',
      borderColor: '#c63d5d',
      borderRadius: 6,
      maxBarThickness: 32,
    }],
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#3a2418',
      titleColor: '#fff7ee',
      bodyColor: '#fff7ee',
      padding: 10,
    },
  },
  scales: {
    y: { beginAtZero: true, ticks: { color: '#8a6e5d' }, grid: { color: 'rgba(138,110,93,0.10)' } },
    x: { ticks: { color: '#8a6e5d' }, grid: { display: false } },
  },
}

function trendClass(t: number) {
  return t > 0 ? 'text-up' : t < 0 ? 'text-down' : 'text-flat'
}
</script>

<style scoped>
.page {
  background: #fdf6ec;
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 32px 64px;
  color: #3a2418;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

/* Top bar */
.topbar { background: #fdf6ec !important; border-bottom: 1px solid #efe2cf; }
.topbar-inner {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 32px;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-icon { color: #c63d5d; }
.brand-name { font-weight: 600; font-size: 1rem; color: #3a2418; letter-spacing: 0.2px; }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.topbar-date { font-size: 0.85rem; color: #8a6e5d; }
.period-filter { max-width: 160px; min-width: 140px; }
:deep(.period-filter .v-field) {
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.85rem;
}

/* Header */
.header { margin-bottom: 32px; }
.page-title {
  font-family: 'Georgia', serif;
  font-size: 2rem; font-weight: 600;
  color: #3a2418; margin: 0 0 6px;
  letter-spacing: -0.3px;
}
.page-sub { color: #8a6e5d; font-size: 0.95rem; margin: 0; }

/* Cards (consistent) */
.kpi, .panel {
  background: #ffffff !important;
  border: 1px solid #efe2cf;
  border-radius: 12px !important;
  padding: 20px 22px;
  height: 100%;
}
.panel { padding: 24px; }

/* KPI */
.kpi { display: flex; flex-direction: column; gap: 6px; }
.kpi-label {
  font-size: 0.78rem; color: #8a6e5d;
  letter-spacing: 0.04em; font-weight: 500;
}
.kpi-value {
  font-family: 'Georgia', serif;
  font-size: 1.75rem; font-weight: 600;
  color: #3a2418; line-height: 1.15;
}
.kpi-trend {
  font-size: 0.78rem; font-weight: 500;
  display: flex; align-items: center; justify-content: center; gap: 3px;
  margin-top: auto;
  padding-top: 12px;
  text-align: center;
}
.kpi-trend--muted { color: #8a6e5d; font-weight: 400; }
.panel-sub {
  font-size: 0.8rem; color: #8a6e5d; margin-top: 4px;
}
.text-up   { color: #2e8a5f; }
.text-down { color: #b54a3b; }
.text-flat { color: #8a6e5d; }

/* Panel */
.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
}
.panel-title {
  font-family: 'Georgia', serif;
  font-size: 1.15rem; font-weight: 600;
  color: #3a2418; margin: 0;
}
.chart-wrap { height: 300px; }

/* Flavors */
.flavor-list { display: flex; flex-direction: column; }
.flavor-row {
  display: grid;
  grid-template-columns: 24px 1fr auto auto;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #f4ead8;
  font-size: 0.93rem;
}
.flavor-row:last-child { border-bottom: none; }
.flavor-rank { color: #c9b394; font-weight: 600; font-size: 0.85rem; }
.flavor-name { color: #3a2418; font-weight: 500; }
.flavor-scoops { color: #8a6e5d; font-size: 0.85rem; }
.flavor-trend { font-weight: 600; font-size: 0.82rem; min-width: 50px; text-align: right; }

/* Bullet lists (alerts + prep) */
.bullet-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 14px;
}
.bullet-list li {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 0.92rem; color: #4a3528; line-height: 1.45;
}
.bullet-icon { margin-top: 2px; flex-shrink: 0; }
.bullet-icon--alert { color: #b54a3b; }
.bullet-icon--ok { color: #2e8a5f; }

@media (max-width: 600px) {
  .page { padding: 24px 16px 48px; }
  .topbar-inner { padding: 0 16px; }
  .page-title { font-size: 1.6rem; }
}
</style>
