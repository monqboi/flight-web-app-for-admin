import { defineStore } from 'pinia'
import axios from 'axios'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    reservations: [],
    current: null
  }),
  actions: {
    async loadReservations() {
      const res = await axios.get('/api/reservation')
      this.reservations = res.data
    },
    async getReservationByID(id) {
      const res = await axios.get(`/api/reservation/${id}/full`)
      this.current = res.data
      return res.data
    },
    async createReservation(data) {
      const res = await axios.post('/api/reservation', data)
      await this.loadReservations()
      return res.data
    },
    async updateReservation(id, data) {
      await axios.put(`/api/reservation/${id}`, data)
      await this.loadReservations()
    },
    async deleteReservation(id) {
      await axios.delete(`/api/reservation/${id}`)
      await this.loadReservations()
    }
  }
})