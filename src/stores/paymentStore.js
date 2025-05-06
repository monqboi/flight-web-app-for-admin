import { defineStore } from 'pinia'
import axios from 'axios'

export const usePaymentStore = defineStore('payment', {
  state: () => ({
    payments: [],
    current: null
  }),

  actions: {
    async loadPayments() {
      try {
        const res = await axios.get('/api/payment')
        this.payments = res.data
      } catch (err) {
        console.error('Failed to load payments:', err)
        throw err
      }
    },

    async getPaymentByID(id) {
      try {
        const res = await axios.get(`/api/payment/${id}`)
        this.current = res.data
        return res.data
      } catch (err) {
        console.error('Failed to get payment by ID:', err)
        throw err
      }
    },

    async createPayment(data) {
      try {
        const res = await axios.post('/api/payment', data)
        await this.loadPayments()
        return res.data
      } catch (err) {
        console.error('Failed to create payment:', err)
        throw err
      }
    },

    async updatePayment(id, data) {
      try {
        const res = await axios.put(`/api/payment/${id}`, data)
        await this.loadPayments()
        return res.data
      } catch (err) {
        console.error('Failed to update payment:', err)
        throw err
      }
    }
  }
})
