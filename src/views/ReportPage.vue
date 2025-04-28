<template>
    <div class="content report-page">
      <!-- Page Title -->
      <h2 class="section-title">Analytics & Reports</h2>
  
      <!-- Cards Grid -->
      <div class="report-grid">
        <!-- Time-Based Charts -->
        <div
          v-for="chart in timeCharts"
          :key="chart.id"
          class="report-card"
        >
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
        <div
          v-for="chart in topCharts"
          :key="chart.id"
          class="report-card"
        >
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
  
  <script setup>
  import { reactive, onMounted } from 'vue'
  import Chart from 'chart.js/auto'
  
  // Bring in your existing report-generation logic (move these into src/utils or inline if you prefer)
  function generateLast12Months() {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i)
      return d.toLocaleString('default', { month: 'short', year: 'numeric' })
    })
  }
  function generateMonthlyData(count, max) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * max))
  }
  function generateTopData(count, label) {
    return Array.from({ length: count }, (_, i) => ({
      label: `${label} ${i + 1}`, value: Math.floor(Math.random() * 1000)
    }))
  }
  
  // Prepare your data sets
  const months = generateLast12Months()
  const fullData = {
    reservation: generateMonthlyData(12, 100),
    revenue:     generateMonthlyData(12, 5000),
    delay:       generateMonthlyData(12, 70),
    bookingBehavior: generateTopData(20, 'Destination'),
    frequentCustomers: generateTopData(20, 'Customer'),
    cancellations: generateTopData(20, 'Flight'),
    expensive: generateTopData(20, 'Destination')
  }
  
  // Reactive chart configurations
  const timeCharts = reactive([
    { id: 'reservationChart', title: 'Reservation Trends', range: '12' },
    { id: 'revenueChart',     title: 'Revenue by Airline',   range: '12' },
    { id: 'delayChart',       title: 'Top Airlines with Delays', range: '12' }
  ])
  const topCharts = reactive([
    { id: 'behaviorChart', title: 'Customer Booking Behavior',       top: '10' },
    { id: 'frequentChart', title: 'Customers w/ More Reservations', top: '10' },
    { id: 'cancelChart',   title: 'Flights with Cancels > Avg',      top: '10' },
    { id: 'priceChart',    title: 'Most Expensive Ticket Price',     top: '10' }
  ])
  const lastUpdatedMap = reactive({})
  
  // Chart rendering logic
  function renderChart(chartId) {
    const ctxEl = document.getElementById(chartId)
    if (!ctxEl) return
    const ctx = ctxEl.getContext('2d')
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy()
  
    // Time-series charts
    const t = timeCharts.find(c => c.id === chartId)
    if (t) {
      const map = {
        reservationChart: 'reservation',
        revenueChart:     'revenue',
        delayChart:       'delay'
      }
      const dataArr = fullData[ map[chartId] ]
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: months.slice(-t.range),
          datasets: [{
            label: t.title,
            data: dataArr.slice(-t.range),
            tension: 0.4
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      })
      return
    }
  
    // Top-N charts
    const p = topCharts.find(c => c.id === chartId)
    if (p) {
      const map = {
        behaviorChart:   'bookingBehavior',
        frequentChart:   'frequentCustomers',
        cancelChart:     'cancellations',
        priceChart:      'expensive'
      }
      const arr = [...fullData[ map[chartId] ]]
        .sort((a, b) => b.value - a.value)
        .slice(0, p.top)
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: arr.map(x => x.label),
          datasets: [{ label: p.title, data: arr.map(x => x.value) }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
      })
    }
  }
  
  function refresh(id) {
    renderChart(id)
    lastUpdatedMap[id] = new Date().toLocaleString()
  }
  
  // Draw on mount
  onMounted(() => {
    timeCharts.forEach(c => renderChart(c.id))
    topCharts.forEach(c => renderChart(c.id))
    // initialize updated times
    ;[...timeCharts, ...topCharts].forEach(c => lastUpdatedMap[c.id] = null)
  })
  </script>
  
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
  