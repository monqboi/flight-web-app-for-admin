import { defineStore } from "pinia";
import { airlineData } from "@/data/management-airline.js";

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
        airline.airlineID
          .toLowerCase()
          .includes(state.searchQuery.toLowerCase())
      );
    },
    getAirlineByID: (state) => (airlineID) => {
      return state.airlines.find((airline) => airline.airlineID === airlineID);
    },
  },

  actions: {
    loadAirlines() {
      this.airlines = airlineData;
    },
    addAirline(airline) {
      const randomID = `AL-${Math.random().toString(36).substr(2, 9)}`;
      this.airlines.push({ airlineID: randomID, ...airline });
    },
    updateAirline(airlineID, updatedAirline) {
      const index = this.airlines.findIndex(
        (airline) => airline.airlineID === airlineID
      );
      if (index !== -1) {
        this.airlines[index] = { ...this.airlines[index], ...updatedAirline };
      }
    },
    setSearchQuery(query) {
      const trimmedQuery = query.trim().toLowerCase();
      this.searchQuery = trimmedQuery;
    },
    updateAirlineStatus(airlineID, status) {
      const index = this.airlines.findIndex(
        (flight) => flight.airlineID === airlineID
      );
      if (index !== -1) {
        const updated = {
          ...this.airlines[index],
          airlineStatus: status,
        };

        this.airlines.splice(index, 1, updated);
      }
      console.log(this.airlines[index]);
    },
  },
});
