import { defineStore } from 'pinia';
import axios from 'axios';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: [],
    bookings: [],
    reservationChart: null,
    popularAirlinesChart: null,
    flightScheduleChart: null
  }),
  actions: {
    async loadDashboard() {
      const res1 = await axios.get('/api/dashboard/stats');
      this.stats = res1.data;

      const res2 = await axios.get('/api/dashboard/bookings');
      this.bookings = res2.data;

      const res3 = await axios.get('/api/dashboard/reservation-chart');
      this.reservationChart = res3.data;

      const res4 = await axios.get('/api/dashboard/popular-airlines');
      this.popularAirlinesChart = res4.data;

      const res5 = await axios.get('/api/dashboard/schedule-chart');
      this.flightScheduleChart = res5.data;
    }
  }
});