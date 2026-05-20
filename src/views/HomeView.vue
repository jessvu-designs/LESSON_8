.v-container {
  max-width: 100% !important;
}
.v-container, .v-container > * {
  background: transparent !important;
  box-shadow: none !important;
}
.v-container:before,
.v-container:after {
  background: transparent !important;
  box-shadow: none !important;
}
.v-container, .v-row, .v-col {
  background: transparent !important;
  box-shadow: none !important;
}
<template>
  <v-app-bar color="primary" dark flat>
    <v-toolbar-title><div style="padding-left: 24px;">My Dashboard</div></v-toolbar-title>
    <v-spacer />
    <v-select
      v-model="selectedMonth"
      :items="monthOptions"
      label="Month"
      variant="underlined"
      style="max-width: 160px; margin-right: 32px;"
      hide-details
    />
  </v-app-bar>

  <v-container fluid class="py-6">
    <v-row class="mb-4" align="stretch">
      <v-col cols="12" sm="6" md="3" v-for="card in summaryCards" :key="card.label">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h6 text-uppercase mb-1">{{ card.label }}</div>
              <div class="text-h5 font-weight-bold">{{ card.value }}</div>
            </div>
            <v-icon :color="card.trend > 0 ? 'success' : card.trend < 0 ? 'error' : 'grey'">
              {{ card.trend > 0 ? 'mdi-arrow-up' : card.trend < 0 ? 'mdi-arrow-down' : 'mdi-minus' }}
            </v-icon>
          </div>
          <div class="caption" :class="card.trend > 0 ? 'text-success' : card.trend < 0 ? 'text-error' : ''">
            {{ card.trend > 0 ? '+' : '' }}{{ card.trend }}% from prev
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4" align="stretch">
      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="pb-2">Monthly Revenue</v-card-title>
          <BarChart :chart-data="revenueChartData" :chart-options="barChartOptions" />
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="pb-2">Visitors Over Time</v-card-title>
          <VisitorsLineChart :chart-data="visitorsChartData" :chart-options="lineChartOptions" />
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="pb-2">Conversions Trend</v-card-title>
          <ConversionsAreaChart :chart-data="conversionsChartData" :chart-options="areaChartOptions" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BarChart from '../components/BarChart.vue'
import VisitorsLineChart from '../components/VisitorsLineChart.vue'
import ConversionsAreaChart from '../components/ConversionsAreaChart.vue'
import metrics from '../data/metrics.json'

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]
const monthOptions = ['All', ...months]
const selectedMonth = ref('All')



function getPrevMonthIndex(idx: number) {
  return idx > 0 ? idx - 1 : null
}

const summaryCards = computed(() => {
  if (selectedMonth.value === 'All') {
    // Yearly totals/averages
    const totalRevenue = metrics.reduce((a, b) => a + b.revenue, 0)
    const totalVisitors = metrics.reduce((a, b) => a + b.visitors, 0)
    const avgConversions = metrics.reduce((a, b) => a + b.conversions, 0) / metrics.length
    const totalOrders = metrics.reduce((a, b) => a + b.orders, 0)
    return [
      { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, trend: getTrend(metrics, 'revenue') },
      { label: 'Visitors', value: totalVisitors.toLocaleString(), trend: getTrend(metrics, 'visitors') },
      { label: 'Conversions', value: `${avgConversions.toFixed(2)}%`, trend: getTrend(metrics, 'conversions') },
      { label: 'Orders', value: totalOrders.toLocaleString(), trend: getTrend(metrics, 'orders') },
    ]
  } else {
    const idx = months.indexOf(selectedMonth.value)
    const monthData = metrics[idx]
    const prevIdx = getPrevMonthIndex(idx)
    const prevData = prevIdx !== null ? metrics[prevIdx] : null
    return [
      {
        label: 'Revenue',
        value: `$${monthData.revenue.toLocaleString()}`,
        trend: prevData ? percentChange(monthData.revenue, prevData.revenue) : 0
      },
      {
        label: 'Visitors',
        value: monthData.visitors.toLocaleString(),
        trend: prevData ? percentChange(monthData.visitors, prevData.visitors) : 0
      },
      {
        label: 'Conversions',
        value: `${monthData.conversions.toFixed(2)}%`,
        trend: prevData ? percentChange(monthData.conversions, prevData.conversions) : 0
      },
      {
        label: 'Orders',
        value: monthData.orders.toLocaleString(),
        trend: prevData ? percentChange(monthData.orders, prevData.orders) : 0
      },
    ]
  }
})

function percentChange(current: number, prev: number) {
  if (prev === 0) return 0
  return +(((current - prev) / prev) * 100).toFixed(1)
}

function getTrend(data: any[], key: string) {
  // Compare last month to previous month
  if (data.length < 2) return 0
  return percentChange(data[data.length - 1][key], data[data.length - 2][key])
}

// Chart Data
const revenueChartData = computed(() => {
  return {
    labels: selectedMonth.value === 'All' ? months : [selectedMonth.value],
    datasets: [
      {
        label: 'Revenue',
        backgroundColor: '#1976D2',
        data: selectedMonth.value === 'All'
          ? metrics.map(m => m.revenue)
          : [metrics[months.indexOf(selectedMonth.value)].revenue],
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  }
})

const visitorsChartData = computed(() => {
  return {
    labels: selectedMonth.value === 'All' ? months : [selectedMonth.value],
    datasets: [
      {
        label: 'Visitors',
        borderColor: '#43a047',
        backgroundColor: 'rgba(67,160,71,0.15)',
        data: selectedMonth.value === 'All'
          ? metrics.map(m => m.visitors)
          : [metrics[months.indexOf(selectedMonth.value)].visitors],
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
    ],
  }
})

const conversionsChartData = computed(() => {
  return {
    labels: selectedMonth.value === 'All' ? months : [selectedMonth.value],
    datasets: [
      {
        label: 'Conversions (%)',
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255,152,0,0.15)',
        data: selectedMonth.value === 'All'
          ? metrics.map(m => m.conversions)
          : [metrics[months.indexOf(selectedMonth.value)].conversions],
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
    ],
  }
})

const barChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#b0b0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    x: {
      ticks: { color: '#b0b0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
}

const lineChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#b0b0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    x: {
      ticks: { color: '#b0b0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
}

const areaChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#b0b0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    x: {
      ticks: { color: '#b0b0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
}
</script>

<style scoped>
body, html, #app, .v-application {
  background: #16171d !important;
}
.v-application {
  background: #16171d;
}
.v-card {
  background: #18181c;
  color: #fff;
}
.v-app-bar {
  background: #18181c !important;
}
</style>
.text-success {
  color: #00e676 !important; /* Accessible green on dark */
}
.text-error {
  color: #ff1744 !important; /* Accessible red on dark */
}
.caption {
  font-size: 0.95rem;
  opacity: 0.85;
  color: #e0e0e0;
}
.v-toolbar-title {
  margin-left: 0 !important;
  padding-left: 0 !important;
  position: static !important;
  text-align: left !important;
}
.v-container {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
