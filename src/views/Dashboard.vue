<script setup>
import { Bar, Doughnut, Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  Filler,
  PointElement,
  LineElement,
  LinearScale,
  ArcElement,
} from "chart.js";

import { onMounted, computed } from "vue";
import { useDashboardStore } from "@/stores/dashboardStore";
import { getFlightDurationHours } from "@/utils/timeFunction";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler,
  PointElement,
  LineElement
);

const dashboardStore = useDashboardStore();

onMounted(async () => {
  await dashboardStore.loadDashboard();
});

const stats = computed(() => dashboardStore.stats);
const bookings = computed(() => dashboardStore.bookings);

// Chart Options
const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
};

const formatNumber = (num) => {
  if (typeof num !== 'number') return num;
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K'
  return num.toString()
}

const formatStatValue = (stat) => {
  const num = Number(stat.value);
  if (isNaN(num)) return stat.value; // For "Online" or text
  const formatted = formatNumber(num);
  return stat.title === 'Revenue' ? formatted + ' ฿' : formatted;
};

const pieChartOptions = {
  responsive: true,
  cutout: "70%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (tooltipItem) => {
          const label = tooltipItem.label || "";
          const value = tooltipItem.raw || 0;
          return `${label}: ${value}%`;
        },
      },
    },
  },
};

const flightsScheduleAnalysisOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: "index",
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8" },
    },
    y: {
      beginAtZero: true,
      suggestedMax: 10,
      ticks: {
        stepSize: 1,
        color: "#94a3b8",
      },
      grid: {
        color: "#e2e8f0",
      },
    },
  },
  plugins: {
    legend: { display: false },
  },
};

// Chart: Reservation Summary
const chartData = computed(() => dashboardStore.reservationChart || { labels: [], datasets: [] });
const updatedChartData = computed(() => {
  const formattedLabels = (chartData.value.labels || []).map(date =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  );

  return {
    ...chartData.value,
    labels: formattedLabels,
    datasets: [
      {
        ...chartData.value.datasets?.[0],
        backgroundColor: [
          ...Array(formattedLabels.length || 6).fill(
            getComputedStyle(document.documentElement).getPropertyValue("--c-light-blue")
          ),
          getComputedStyle(document.documentElement).getPropertyValue("--c-orange"),
        ],
      },
    ],
  };
});

// Chart: Popular Airlines
const pieChartData = computed(() => dashboardStore.popularAirlinesChart || { labels: [], datasets: [] });
const updatedPieChartData = computed(() => ({
  ...pieChartData.value,
  datasets: [
    {
      ...pieChartData.value.datasets?.[0],
      backgroundColor: [
        getComputedStyle(document.documentElement).getPropertyValue("--c-orange"),
        getComputedStyle(document.documentElement).getPropertyValue("--c-navy"),
        getComputedStyle(document.documentElement).getPropertyValue("--c-light-blue"),
      ],
    },
  ],
}));

// Gradient function
function createGradient(baseColor) {
  return (context) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, `${baseColor}00`);
    gradient.addColorStop(1, `${baseColor}99`);
    return gradient;
  };
}

// Chart: Flight Schedule
const flightsScheduleData = computed(() => dashboardStore.flightScheduleChart || { labels: [], datasets: [] });

const updatedFlightsScheduleAnalysisData = computed(() => {
  const ds = flightsScheduleData.value.datasets || [];
  const labels = flightsScheduleData.value.labels.map(d =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  );
  return {
    labels,
    datasets: ds.map((dataset, idx) => {
      const baseColor = getComputedStyle(document.documentElement)
        .getPropertyValue(idx === 0 ? "--c-orange" : "--c-light-blue")
        .trim();
      return {
        ...dataset,
        borderColor: baseColor,
        backgroundColor: createGradient(baseColor),
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      };
    }),
  };
});

const totalTickets = computed(() => {
  return chartData.value.datasets?.[0]?.data?.reduce((sum, val) => sum + val, 0) || 0;
});

const legendItemsPopularAirlines = computed(() => {
  const chart = updatedPieChartData.value;
  if (!chart || !chart.labels || !chart.datasets?.[0]?.data) return [];

  return chart.labels.map((label, index) => {
    return {
      name: label,
      percent: chart.datasets[0].data[index] + "%",
      airline: index === 0 ? "orange" : index === 1 ? "navy" : "blue",
    };
  });
});

/* Chart Options (optional - still use original config)
import {
  chartOptions,
  pieChartOptions,
  flightsScheduleAnalysisOptions,
} from "@/data/dashboard";*/

import { useRouter } from 'vue-router';
const router = useRouter();

const goToAirlineManagement = () => {
  router.push('/management/airline')
};

</script>

  <template>
    <div class="dashboard">
      <!-- Stats Cards -->
      <div class="stats-container">
        <div
          v-for="(stat, index) in stats"
          :key="index"
          :class="[stat.title.toLowerCase().replace(/\s+/g, '-') + '-stat-card']"
          class="stat-card"
        >
          <div class="curve-lines-top-left">
            <svg
              width="40"
              height="65"
              viewBox="0 0 40 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 64.3072C1.24399 56.7988 4.80632 40.1223 17.1036 33.4833C32.4753 25.1845 38.5752 10.958 38.5752 0.288208"
                stroke="#7B8080"
              />
            </svg>
            <svg
              width="53"
              height="105"
              viewBox="0 0 53 105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 103.999C1.32961 91.8354 6.14187 64.8194 22.754 54.0642C43.5193 40.6202 51.7594 17.5733 51.7594 0.288208"
                stroke="#7B8080"
              />
            </svg>
            <svg
              width="65"
              height="149"
              viewBox="0 0 65 151"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 150.093C1.41094 132.523 7.41064 93.4999 28.1219 77.9646C54.011 58.5455 64.2845 25.2556 64.2845 0.288208"
                stroke="#7B8080"
              />
            </svg>
          </div>

          <div class="curve-lines-bottom-right">
            <svg
              width="40"
              height="65"
              viewBox="0 0 40 65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 64.3072C1.24399 56.7988 4.80632 40.1223 17.1036 33.4833C32.4753 25.1845 38.5752 10.958 38.5752 0.288208"
                stroke="#7B8080"
              />
            </svg>
            <svg
              width="53"
              height="105"
              viewBox="0 0 53 105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 103.999C1.32961 91.8354 6.14187 64.8194 22.754 54.0642C43.5193 40.6202 51.7594 17.5733 51.7594 0.288208"
                stroke="#7B8080"
              />
            </svg>
            <svg
              width="65"
              height="149"
              viewBox="0 0 65 151"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 150.093C1.41094 132.523 7.41064 93.4999 28.1219 77.9646C54.011 58.5455 64.2845 25.2556 64.2845 0.288208"
                stroke="#7B8080"
              />
            </svg>
          </div>

          <div class="stat-content">
            <h3>{{ stat.title }}</h3>
            <div class="stat-value">{{ formatStatValue(stat) }}</div>
          </div>
          <div class="plane-icon" v-if="index !== stats.length - 1">
            <img
              src="/dashboard-pic/plane-type-flight.png"
              alt="Plane Type Flight"
            />
          </div>
          <div class="world-map-icon" v-else>
            <img src="/dashboard-pic/world-map.png" alt="World Map" />
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="bookings-section">
          <div class="section-header">
            <h2>All Bookings</h2>
            <p>Overview of Recent Reservations</p>
            <button class="more-btn" @click="goToAirlineManagement">MORE</button>
          </div>

          <div class="bookings-list">
            <div class="bookings-header">
              <div class="header-left">Flight</div>
              <div class="header-right">Detail</div>
            </div>
            <div
              v-for="(booking, index) in bookings"
              :key="index"
              class="booking-item"
            >
              <!-- Left Side: Flight Path -->
              <div class="booking-left">
                <div class="departure">
                  <img
                    src="/dashboard-pic/plane-booking-up.png"
                    alt="Plane Booking Up"
                  />
                  <div class="departure-info">
                    <div class="time">{{ booking.departure.time }}</div>
                    <div class="airport">{{ booking.departure.airport }}</div>
                  </div>
                </div>

                <div class="flight-line">
                  <p>{{ getFlightDurationHours(booking.flight) }} hrs</p>
                  <div class="line">
                    <img
                      src="/dashboard-pic/icons/plane-icon.png"
                      alt="Plane Icon"
                    />
                  </div>
                </div>

                <div class="arrival">
                  <img
                    src="/dashboard-pic/plane-booking-down.png"
                    alt="Plane Booking Down"
                  />
                  <div class="arrival-info">
                    <div class="time">{{ booking.arrival.time }}</div>
                    <div class="airport">{{ booking.arrival.airport }}</div>
                  </div>
                </div>
              </div>

              <!-- Right Side: Info -->
              <div class="booking-right">
                <div class="booking-airline">{{ booking.airline }}</div>
                <div class="booking-details">
                  <div class="date">
                    <img src="/dashboard-pic/icons/calendar-icon.png" alt="Calendar Icon" />
                    <p>{{ booking.date }}</p>
                  </div>
                  <div class="seats">
                    <img src="/dashboard-pic/icons/group-icon.png" alt="Group Icon" />
                    <p>{{ booking.seats }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="reservation-summary">
          <div class="section-header">
            <h2>Reservation Summary</h2>
          </div>

          <div class="summary-header">
            <div>Now</div>
            <div class="ticket-sold">
              {{ totalTickets }} <span>Tickets Sold</span>
            </div>
          </div>

          <Bar
            class="bar-chart"
            :data="updatedChartData"
            :options="chartOptions"
          />
        </div>
      </div>

      <div class="airlines-flight-main-content">
        <div class="popular-airlines">
          <div class="section-header">
            <h2>Popular Airlines</h2>
          </div>

          <div class="pie-chart-container">
            <div class="pie-chart-popular-airlines">
              <div class="pie-chart-warpper">
                <Doughnut
                  :data="updatedPieChartData"
                  :options="pieChartOptions"
                />
              </div>
            </div>
            <div class="legend-container">
              <div
                class="legend-item"
                v-for="(item, index) in legendItemsPopularAirlines"
                :key="index"
              >
                <div class="legend-left">
                  <span class="color-box" :class="item.airline"></span>
                  <span class="airline-name">{{ item.name }}</span>
                </div>
                <div class="percentage">{{ item.percent }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flights-schedule-container">
          <div class="flights-schedule-header">
            <div class="section-header">
              <h2>Flights Schedule</h2>
            </div>
            <div class="section-header-icon">
              <div class="icon-label">
                <span class="line-domestic"></span>
                <p>Departure</p>
              </div>
              <div class="icon-label">
                <span class="line-international"></span>
                <p>Arrival</p>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <Line
              class="flights-schedule-analysis"
              :data="updatedFlightsScheduleAnalysisData"
              :options="flightsScheduleAnalysisOptions"
            />
          </div>
        </div>
      </div>
    </div>
  </template>

<style scoped>

.dashboard {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 20px;
  padding: 20px;
  background-color: var(--color-background);
  color: var(--color-text);
}

/* ส่วนของ Stats Cards */
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 2fr;
  gap: 15px;
}

.stat-card {
  position: relative;
  border-radius: 10px;
  padding: 20px;
  color: var(--vt-c-white);
  overflow: visible;
  background-color: var(--c-navy);
  opacity: 1;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-out;
}

.stat-card:hover {
  opacity: 0.95;
  transform: scale(1.02);
  cursor: pointer;
}

.stat-card:nth-last-child(1) {
  display: flex;
  justify-content: space-between;
  z-index: 2;
}

.stat-card:nth-last-child(1) .curve-lines-top-left,
.stat-card:nth-last-child(1) .curve-lines-bottom-right {
  display: none;
}

.curve-lines-top-left {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  filter: sepia(100%);
  opacity: 0.5;
}

.curve-lines-top-left svg {
  position: absolute;
  top: -10px;
  left: -10px;
}

.curve-lines-bottom-right {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  filter: sepia(100%);
  opacity: 0.5;
}

.curve-lines-bottom-right svg {
  position: absolute;
  bottom: -10px;
  right: -10px;
}

.stat-content {
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 10px 0;
  z-index: 1;
}

.plane-icon img {
  position: absolute;
  right: -16px;
  bottom: -48px;
  width: 80%;
  opacity: 0.9;
  z-index: 1;
}

.world-map-icon img {
  width: 90%;
}

.completed-flights-stat-card {
  background-color: var(--c-dark-navy);
}

.active-flights-stat-card {
  background-color: var(--c-navy);
}

.canceled-flights-stat-card {
  background-color: var(--c-orange);
}

.total-flights-stat-card {
  background-color: var(--c-dark-navy);
}

/* ส่วนของ Main Content Area */
.main-content {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 20px;
  padding: 0;
}

/* ส่วนของ Bookings Section */
.section-header {
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-weight: 700;
  color: var(--c-navy-light);
}

.section-header p {
  color: var(--c-navy-green);
  font-weight: 400;
  font-size: 0.9rem;
}

.more-btn {
  position: absolute;
  color: var(--c-navy-light);
  right: 0;
  top: 10px;
  background-color: var(--vt-c-white);
  border: 1px solid var(--c-light-blue);
  padding: 5px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.more-btn:hover {
  background-color: var(--c-light-blue);
  color: var(--vt-c-white);
  transition: background-color 0.3s ease-in-out;
}

.bookings-section {
  background-color: var(--vt-c-white);
  border-radius: 10px;
  padding: 35px;
  overflow: visible;
  position: relative;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bookings-header {
  position: relative;
  color: var(--vt-c-gray);
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 30px;
  border-bottom: 3px dashed var(--c-soft-blue);
  padding-bottom: 10px;
}

.bookings-header::before,
.bookings-header::after {
  content: "";
  position: absolute;
  bottom: -13px;
  width: 25px;
  height: 25px;
  background-color: var(--c-soft-blue);
  border-radius: 50%;
  z-index: 1;
}

.bookings-header::before {
  left: -48px;
}

.bookings-header::after {
  right: -48px;
}

.booking-item {
  display: grid;
  position: relative;
  grid-template-columns: 3fr 1fr;
  gap: 30px;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 3px dashed var(--c-soft-blue);
}

.booking-item::before,
.booking-item::after {
  content: "";
  position: absolute;
  bottom: -13px;
  width: 25px;
  height: 25px;
  background-color: var(--c-soft-blue);
  border-radius: 50%;
}

.booking-item::before {
  left: -48px;
}

.booking-item::after {
  right: -48px;
}

.booking-item:last-child {
  border-bottom: none;
  padding-bottom: 10px;
}

.booking-item:last-child::before,
.booking-item:last-child::after {
  display: none;
}

.booking-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.booking-airline {
  font-weight: bold;
  color: var(--vt-c-gray-1);
}

.booking-details {
  font-family: "QuickSand", sans-serif;
  font-size: 0.9rem;
  color: var(--vt-c-gray-1);
  line-height: 1.4;
}

.date,
.seats {
  display: flex;
  align-items: center;
  gap: 5px;
}

.departure,
.arrival {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0;
  min-width: 120px;
}

.booking-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flight-line {
  flex: 1;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.flight-line p {
  font-size: 0.8rem;
  color: var(--vt-c-gray-2);
  margin: 0;
}

.line {
  position: relative;
  width: 100%;
  max-width: 200px;
  height: 2px;
  background-color: var(--vt-c-gray-3);
}

.line img {
  position: absolute;
  width: 20px;
  left: 0;
  color: var(--c-soft-blue);
  animation: plane-move 4s infinite linear;
}

@keyframes plane-move {
  0% {
    transform: translateY(-50%) translateX(0);
  }
  100% {
    transform: translateY(-50%) translateX(180px);
  }
}

.line::before {
  left: 0;
}

.line::after {
  right: 0;
}

.line::before,
.line::after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background-color: var(--vt-c-gray-4);
  border-radius: 50%;
}

.line::before {
  left: 0;
}

.line::after {
  right: 0;
}

.time {
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--c-navy-light);
}

.airport {
  font-size: 0.9rem;
  color: var(--vt-c-gray);
}

/* ส่วนของ Reservation Summary */
.reservation-summary {
  display: flex;
  flex-direction: column;
  background-color: var(--vt-c-white);
  border-radius: 10px;
  padding: 35px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--vt-c-gray);
  margin-bottom: 20px;
}

.ticket-sold {
  display: flex;
  align-items: baseline;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--c-orange);
  gap: 5px;
}

.ticket-sold span {
  font-size: 0.9rem;
  font-weight: normal;
  color: var(--vt-c-gray);
}

.chart-container {
  flex-grow: 1;
  position: relative;
  height: 200px;
  margin-top: 10px;
}

.bar-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

/* ส่วนของ  Popular Airlines , Flights Schedule */
.airlines-flight-main-content {
  display: grid;
  grid-template-columns: 1fr 1.55fr;
  gap: 20px;
}

.popular-airlines {
  background-color: var(--vt-c-white);
  border-radius: 10px;
  padding: 35px;
}

.pie-chart-warpper {
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pie-chart-popular-airlines {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.pie-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.legend-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.legend-left {
  display: flex;
  align-items: center;
}

.color-box {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 12px;
}

.piyanit {
  background-color: var(--c-orange);
}

.jaturon {
  background-color: var(--c-navy);
}

.others {
  background-color: var(--c-light-blue);
}

.airline-name {
  color: #444;
  font-size: 14px;
}

.percentage {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

/* ส่วนของ Flights Schedule */
.flights-schedule-container {
  display: flex;
  flex-direction: column;
  background-color: var(--vt-c-white);
  border-radius: 10px;
  padding: 35px;
}

.flights-schedule-header {
  display: flex;
  gap: 65px;
}
.flights-schedule-header .section-header {
  margin-bottom: 0;
}

.section-header-icon {
  display: flex;
  gap: 30px;
}

.icon-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.line-domestic {
  width: 45px;
  height: 6px;
  border-radius: 4px;
  background-color: var(--c-light-blue);
}

.line-international {
  width: 45px;
  height: 6px;
  border-radius: 4px;
  background-color: var(--c-orange);
}

.section-header-icon p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vt-c-gray);
}

.flights-schedule-analysis {
  position: relative;
  height: 500px;
  width: 100%;
  max-width:1000px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
}

@media (max-width: 1024px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-content,
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .plane-icon img {
    width: 60%;
  }
}
</style>
