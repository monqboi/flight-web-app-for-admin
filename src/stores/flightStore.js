import { defineStore } from "pinia";
import axios from "axios";

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
        const matchAirlineID = String(flight.airlineID).toLowerCase() === trimmedID;
        const matchQuery = !query || String(flight.flightID).includes(query);
        const matchStatus = !selectedStatus || selectedStatus === "all" || flight.flightStatus === selectedStatus;
        return matchAirlineID && matchQuery && matchStatus;
      });
    },
    getFlightByID: (state) => (flightID) => state.flights.find(f => +f.flightID === +flightID),
  },

  actions: {
    async loadFlights() {
      try {
        const res = await axios.get("/api/flight");
        this.flights = res.data;
      } catch (error) {
        console.error("Failed to fetch flights:", error);
      }
    },

    async addFlight(flightData) {
      try {
        const response = await axios.post("/api/flight", {
          airlineID: flightData.airlineID,
          departure: flightData.departure.airport,
          departureDate: flightData.departure.date,
          departureTime: flightData.departure.time,
          destination: flightData.destination.airport,
          arrivalDate: flightData.destination.date,
          arrivalTime: flightData.destination.time,
          stopOvers: flightData.stopOvers,
          duration: {
            time: parseInt(flightData.duration.time),
            stop: parseInt(flightData.duration.stop),
          },
          aircraftID: flightData.aircraftID,
          flightStatus: flightData.flightStatus,
        });
    
        const newFlight = {
          ...flightData,
          flightID: response.data.flightID,  
        };
    
        this.flights.push(newFlight);
    
      } catch (error) {
        console.error("Failed to add flight:", error);
      }
    },

    async updateFlight(flightID, updatedFlight) {
      try {
        const response = await axios.post("/api/flight", {
          airlineID: flightData.airlineID,
          departure: flightData.departure.airport,
          departureDate: flightData.departure.date,
          departureTime: flightData.departure.time,
          destination: flightData.destination.airport,
          arrivalDate: flightData.destination.date,
          arrivalTime: flightData.destination.time,
          stopOvers: flightData.stopOvers,    
          duration: {
            time: parseInt(flightData.duration.time),
            stop: parseInt(flightData.duration.stop),
          },
          aircraftID: flightData.aircraftID,
          flightStatus: flightData.flightStatus,
        })
        const index = this.flights.findIndex(f => f.flightID === flightID);
        if (index !== -1) this.flights[index] = response.data; // updated flight
      } catch (error) {
        console.error("Failed to update flight:", error);
      }
    },

    async deleteFlight(flightID) {
      try {
        await axios.delete(`/api/flight/${flightID}`);
        this.flights = this.flights.filter(f => f.flightID !== flightID);
      } catch (error) {
        console.error("Failed to delete flight:", error);
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query.trim().toLowerCase();
    },

    setSelectedStatus(status) {
      this.selectedFlightStatus = status;
    },
  },
});