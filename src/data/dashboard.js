export const stats = [
  { title: "Completed Flights", value: 99 },
  { title: "Active Flights", value: 99 },
  { title: "Canceled Flights", value: 99 },
  { title: "Total Flights", value: 999 },
];

export const bookings = [
  {
    airline: "Piyavit Airlines",
    date: "Mar 09, 2024",
    seats: 350,
    departure: { time: "18:00", airport: "BKK" },
    arrival: { time: "07:00", airport: "CNX" },
    stops: {
      time: "11hrs",
      stop: "1 Stop",
    },
  },
  {
    airline: "Jaturon Airlines",
    date: "Mar 09, 2024",
    seats: 350,
    departure: { time: "16:00", airport: "Bangkok" },
    arrival: { time: "18:00", airport: "Chiangmai" },
    stops: {
      time: "2hrs",
      stop: "Non-Stop",
    },
  },
];

export const legendItemsPopularAirlines = [
  { name: "Piyanit Airlines", airline: "piyanit", percent: "45%" },
  { name: "Jaturon Airlines", airline: "jaturon", percent: "42%" },
  { name: "Other Airlines", airline: "others", percent: "13%" },
];

export const chartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Tickets",
      data: [2600, 3500, 3000, 1400, 2600, 5000, 4000],
      backgroundColor: [], // ใส่ใน component เพราะใช้ getComputedStyle
      borderRadius: 10,
      barPercentage: 0.9,
      borderSkipped: false,
    },
  ],
};

export const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `${value / 1000}k`,
        color: "#94a3b8",
        font: {
          size: 12,
        },
      },
      grid: {
        drawTicks: false,
        color: "#e2e8f0",
      },
    },
    x: {
      ticks: {
        color: "#94a3b8",
        font: {
          size: 12,
        },
      },
      grid: {
        display: false,
      },
    },
  },
};

export const pieChartData = {
  labels: ["Piyanit Airlines", "Jaturon Airlines", "Other Airlines"],
  datasets: [
    {
      label: "Popular Airlines",
      data: [45, 42, 13],
      backgroundColor: [], // set ใน component
    },
  ],
};

export const pieChartOptions = {
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

export const flightsScheduleAnalysisData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  datasets: [
    {
      label: "Series 1",
      data: [100, 50, 120, 90, 80, 180, 170],
    },
    {
      label: "Series 2",
      data: [90, 150, 80, 140, 100, 80, 160],
    },
  ],
};

export const flightsScheduleAnalysisOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: "index",
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
      },
    },
    y: {
      beginAtZero: true,
      max: 250,
      ticks: {
        stepSize: 50,
        color: "#94a3b8",
      },
      grid: {
        color: "#e2e8f0",
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};
