import { defineStore } from "pinia";
import axios from "axios";

export const useAircraftStore = defineStore("aircraft", {
  state: () => ({
    aircraft: [],
  }),

  getters: {
    getAllAircraft: (state) => state.aircraft,
    getAircraftByID: (state) => (id) => state.aircraft.find(a => a.aircraftID === id),
  },

  actions: {
    async loadAircrafts() {
      const res = await axios.get("/api/aircraft");
      this.aircraft = res.data;
    },

    async addAircraft(newAircraft) {
      const res = await axios.post("/api/aircraft", newAircraft);
      this.aircraft.push({ ...newAircraft, aircraftID: res.data.aircraftID });
    },

    async updateAircraft(aircraftID, updatedAircraft) {
      await axios.put(`/api/aircraft/${aircraftID}`, updatedAircraft);
      const index = this.aircraft.findIndex(a => a.aircraftID === aircraftID);
      if (index !== -1) {
        this.aircraft[index] = { ...this.aircraft[index], ...updatedAircraft };
      }
    },
  }
});
