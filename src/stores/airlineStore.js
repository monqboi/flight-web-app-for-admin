import { defineStore } from "pinia";
import axios from "axios";

export const useAirlineStore = defineStore("airline", {
  state: () => ({
    airlines: [],
    searchQuery: "",
  }),

  getters: {
    getTotalAirlines: (state) => state.airlines.length,
    getAllAirlines: (state) => {
      if (!state.searchQuery) {
        return state.airlines;
      }
      return state.airlines.filter((airline) =>
        airline.airlineID.toString().toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    },
    getAirlineByID: (state) => (airlineID) => {
      return state.airlines.find((airline) => airline.airlineID === airlineID);
    },
  },

  actions: {
    // Load Airline from backend
    async loadAirlines() {
      try {
        const res = await axios.get("/api/airline");
        this.airlines = res.data;
      } catch (err) {
        console.error("Failed to load airlines:", err);
      }
    },

    // Add Airline to backend
    async addAirline(airline) {
      try {
        await axios.post("/api/airline", airline);
        await this.loadAirlines(); // reload after add
      } catch (err) {
        console.error("Failed to add airline:", err);
      }
    },

    // Update Airline Status to backend
    async updateAirlineStatus(airlineID, status) {
      try {
        await axios.put(`/api/airline/${airlineID}/status`, {
          airlineStatus: status,
        });
        await this.loadAirlines(); // reload after update
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    },

    // Delete Airline from backend
    async deleteAirline(airlineID) {
      try {
        await axios.delete(`/api/airline/${airlineID}`);
        await this.loadAirlines();
      } catch (err) {
        console.error("Failed to delete airline:", err);
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query.trim().toLowerCase();
    },
  },
});
