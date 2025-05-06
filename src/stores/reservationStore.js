import { defineStore } from 'pinia'
import axios from 'axios'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    reservations: [],
    current: null
  }),
  actions: {
    async loadReservations(flightID = null) {
      let url = '/api/reservation'
      if (flightID) {
        url += `?flightID=${flightID}`
      }
      const res = await axios.get(url)
      this.reservations = res.data
    },
    async getReservationByID(id) {
      const res = await axios.get(`/api/reservation/${id}/full`)
      this.current = res.data
      return res.data
    },
    async createReservation(data) {
      try {
        const res = await axios.post('/api/reservation', data)
        await this.loadReservations(data.flightID)
        return res.data
      } catch (err) {
        const message = err.response?.data || 'Failed to create reservation'
        throw new Error(message)
      }
    },
    async updateReservation(id, data) {
      try {
        await axios.put(`/api/reservation/${id}`, data)
        await this.loadReservations(data.flightID) 
      } catch (err) {
        const message = err.response?.data || 'Failed to update reservation'
        throw new Error(message)
      }
    },
    async deleteReservation(id, flightID) {
      await axios.delete(`/api/reservation/${id}`)
      await this.loadReservations(flightID)
    }
  }
})
