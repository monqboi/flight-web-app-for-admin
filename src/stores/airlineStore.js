import { defineStore } from "pinia";
import axios from "axios";

export const useAirlineStore = defineStore("airlineStore", {
  state: () => ({
    airlines: [],
    searchQuery: "",
  }),
  getters: {
    getAllAirlines: (state) => {
      if (!state.searchQuery) return state.airlines;
      const q = state.searchQuery.toLowerCase();
      return state.airlines.filter((a) =>
        a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
      );
    },
    getAirlineByID: (state) => (id) =>
      state.airlines.find((a) => a.airlineID === parseInt(id)),
  },

  actions: {
    async loadAirlines() {
      try {
        const res = await axios.get("/api/airline");
        this.airlines = res.data;
      } catch (err) {
        console.error("Error loading airlines:", err);
      }
    },
    setSearchQuery(query) {
      this.searchQuery = query;
    },
    async addAirline(data) {
      try {
        const res = await axios.post("/api/airline", data);
        console.log("Airline added:", res.data);
        await this.loadAirlines();
      } catch (err) {
        console.error("Error adding airline:", err);
      }
    },
    async updateAirline(id, data) {
      try {
        const res = await axios.put(`/api/airline/${id}`, data);
        console.log("Airline updated:", res.data);
        await this.loadAirlines();
      } catch (err) {
        console.error("Error updating airline:", err);
      }
    },
    async updateAirlineStatus(airlineID, newStatus) {
      try {
        await axios.put(`/api/airline/${airlineID}/status`, {
          airlineStatus: newStatus
        });
        const target = this.airlines.find(a => a.airlineID === airlineID);
        if (target) target.airlineStatus = newStatus;
      } catch (err) {
        console.error("Failed to update airline status", err);
      }
    },
  },
});