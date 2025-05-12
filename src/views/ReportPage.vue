<script setup>
import { reactive, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import axios from 'axios'
import { generateLast12Months, generateMonthlyData,generateTopData  } from "@/utils/report-utils";
import { useReportStore } from '@/stores/reportStore'
const reportStore = useReportStore()

// Chart config
const timeCharts = reactive([
  { id: 'reservationChart', title: 'Reservation Trends', range: '12' },
  { id: 'revenueChart',     title: 'Revenue by Airline',   range: '12' },
  { id: 'delayChart',       title: 'Top Airlines with Delays', range: '12' }
])
const topCharts = reactive([
  { id: 'behaviorChart', title: 'Customer Booking Behavior',       top: '10' },
  { id: 'frequentChart', title: 'Top Customers', top: '10' },
  { id: 'cancelChart',   title: 'Airlines with Cancels > Avg',      top: '10' },
  { id: 'priceChart',    title: 'Most Expensive Ticket Price',     top: '10' }
])
const lastUpdatedMap = reactive({})

// API mappers
async function fetchTimeChart(chartId, months) {
  const map = {
    reservationChart: 'reservation-trends',
    revenueChart: 'revenue-trends',
    delayChart: 'delays-trends'
  }
  const res = await axios.get(`/api/report/${map[chartId]}?months=${months}`)
  return res.data
}
async function fetchTopChart(chartId, top) {
  const map = {
    behaviorChart: 'top-destinations',
    frequentChart: 'top-customers',
    cancelChart: 'cancel-heavy-airlines',
    priceChart: 'expensive-destinations'
  }
  const res = await axios.get(`/api/report/${map[chartId]}?top=${top}`)
  return res.data
}

// Chart rendering logic
async function renderChart(chartId) {
  const ctxEl = document.getElementById(chartId)
  if (!ctxEl) return
  const ctx = ctxEl.getContext('2d')
  if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy()

  const t = timeCharts.find(c => c.id === chartId)
  if (t) {
    const data = await fetchTimeChart(chartId, t.range)
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [{ label: t.title, data: data.map(d => d.value), tension: 0.4 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    })
    lastUpdatedMap[chartId] = new Date().toLocaleString()
    return
  }

  const p = topCharts.find(c => c.id === chartId)
  if (p) {
    const data = await fetchTopChart(chartId, p.top)
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(x => x.label),
        datasets: [{ label: p.title, data: data.map(x => x.value) }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    })
    lastUpdatedMap[chartId] = new Date().toLocaleString()
  }
}

function refresh(id) {
  renderChart(id)
}

// Initial load
onMounted(() => {
  timeCharts.forEach(c => renderChart(c.id))
  topCharts.forEach(c => renderChart(c.id))
})
</script>

<template>
  <div class="content report-page">
    <h2 class="section-title">Analytics & Reports</h2>

    <div class="report-grid">
      <!-- Time Charts -->
      <div v-for="chart in timeCharts" :key="chart.id" class="report-card">
        <div class="card-header">
          <h3>{{ chart.title }}</h3>
          <div>
            <select v-model="chart.range" @change="renderChart(chart.id)">
              <option value="3">3M</option>
              <option value="6">6M</option>
              <option value="12">12M</option>
            </select>
            <button @click="refresh(chart.id)">
              <font-awesome-icon icon="refresh" />
            </button>
          </div>
        </div>
        <div class="chart-canvas">
          <canvas :id="chart.id" width="400" height="200"></canvas>
        </div>
        <div class="updated-time">
          Last updated: {{ lastUpdatedMap[chart.id] || 'Not loaded yet' }}
        </div>
      </div>

      <!-- Top-N Charts -->
      <div v-for="chart in topCharts" :key="chart.id" class="report-card">
        <div class="card-header">
          <h3>{{ chart.title }}</h3>
          <div>
            <select v-model="chart.top" @change="renderChart(chart.id)">
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
            </select>
            <button @click="refresh(chart.id)">
              <font-awesome-icon icon="refresh" />
            </button>
          </div>
        </div>
        <div class="chart-canvas">
          <canvas :id="chart.id" width="400" height="200"></canvas>
        </div>
        <div class="updated-time">
          Last updated: {{ lastUpdatedMap[chart.id] || 'Not loaded yet' }}
        </div>
      </div>
    </div>
  </div>
</template>
  
  <style scoped>
  /* Only the Report-specific rules from layout.css */
  .content {  padding:40px; }
  .report-page { padding:30px; background:#f0f5f9; }
  .section-title { font-size:24px; margin-bottom:20px; color:#1d3a4c; }
  .report-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px,1fr)); gap:25px; }
  .report-card { background:white; border-radius:16px; padding:20px; box-shadow:0 6px 20px rgba(0,0,0,0.07); display:flex; flex-direction:column; justify-content:space-between; }
  .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .card-header h3 { font-size:16px; color:#2c4c65; font-weight:600; }
  .card-header select { margin-right:8px; appearance:none; background:#f8f9fb; border:1px solid #ccc; border-radius:8px; padding:6px 12px; font-size:14px; color:#2c4c65; font-weight:500; cursor:pointer; outline:none; transition:border 0.2s; }
  .card-header button { background:none; border:none; font-size:14px; color:#888; cursor:pointer; transition:color 0.2s ease; }
  .card-header button:hover { color:#f6b52e; }
  .chart-canvas { height:220px; position:relative; }
  .chart-canvas canvas { width:100%!important; height:100%!important; }
  .updated-time { font-size:12px; text-align:right; color:#888; }
  </style>
  