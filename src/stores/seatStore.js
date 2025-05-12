import { defineStore } from "pinia";
import axios from "axios";

function mapSeatClass(rawClass) {
  const lower = rawClass.trim().toLowerCase();
  switch (lower) {
    case "economy": return "economy";
    case "business": return "business";
    case "firstclass":
    case "first-class": return "first-class";
    default: return lower;
  }
}


export const useSeatStore = defineStore("seat", {
  state: () => ({
    seats: [],
    selectedSeat: null,
    searchQuery: "",
  }),

  getters: {
    getAllSeats: (state) => state.seats,
    getSeatsByFlightId: (state) => (flightID) =>
      state.seats.filter((seat) => seat.flightID === flightID

),
    getSeatByID: (state) => (seatID) =>
      state.seats.find((seat) => seat.seatID === seatID),
    getEconomySeatsByFlightId: (state) => (flightID) =>
      state.seats.filter(
        (seat) => seat.flightID === flightID

 && seat.seatClass === "economy"
      ),
    getBusinessSeatsByFlightId: (state) => (flightID) =>
      state.seats.filter(
        (seat) => seat.flightID === flightID

 && seat.seatClass === "business"
      ),
    getFirstClassSeatsByFlightId: (state) => (flightID) =>
      state.seats.filter(
        (seat) => seat.flightID === flightID

 && seat.seatClass === "first-class"
      ),
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

      if (exactMatches.length > 0) return exactMatches;

      return filteredSeats.filter((seat) =>
        seat.seatID.toLowerCase().startsWith(query)
      );
    },
  },

  actions: {
    // เพิ่มใน actions ของ seatStore.js
      async updateSeatCheckInStatusToAPI(seatNumber, isCheckedIn) {
        const token = localStorage.getItem("token");
        const checkinStatus = isCheckedIn ? "Yes" : "No";
        const flightID = this.seats.find(s => s.seatID === seatNumber)?.flightID;

        try {
          await axios.put(`/api/seats/${seatNumber}`, {
            CheckinStatus: checkinStatus,
            FlightID: flightID
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          console.log("✅ Updated check-in status for", seatNumber, "→", checkinStatus);
        } catch (err) {
          console.error("❌ Failed to update seat check-in status:", err);
        }
      }
      ,

    async loadSeatsFromAPI(flightID) {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`/api/seats/${flightID}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

       this.seats = res.data.map((seat) => {
        console.log("✅ flightID param:", flightID, typeof flightID);
        console.log("✅ first seat.flightID:", this.seats[0]?.flightID, typeof this.seats[0]?.flightID);

        const seatNumber = seat.SeatNumber.trim();
        const col = seatNumber.charAt(0);
        const row = seatNumber.slice(1).padStart(2, "0");

        const rawClass = seat.SeatClass;
        const mappedClass = mapSeatClass(rawClass); // ⬅️ ต้องมี map แบบนี้

        console.log("🧩 seat:", seatNumber, "| rawClass:", rawClass, "| mapped:", mappedClass);

        return {
          seatID: seatNumber,
          flightID: Number(seat.FlightID),
          seatRow: row,
          seatCol: col,
          availability: seat.Available === "Yes" ? "available" : "unavailable",
          isCheckedIn: seat.CheckinStatus === "Yes",
          seatClass: mappedClass, // ✅ ใส่ค่าที่ map แล้ว
        };
      });

        console.log("✅ Loaded seats:", this.seats.map(s => s.seatID));
      } catch (error) {
        console.error("Failed to load seats:", error);
      }
    },


    updateSeatCheckInStatus(flightID, seatID, classType, status) {
      const index = this.seats.findIndex(
        (seat) =>
          seat.flightID === flightID

 &&
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
      this.searchQuery = query.trim().toLowerCase();
    },
    
  },
});
