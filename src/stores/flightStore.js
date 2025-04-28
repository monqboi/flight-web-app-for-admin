import { defineStore } from "pinia";
import { flightData } from "@/data/management-flight";

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
    loadFlights() {
      this.flights = flightData;
    },
    addFlight(flight) {
      this.flights.push(flight);
    },
    updateFlight(flightID, updatedFlight) {
      const index = this.flights.findIndex(
        (flight) => flight.flightID === flightID
      );
      if (index !== -1) {
        // ตรวจสอบว่ามีการเปลี่ยนแปลงจริงหรือไม่
        const hasChanges = Object.keys(updatedFlight).some(
          (key) => updatedFlight[key] !== this.flights[index][key]
        );

        if (hasChanges) {
          const updated = {
            ...this.flights[index],
            ...updatedFlight,
          };
          this.flights.splice(index, 1, updated);
        }
      }
    },
    updateSeatFlightAvailability(flightID, isSeatAvailable) {
      this.updateFlight(flightID, { isSeatAvailable });
    },
    deleteFlight(flightID) {
      const index = this.flights.findIndex(
        (flight) => flight.flightID === flightID
      );
      if (index !== -1) {
        this.flights.splice(index, 1);
      }
    },
    setSearchQuery(query) {
      const trimmedQuery = query.trim().toLowerCase();
      this.searchQuery = trimmedQuery;
    },
    setSelectedStatus(status) {
      this.selectedFlightStatus = status;
    },
  },
});
