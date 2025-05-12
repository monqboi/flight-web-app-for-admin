import { defineStore } from 'pinia'
import axios from 'axios'

export const useReportStore = defineStore('reportStore', {
  state: () => ({
    timeChartData: {
      reservationChart: [],
      revenueChart: [],
      delayChart: []
    },
    topChartData: {
      behaviorChart: [],
      frequentChart: [],
      cancelChart: [],
      priceChart: []
    },
    lastUpdated: {}
  }),
  actions: {
    async loadTimeChart(chartId, months = 12) {
      const map = {
        reservationChart: 'reservation-trends',
        revenueChart: 'revenue-trends',
        delayChart: 'delays-trends'
      }
      try {
        const res = await axios.get(`/api/report/${map[chartId]}?months=${months}`)
        this.timeChartData[chartId] = res.data
        this.lastUpdated[chartId] = new Date().toLocaleString()
      } catch (err) {
        console.error(`Failed to load ${chartId}`, err)
      }
    },

    async loadTopChart(chartId, top = 10) {
      const map = {
        behaviorChart: 'top-destinations',
        frequentChart: 'top-customers',
        cancelChart: 'cancel-heavy-airlines',
        priceChart: 'expensive-destinations'
      }
      try {
        const res = await axios.get(`/api/report/${map[chartId]}?top=${top}`)
        this.topChartData[chartId] = res.data
        this.lastUpdated[chartId] = new Date().toLocaleString()
      } catch (err) {
        console.error(`Failed to load ${chartId}`, err)
      }
    }
  }
})