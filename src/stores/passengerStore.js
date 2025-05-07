import { defineStore } from 'pinia'
import axios from 'axios'

export const usePassengerStore = defineStore('passengerStore', {
  state: () => ({
    passengers: [],
    validReservations: []
  }),
  actions: {
    async loadPassengers(flightID) {
      try {
        const { data } = await axios.get('/api/passenger', {
          params: { flightID }
        })
        this.passengers = data
      } catch (err) {
        console.error('Failed to load passengers:', err)
      }
    },

    async loadValidReservations(flightID) {
      try {
        const { data } = await axios.get('/api/reservation/valid', {
          params: { flightID }
        })
        this.validReservations = data
      } catch (err) {
        console.error('Failed to load valid reservations:', err)
      }
    },

    async savePassenger(passenger, isEditing) {
      try {
        if (isEditing) {
          // Update only personal information, do not touch Seat or Reservation.
          const payload = {
            firstName: passenger.firstName,
            middleName: passenger.middleName,
            lastName: passenger.lastName,
            birth: passenger.birth || null,
            nationality: passenger.nationality,
            passport: passenger.passport,
            address: passenger.address
          }
          await axios.put(`/api/passenger/${passenger.id}`, payload)
        } else {
          // For new additions, get seatID from validReservations
          const matched = this.validReservations.find(
            r => r.reservationId === passenger.reservationId
          )
          const seatID = matched?.seatId
    
          if (!seatID) {
            alert(`Cannot find SeatID for ReservationID ${passenger.reservationId}. Please check reservation status.`)
            return
          }
    
          const payload = {
            reservationId: passenger.reservationId,
            seatID,
            firstName: passenger.firstName,
            middleName: passenger.middleName,
            lastName: passenger.lastName,
            birth: passenger.birth || null,
            nationality: passenger.nationality,
            passport: passenger.passport,
            address: passenger.address
          }
    
          await axios.post('/api/passenger', payload)
        }
    
        const flightID = passenger.flightID || this.passengers[0]?.FlightID
        if (flightID) {
          await this.loadPassengers(flightID)
        }
      } catch (err) {
        console.error('Failed to save passenger:', err)
        throw err
      }
    },

    async deletePassenger(passengerID) {
      try {
        await axios.delete(`/api/passenger/${passengerID}`)
        this.passengers = this.passengers.filter(p => p.PassengerID !== passengerID)
      } catch (err) {
        console.error('Failed to delete passenger:', err)
      }
    }
  }
})
