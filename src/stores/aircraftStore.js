import { defineStore } from "pinia";
import { aircraftData } from "@/data/aircraft";

export const useAircraftStore = defineStore("aircraft", {
  state: () => ({
    aircraft: [],
    selectedAircraft: null,
  }),

  getters: {
    getTotalAircraft: (state) => state.aircraft.length,
    getAllAircraft: (state) => state.aircraft,
    getAircraftByID: (state) => (aircraftID) => {
      return state.aircraft.find(
        (aircraft) => aircraft.aircraftID === aircraftID
      );
    },
    getAircraftsByAirlineID: (state) => (airlineID) => {
      return state.aircraft.filter(
        (aircraft) => aircraft.airlineID === airlineID
      );
    },
  },

  actions: {
    loadAircrafts() {
      this.aircraft = aircraftData;
    },
    updateAircraftStatus(aircraftID, status) {
      const index = this.aircraft.findIndex((a) => a.aircraftID === aircraftID);
      if (index !== -1) {
        const updated = {
          ...this.aircraft[index],
          aircraftStatus: status,
        };
        this.aircraft.splice(index, 1, updated);
      }
    },
    addAircraft(newAircraft) {
      const maxID = this.aircraft.reduce(
        (max, aircraft) => Math.max(max, aircraft.aircraftID),
        0
      );
      const newID = maxID + 1;

      const existingAircraft = this.aircraft.find(
        (aircraft) =>
          aircraft.registrationNumber === newAircraft.registrationNumber
      );
      if (!existingAircraft) {
        this.aircraft.push({ aircraftID: newID, ...newAircraft });
      } else {
        console.error("Aircraft with this ID already exists.");
      }
    },
    updateAircraft(aircraftID, updatedAircraft) {
      const index = this.aircraft.findIndex(
        (aircraft) => aircraft.aircraftID === aircraftID
      );
      if (index !== -1) {
        this.aircraft[index] = { ...this.aircraft[index], ...updatedAircraft };
      }
    },
  },
});
