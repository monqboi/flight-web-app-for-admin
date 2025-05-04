import { defineStore } from "pinia";
import axios from 'axios';

export const useFlightStore = defineStore("flight", {
  state: () => ({
    flights: [],
    searchQuery: "",
    selectedFlightStatus: null,
  }),

  getters: {
    getAllFlights: (state) => state.flights,
    getFlightsByAirlineId: (state) => (airlineID) => {
      const trimmedID = airlineID.trim().toLowerCase();
      const query = state.searchQuery;
      const selectedStatus = state.selectedFlightStatus;

      return state.flights.filter((flight) => {
        const matchAirlineID = flight.airlineID.toLowerCase() === trimmedID;

        const matchQuery =
          !query || String(flight.flightID).toLowerCase().includes(query);

        const matchStatus =
          !selectedStatus ||
          selectedStatus === "all" ||
          flight.flightStatus === selectedStatus;

        return matchAirlineID && matchQuery && matchStatus;
      });
    },
    getFlightByID: (state) => (flightID) => {
      return state.flights.find(
        (flight) => Number(flight.flightID) === Number(flightID)
      );
    },
    getFlightStatusByID: (state) => (flightID) => {
      const flight = state.flights.find(
        (flight) => flight.flightID === flightID
      );
      return flight ? flight.flightStatus : null;
    },
  },

  actions: {
    async loadFlights() {
      try {
        const res = await axios.get('/api/flight');
        this.flights = res.data;
      } catch (err) {
        console.error("Failed to load flights", err);
      }
    },
    async addFlight(newFlight) {
      try {
        const res = await axios.post('/api/flight', newFlight);
        this.flights.push({ ...newFlight, flightID: res.data.flightID });
      } catch (err) {
        console.error("Failed to add flight", err);
      }
    },
    async updateFlight(flightID, updatedFlight) {
      try {
        await axios.put(`/api/flight/${flightID}`, updatedFlight);
        const index = this.flights.findIndex(f => f.flightID === flightID);
        if (index !== -1) {
          this.flights[index] = { ...this.flights[index], ...updatedFlight };
        }
      } catch (err) {
        console.error("Failed to update flight", err);
      }
    },
    updateSeatFlightAvailability(flightID, isSeatAvailable) {
      this.updateFlight(flightID, { isSeatAvailable });
    },

    async deleteFlight(flightID) {
      try {
        await axios.delete(`/api/flight/${flightID}`);
        this.flights = this.flights.filter(f => f.flightID !== flightID);
      } catch (err) {
        console.error("Failed to delete flight", err);
      }
    }
  } 
});