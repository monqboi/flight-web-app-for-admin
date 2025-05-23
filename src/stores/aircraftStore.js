import { defineStore } from "pinia";
import axios from "axios";

export const useAircraftStore = defineStore("aircraft", {
  state: () => ({
    aircraft: [],
  }),

  getters: {
    getAllAircraft: (state) => state.aircraft,

    getAircraftByID: (state) => (id) => {
      const result = state.aircraft.find(
        (a) => Number(a.aircraftID) === Number(id)
      );
      if (!result) {
        console.warn(
          "[getAircraftByID] aircraftID not found:",
          id,
          "in",
          state.aircraft.map((a) => a.aircraftID)
        );
      }
      return result;
    },

    getAircraftsByAirlineID: (state) => (airlineID) =>
      state.aircraft.filter(
        (a) => Number(a.airlineID) === Number(airlineID)
      ),
  },

  actions: {
    async loadAircrafts() {
      try {
        const res = await axios.get("/api/aircraft");
        this.aircraft = res.data.map((a) => ({
          aircraftID: a.AircraftID,
          model: a.Model,
          airlineID: a.AirlineID,
          capacity: a.Capacity,
          registrationNumber: a.RegistrationNumber,
          aircraftStatus: a.AircraftStatus,
        }));
        console.log("aircraft mapped:", this.aircraft);
      } catch (err) {
        console.error("Failed to load aircrafts:", err);
      }
    },

    async addAircraft(newAircraft) {
      try {
        const res = await axios.post("/api/aircraft", newAircraft);
        this.aircraft.push({
          ...newAircraft,
          aircraftID: res.data.aircraftID,
        });
        console.log("Aircraft added:", newAircraft);
      } catch (err) {
        console.error("Failed to add aircraft:", err);
      }
    },

    async updateAircraft(aircraftID, updatedAircraft) {
      try {
        await axios.put(`/api/aircraft/${aircraftID}`, updatedAircraft);
        const index = this.aircraft.findIndex(
          (a) => Number(a.aircraftID) === Number(aircraftID)
        );
        if (index !== -1) {
          this.aircraft[index] = {
            ...this.aircraft[index],
            ...updatedAircraft,
          };
          console.log("Aircraft updated:", this.aircraft[index]);
        } else {
          console.warn("Aircraft ID not found for update:", aircraftID);
        }
      } catch (err) {
        console.error("Failed to update aircraft:", err);
      }
    },
    async deleteAircraft(aircraftID) {
      try {
        await axios.delete(`/api/aircraft/${aircraftID}`);
        this.aircraft = this.aircraft.filter(
          (a) => Number(a.aircraftID) !== Number(aircraftID)
        );
        alert(`Aircraft ${aircraftID} deleted successfully.`);
        console.log("Aircraft deleted:", aircraftID);
      } catch (err) {
        if (
          err.response &&
          err.response.status === 400 &&
          err.response.data?.error?.includes("Cannot delete aircraft")
        ) {
          alert("Cannot delete aircraft: It is currently used in active or incomplete flights.");
        } else if (err.response && err.response.status === 404) {
          alert("Aircraft not found. It may have already been deleted.");
        } else {
          alert("Failed to delete aircraft due to a server error.");
        }
        console.error("Failed to delete aircraft:", err);
      }
    },
  },
});
