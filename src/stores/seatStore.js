import { defineStore } from "pinia";
import { seatData } from "@/data/management-seat";

export const useSeatStore = defineStore("seat", {
  state: () => ({
    seats: [],
    selectedSeat: null,
    searchQuery: "",
  }),

  getters: {
    getAllSeats: (state) => state.seats,
    getSeatsByFlightId: (state) => (flightID) => {
      return state.seats.filter((seat) => seat.flightID === flightID);
    },
    getSeatByID: (state) => (seatID) => {
      return state.seats.find((seat) => seat.seatID === seatID);
    },
    getEconomySeatsByFlightId: (state) => (flightID) => {
      return state.seats.filter(
        (seat) => seat.flightID === flightID && seat.seatClass === "economy"
      );
    },
    getBusinessSeatsByFlightId: (state) => (flightID) => {
      return state.seats.filter(
        (seat) => seat.flightID === flightID && seat.seatClass === "business"
      );
    },
    getFirstClassSeatsByFlightId: (state) => (flightID) => {
      return state.seats.filter(
        (seat) => seat.flightID === flightID && seat.seatClass === "first-class"
      );
    },
    getSelectedSeatBySearchQueryAndClass: (state) => (classType) => {
      const query = state.searchQuery.trim().toLowerCase();
      if (!query) return [];

      const filteredSeats = state.seats.filter(
        (seat) =>
          seat.availability === "unavailable" && seat.seatClass === classType
      );

      const exactMatches = filteredSeats.filter(
        (seat) => seat.seatID.toLowerCase() === query
      );

      // ถ้าเจอ → return เลย
      if (exactMatches.length > 0) {
        return exactMatches;
      }

      // ถ้าไม่เจอ → หาตามที่ขึ้นต้นด้วย query
      return filteredSeats.filter((seat) =>
        seat.seatID.toLowerCase().startsWith(query)
      );
    },
  },

  actions: {
    loadSeats() {
      this.seats = seatData;
    },
    updateSeatCheckInStatus(flightID, seatID, classType, status) {
      const index = this.seats.findIndex(
        (seat) =>
          seat.flightID === flightID &&
          seat.seatID === seatID &&
          seat.seatClass === classType
      );
      if (index !== -1) {
        const updated = {
          ...this.seats[index],
          isCheckedIn: status,
          seatClass: classType,
          flightID: flightID,
          seatID: seatID,
        };
        this.seats.splice(index, 1, updated);
      }
    },
    setSearchQuery(query) {
      const trimmedQuery = query.trim().toLowerCase();
      this.searchQuery = trimmedQuery;
    },
  },
});
