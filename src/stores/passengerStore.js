import { defineStore } from 'pinia'
import axios from 'axios'

export const usePassengerStore = defineStore('passenger', {
  state: () => ({
    passengers: [],
    validReservations: [],
    loading: false,
    error: null,
  }),
  
  getters: {
    getByFlightID: (state) => (flightID) =>
      state.passengers.filter(p => +p.FlightID === +flightID),

    searchPassengers: (state) => (query) => {
      const q = query.toLowerCase()
      return state.passengers.filter(p =>
        (p.firstName + ' ' + p.lastName).toLowerCase().includes(q) ||
        (p.Username || '').toLowerCase().includes(q) ||
        (p.SeatNumber || '').toLowerCase().includes(q)
      )
    }
  },

  actions: {
    async loadPassengers(flightID) {
      this.loading = true
      try {
        const res = await axios.get(`/api/passenger?flightID=${flightID}`)
        this.passengers = res.data
      } catch (err) {
        console.error('Failed to load passengers:', err)
        this.error = err
      } finally {
        this.loading = false
      }
    },

    async loadValidReservations(flightID) {
      try {
        const res = await axios.get(`/api/reservation?paidOnly=true&flightID=${flightID}`)
        this.validReservations = res.data
      } catch (err) {
        console.error('Failed to load valid reservations:', err)
      }
    },

    async addPassenger(payload) {
      try {
        await axios.post('/api/passenger', payload)
      } catch (err) {
        console.error('Failed to add passenger:', err)
        throw err
      }
    },

    async updatePassenger(id, payload) {
      try {
        await axios.put(`/api/passenger/${id}`, payload)
        // Optionally update local state
      } catch (err) {
        console.error('Failed to update passenger:', err)
        throw err
      }
    },

    async deletePassenger(id) {
      try {
        await axios.delete(`/api/passenger/${id}`)
        this.passengers = this.passengers.filter(p => p.PassengerID !== id)
      } catch (err) {
        console.error('Failed to delete passenger:', err)
        throw err
      }
    },
  },
})
