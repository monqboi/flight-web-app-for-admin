<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import ManagementOverview from "@/components/ManagementOverview.vue";
import { formatDate } from "@/utils/flightUtils";
import { useSeatStore } from "@/stores/seatStore";
import { useFlightStore } from "@/stores/flightStore";
import Dropdown from "@/components/Dropdown.vue";
import { useRouter, useRoute } from "vue-router";
import {
  getUniqueRows,
  getSeatStatus,
  getSeatInfo,
  isSeatAvailable,
  formatSeatId,
} from "@/utils/seatUtils.js";
import axios from "axios";


const router = useRouter();
const route = useRoute();

const flightID = Number(route.params.flightID); 
const selectedClassTypeId = ref("economy");
const isStatusDropdownOpen = ref(false);
const isEditPassengerSeat = ref(false);
const editAreaRef = ref(null);
const seatStore = useSeatStore();
const flightStore = useFlightStore();
const showAddModal = ref(false);
const newSeatForm = ref({
  seatNumber: "",
  seatClass: "Economy",
  available: "Yes",
  checkInStatus: "No",
});
const capitalizeClass = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};



const seatClassTypes = [
  { id: "economy", name: "Economy" },
  { id: "business", name: "Business" },
  { id: "first-class", name: "First Class" }
];

const seatColumns = ["A", "B", "C", "", "D", "E", "F", "", "G", "H", "I"];

const selectedFlightForm = ref({
  flightID: flightID,
  isSeatAvailable: "not-available",
  departure: {
    airport: "",
    time: "",
    date: "",
  },
  destination: {
    time: "",
    airport: "",
    date: "",
  },
});
const showEditModal = ref(false);
const editSeatForm = ref({
  seatNumber: "",
  seatClass: "Economy",
  available: "Yes",
  checkInStatus: "No",
});

const openEditSeat = (seat) => {
  editSeatForm.value = {
    seatNumber: seat.seatID,
    seatClass: capitalizeClass(seat.seatClass),
    available: seat.availability === "available" ? "Yes" : "No",
    checkInStatus: seat.isCheckedIn ? "Yes" : "No",  
  };
  showEditModal.value = true;
};


const saveEditSeat = async () => {
  const token = localStorage.getItem("token");
  try {
    await axios.put(`/api/seats/${editSeatForm.value.seatNumber}`, {
      SeatClass: editSeatForm.value.seatClass,
      Available: editSeatForm.value.available,
      CheckinStatus: editSeatForm.value.checkInStatus,
      FlightID: flightID,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    
    await seatStore.loadSeatsFromAPI(flightID);

    // Reset modal and selection
    showEditModal.value = false;
    selectedPassengerSeat.value = null;
  } catch (err) {
    console.error("Update seat failed:", err);
  }
};
const showDeleteConfirm = ref(false);

const deleteSeat = async () => {
  const token = localStorage.getItem("token");
  try {
    await axios.delete(`/api/seats/${editSeatForm.value.seatNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { FlightID: flightID },
    });
    await seatStore.loadSeatsFromAPI(flightID);
    showDeleteConfirm.value = false;
    showEditModal.value = false;
  } catch (err) {
    console.error("Delete seat failed:", err);
  }
};


const selectedPassengerSeat = ref(null);
const addSeat = async () => {
  const token = localStorage.getItem("token");
  try {
    await axios.post("/api/seats", {
      SeatNumber: newSeatForm.value.seatNumber,
      SeatClass: newSeatForm.value.seatClass,
      Available: newSeatForm.value.available,
      CheckinStatus: newSeatForm.value.checkInStatus,
      FlightID: flightID,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    await seatStore.loadSeatsFromAPI(flightID);
    showAddModal.value = false;

    newSeatForm.value = {
      seatNumber: "",
      seatClass: "Economy",
      available: "Yes",
      checkInStatus: "No",
    };

  } catch (err) {
    console.error("Add seat failed:", err);
  }
};


onMounted(async () => {
  await flightStore.loadFlights();
  await seatStore.loadSeatsFromAPI(flightID);
  document.addEventListener("click", handleClickOutside);
  seatStore.setSearchQuery("");

  console.log("🧠 selectedClassTypeId:", selectedClassTypeId.value);
  console.log("🎯 economy seats:", seatStore.getEconomySeatsByFlightId(flightID));
  console.log("🎯 business seats:", seatStore.getBusinessSeatsByFlightId(flightID));
  console.log("🎯 first-class seats:", seatStore.getFirstClassSeatsByFlightId(flightID));
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

watch(
  () => flightStore.getFlightByID(flightID),
  (flight) => {
    if (flight) {
      const isSeatAvailable =
        flight.isSeatAvailable === true ? "available" : "not-available";

      Object.assign(selectedFlightForm.value, {
        ...flight,
        isSeatAvailable: isSeatAvailable,
      });
    }
  },
  { immediate: true }
);

watch(
  () => selectedFlightForm.value.isSeatAvailable,
  (newStatus, oldStatus) => {
    const newAvailable = newStatus === "available";
    const oldAvailable = oldStatus === "available";

    if (newAvailable !== oldAvailable && oldStatus !== undefined) {
      flightStore.updateSeatFlightAvailability(flightID, newAvailable);
    }
  }
);



const economySeatData = computed(() => {
  return seatStore.getEconomySeatsByFlightId(flightID);
  console.log("✅ economySeatData:", result.map(s => s.seatID));
  return result;
});

const businessSeatData = computed(() => {
  return seatStore.getBusinessSeatsByFlightId(flightID);
});

const firstClassSeatData = computed(() => {
  return seatStore.getFirstClassSeatsByFlightId(flightID);
});

const statusOptionsSeat = [
  { value: true, label: "Checked-In", class: "checked-in" },
  { value: false, label: "Not Checked-In", class: "not-checked-in" },
];

const statusOptionsAllSeats = [
  { value: "available", label: "Available", class: "available" },
  { value: "not-available", label: "Not Available", class: "not-available" },
];

const seatsByClass = computed(() => {
  switch (selectedClassTypeId.value) {
    case "economy":
      return economySeatData.value;
    case "business":
      return businessSeatData.value;
    case "first-class":
      return firstClassSeatData.value;
    default:
      return [];
  }
});

const rowsByClass = computed(() => getUniqueRows(seatsByClass.value));

const selectClassType = (classTypeId) => {
  if (classTypeId === selectedClassTypeId.value) return;
  selectedClassTypeId.value = classTypeId;
  clearSelectedSeat();
};

const clearSelectedSeat = () => {
  selectedPassengerSeat.value = null;
  isStatusDropdownOpen.value = false;
  isEditPassengerSeat.value = false;
};

const selectSeat = (rowNum, col) => {
  isEditPassengerSeat.value = false;

  const seatId = formatSeatId(rowNum, col);
  const classType = selectedClassTypeId.value;

  const seat = seatsByClass.value.find(
    (seat) => seat.seatID === seatId && seat.seatClass === classType
  );

  if (!seat) return;

if (selectedPassengerSeat.value?.seatID === seat.seatID) {
    selectedPassengerSeat.value = null;
  } else {
    selectedPassengerSeat.value = seat;
  }
};

const handleClickOutside = (event) => {
  if (selectedPassengerSeat.value && isEditPassengerSeat.value) {
    if (editAreaRef.value && !editAreaRef.value.contains(event.target)) {
      isEditPassengerSeat.value = false;
    }
  }
};

const handleSearch = (event) => {
  const query = event.target.value.trim().toLowerCase();
  seatStore.setSearchQuery(query);

  if (query) {
    const matchingSeats = seatStore.getSelectedSeatBySearchQueryAndClass(
      selectedClassTypeId.value
    );

    if (matchingSeats.length > 0) {
      selectedPassengerSeat.value = matchingSeats[0];

      isEditPassengerSeat.value = false;
    }
  } else {
    clearSearch();
  }
};

const clearSearch = () => {
  seatStore.setSearchQuery("");
  clearSelectedSeat();
};
</script>

<template>
  <ManagementOverview>
    <!-- ฝั่งซ้ายของ header -->
    <template #header-left>
      <!-- ฝั่งซ้ายมุมปะ -->
      <div class="notches left-notches">
        <div class="notch" v-for="index in 7" :key="`left-${index}`"></div>
      </div>

      <div class="flight-info">
        <button class="back-button" @click="router.back()">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.7672 7.5431C11.0672 7.25744 11.0788 6.78271 10.7931 6.48276C10.5074 6.18281 10.0327 6.17123 9.73276 6.4569L10.7672 7.5431ZM4.48276 11.4569C4.18281 11.7426 4.17123 12.2173 4.4569 12.5172C4.74256 12.8172 5.21729 12.8288 5.51724 12.5431L4.48276 11.4569ZM5.51724 11.4569C5.21729 11.1712 4.74256 11.1828 4.4569 11.4828C4.17123 11.7827 4.18281 12.2574 4.48276 12.5431L5.51724 11.4569ZM9.73276 17.5431C10.0327 17.8288 10.5074 17.8172 10.7931 17.5172C11.0788 17.2173 11.0672 16.7426 10.7672 16.4569L9.73276 17.5431ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM9.73276 6.4569L4.48276 11.4569L5.51724 12.5431L10.7672 7.5431L9.73276 6.4569ZM4.48276 12.5431L9.73276 17.5431L10.7672 16.4569L5.51724 11.4569L4.48276 12.5431ZM5 12.75H19V11.25H5V12.75Z"
            />
          </svg>
        </button>

        <div class="flight-details">
          <div
            class="date"
            v-html="
              formatDate(selectedFlightForm.departure.date).replace(
                ',',
                ',<br>'
              )
            "
          ></div>

          <div class="route">
            <div class="departure">
              <div class="departure-icon">
                <img
                  src="/dashboard-pic/plane-booking-up.png"
                  alt="Plane Booking Up"
                />
              </div>
              <div class="departure-details">
                <span class="airport-code">
                  {{ selectedFlightForm.departure.airport }}
                </span>
                <span class="time">
                  {{ selectedFlightForm.departure.time }}
                </span>
              </div>
            </div>

            <div class="route-arrow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.2328 16.4569C12.9328 16.7426 12.9212 17.2173 13.2069 17.5172C13.4926 17.8172 13.9673 17.8288 14.2672 17.5431L13.2328 16.4569ZM19.5172 12.5431C19.8172 12.2574 19.8288 11.7827 19.5431 11.4828C19.2574 11.1828 18.7827 11.1712 18.4828 11.4569L19.5172 12.5431ZM18.4828 12.5431C18.7827 12.8288 19.2574 12.8172 19.5431 12.5172C19.8288 12.2173 19.8172 11.7426 19.5172 11.4569L18.4828 12.5431ZM14.2672 6.4569C13.9673 6.17123 13.4926 6.18281 13.2069 6.48276C12.9212 6.78271 12.9328 7.25744 13.2328 7.5431L14.2672 6.4569ZM19 12.75C19.4142 12.75 19.75 12.4142 19.75 12C19.75 11.5858 19.4142 11.25 19 11.25V12.75ZM5 11.25C4.58579 11.25 4.25 11.5858 4.25 12C4.25 12.4142 4.58579 12.75 5 12.75V11.25ZM14.2672 17.5431L19.5172 12.5431L18.4828 11.4569L13.2328 16.4569L14.2672 17.5431ZM19.5172 11.4569L14.2672 6.4569L13.2328 7.5431L18.4828 12.5431L19.5172 11.4569ZM19 11.25L5 11.25V12.75L19 12.75V11.25Z"
                  fill="#7F7F7F"
                />
              </svg>
            </div>

            <div class="arrival">
              <div class="departure-icon">
                <img
                  src="/dashboard-pic/plane-booking-down.png"
                  alt="Plane Booking Down"
                />
              </div>
              <div class="arrival-details">
                <span class="airport-code">
                  {{ selectedFlightForm.destination.airport }}
                </span>
                <span class="time">
                  {{ selectedFlightForm.destination.time }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ฝั่งขวาของ header -->
    <template #header-right>
      <!-- ฝั่งขวามุมปะ -->
      <div class="notches right-notches">
        <div class="notch" v-for="index in 7" :key="`right-${index}`"></div>
      </div>

      <div class="controls">
        <div class="search-container">
          <div class="search-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.80524 15.7137C5.9404 14.8306 5.35381 13.7131 5.11824 12.4997C4.88072 11.2829 5.00269 10.0233 5.46924 8.87469C5.93181 7.73253 6.72153 6.75251 7.73924 6.05769C9.80409 4.64744 12.5224 4.64744 14.5872 6.05769C15.605 6.75251 16.3947 7.73253 16.8572 8.87469C17.3238 10.0233 17.4458 11.2829 17.2082 12.4997C16.9727 13.7131 16.3861 14.8306 15.5212 15.7137C14.3759 16.889 12.8044 17.5519 11.1632 17.5519C9.52213 17.5519 7.95059 16.889 6.80524 15.7137V15.7137Z"
                stroke="#397499"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.1702 7.20292C10.7583 7.24656 10.4598 7.61586 10.5034 8.02777C10.5471 8.43968 10.9164 8.73821 11.3283 8.69457L11.1702 7.20292ZM13.0216 9.69213C13.1831 10.0736 13.6232 10.2519 14.0047 10.0904C14.3861 9.92892 14.5644 9.4888 14.4029 9.10736L13.0216 9.69213ZM16.1421 15.0869C15.849 14.7943 15.3741 14.7947 15.0815 15.0879C14.7888 15.381 14.7893 15.8559 15.0824 16.1485L16.1421 15.0869ZM18.4704 19.5305C18.7636 19.8232 19.2384 19.8228 19.5311 19.5296C19.8237 19.2364 19.8233 18.7616 19.5301 18.4689L18.4704 19.5305ZM11.3283 8.69457C12.0508 8.61801 12.7384 9.02306 13.0216 9.69213L14.4029 9.10736C13.8622 7.83005 12.5496 7.05676 11.1702 7.20292L11.3283 8.69457ZM15.0824 16.1485L18.4704 19.5305L19.5301 18.4689L16.1421 15.0869L15.0824 16.1485Z"
                fill="#397499"
              />
            </svg>
          </div>
          <input
            @input="handleSearch"
            type="text"
            placeholder="Search Seat"
            class="search-input"
          />
        </div>
        <!-- ด้านใน #header-right -->
        <button class="btn-add-seat" @click="showAddModal = true">+ Add Seat</button>
      </div>
    </template>

    <!-- เนื้อหาหลัก -->
    <template #content>
      <div class="seat-management-container">
        <div class="management-seat-content">
          <div
            :class="[
              'select-seat',
              selectedPassengerSeat ? 'active' : 'default',
            ]"
          >
            <div class="select-seat-header">
              <template v-if="selectedPassengerSeat">
                <div>
                  Seat <strong>{{ selectedPassengerSeat.seatID }}</strong>
                </div>
                <button class="edit-btn" @click="openEditSeat(selectedPassengerSeat)">
                  Edit
                </button>
              </template>
              <template v-else> Select Seat </template>
            </div>

            <div class="select-seat-content">
              <template v-if="selectedPassengerSeat">
                <div class="status-line">
                  Check-In Status :
                  <span class="checked-in" v-if="!isEditPassengerSeat">
                    {{
                      selectedPassengerSeat.isCheckedIn === true
                        ? "Checked In"
                        : "Not Checked In"
                    }}
                  </span>
                </div>
              </template>
              <template v-else>
                <p>Show Passenger's Check-In Status</p>
              </template>
            </div>
          </div>

          <div class="type-seat">
            <div class="type reserve-seat">
              <img
              src="/management-pic/management-seat/reserve-seat-type.png"
              alt="Reserved Seat Icon"
              />
              <p>
              Reserved<br />
              Seat
              </p>
            </div>
            <div class="type reserve-seat">
              <img
              src="/management-pic/management-seat/passenger-seat-type.png"
              alt="Passenger Seat Icon"
              />
              <p>
              Passenger<br />
              Seat
              </p>
            </div>
            <div class="type reserve-seat">
              <img
              src="/management-pic/management-seat/unreserve-seat-type.png"
              alt="Unreserved Seat Icon"
              />
              <p>Unreserved <br />Seat</p>
            </div>
          </div>
        </div>

        <div class="seat-view-container">
          <div class="seat-view">
            <div class="seat-class-types">
              <div
                v-for="classType in seatClassTypes"                
                :key="classType.id"
                :class="{ active: selectedClassTypeId === classType.id }"
                @click="selectClassType(classType.id)"
              >
                {{ classType.name }}
              </div>
            </div>

            <div class="seat-grid">
              <div class="seat-columns">
                <div
                  class="column-header"
                  v-for="col in seatColumns"
                  :key="'header-' + col"
                  :class="{ spacer: col === '' }"
                >
                  {{ col }}
                </div>
              </div>

              <div class="seat-row" v-for="rowNum in rowsByClass" :key="rowNum">
                <div class="row-header">{{ rowNum }}</div>

                <div class="seat-grid-row">
                  <div
                    v-for="col in seatColumns"
                    :key="`${rowNum}-${col || 'spacer'}`"
                    class="seat-container"
                  >
                    <!-- ✅ แสดงเฉพาะเก้าอี้ที่มีอยู่จริง -->
                    <div
                      v-if="col !== '' && seatsByClass.find(seat => seat.seatID === formatSeatId(rowNum, col))"
                      class="seat"
                      :class="getSeatStatus(seatsByClass, formatSeatId(rowNum, col))"
                      :title="getSeatInfo(seatsByClass, formatSeatId(rowNum, col))"
                      @click="selectSeat(rowNum, col)"
                    >
                      <div class="seat-icon">
                        <img
                          v-if="isSeatAvailable(seatsByClass, formatSeatId(rowNum, col))"
                          src="/management-pic/management-seat/unreserve-seat-type.png"
                          alt="Unreserved Seat"
                        />
                        <img
                          v-else-if="selectedPassengerSeat?.seatID === formatSeatId(rowNum, col)"
                          src="/management-pic/management-seat/passenger-seat-type.png"
                          alt="Passenger Seat"
                        />
                        <img
                          v-else
                          src="/management-pic/management-seat/reserve-seat-type.png"
                          alt="Reserved Seat"
                        />
                      </div>
                    </div>

                    <!-- ❌ ไม่มีเก้าอี้: ไม่แสดง -->
                  </div>
                </div>

                <div class="row-header">{{ rowNum }}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </template>

  </ManagementOverview>
  <template v-if="showAddModal">
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>Add New Seat</h3>

          <label>Seat Number</label>
          <input v-model="newSeatForm.seatNumber" placeholder="e.g. B05" />

          <label>Seat Class</label>
          <select v-model="newSeatForm.seatClass">
            <option>Economy</option>
            <option>Business</option>
            <option>FirstClass</option>
          </select>

          <label>Available</label>
          <select v-model="newSeatForm.available">
            <option>Yes</option>
            <option>No</option>
          </select>

          <label>Check-In Status</label>
          <select v-model="newSeatForm.checkInStatus">
            <option>Yes</option>
            <option>No</option>
          </select>

          <button @click="addSeat">Confirm</button>
          <button @click="showAddModal = false">Cancel</button>
        </div>
      </div>
    </template>
    <template v-if="showEditModal">
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>Edit Seat</h3>

          <label>Seat Number</label>
          <input v-model="editSeatForm.seatNumber" disabled />

          <label>Seat Class</label>
          <select v-model="editSeatForm.seatClass">
            <option>Economy</option>
            <option>Business</option>
            <option>FirstClass</option>
          </select>

          <label>Available</label>
          <select v-model="editSeatForm.available">
            <option>Yes</option>
            <option>No</option>
          </select>

          <label>Check-In Status</label>
          <select v-model="editSeatForm.checkInStatus">
            <option>Yes</option>
            <option>No</option>
          </select>
          <button class="btn-delete" @click="showDeleteConfirm = true">Delete</button>
          <button @click="saveEditSeat">Save</button>
          <button @click="showEditModal = false">Cancel</button>
        </div>
      </div>
    </template>
    <template v-if="showDeleteConfirm">
      <div class="modal-overlay">
        <div class="modal-content warning">
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to delete seat {{ editSeatForm.seatNumber }}?</p>
          <button @click="deleteSeat">Yes, Delete</button>
          <button @click="showDeleteConfirm = false">Cancel</button>
        </div>
      </div>
    </template>

</template>

<style scoped>
.management-seat {
  margin: 20px;
  padding: 20px;
  background-color: var(--vt-c-white, #ffffff);
  border-radius: 10px;
  position: relative;
  display: flex;
  box-sizing: border-box;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.management-seat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}

/* ส่วนของ flight info  */
.flight-info {
  display: flex;
  align-items: center;
}

.back-button {
  border: 1px solid var(--c-navy-light);
  padding: 6px 25px;
  border-radius: 10px;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 17px;
  color: var(--c-navy-light);
}

.back-button:hover {
  background-color: var(--c-navy-light);
  color: white;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.back-button:active {
  background-color: var(--c-navy-light);
  color: white;
  transform: scale(0.96);
  transition: transform 0.1s ease;
}

/* ส่วนของ flight details  */
.flight-details {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.date {
  font-size: 14px;
  color: var(--vt-c-gray);
  margin-bottom: 4px;
  line-height: 1.2;
}

.route {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--vt-c-gray);
  margin-bottom: 4px;
  line-height: 1.2;
}

.airport-code {
  font-size: 16px;
  font-weight: bold;
  color: var(--vt-c-navy-light);
}

.time {
  font-weight: bold;
  color: var(--c-navy-light);
}

.departure,
.arrival {
  display: flex;
  gap: 10px;
  align-items: center;
}

.departure-details,
.arrival-details {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  gap: 2px;
}

.departure-icon img,
.arrival-icon img {
  width: 24px;
  height: 24px;
}

.route-arrow {
  margin: 0 10px;
  color: #666;
}

/* ส่วนของ search  */
.controls {
  display: flex;
  gap: 15px;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid var(--c-navy-light);
  border-radius: 24px;
  font-size: 14px;
}

.search-input::placeholder {
  color: var(--c-navy-light);
  opacity: 0.5;
}

.search-input:focus {
  outline: none;
  border-color: var(--c-navy);
  box-shadow: 0 0 5px var(--c-navy);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input:focus::placeholder {
  color: var(--c-navy);
  opacity: 0.7;
}

/* ส่วนของ management seat content */
.management-seat-content {
  grid-template-columns: 1fr 1.5fr;
  display: grid;
  gap: 20px;
  padding: 10px 15px;
}

/* ส่วนของ select seat */
.select-seat {
  border: 1px solid #3e7ca3;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
}

/* ก่อนเลือก */
.select-seat.default {
  border-color: #3b82a9;
}

.select-seat-header {
  background-color: var(--c-primary, #3e7ca3);
  color: var(--c-white, #ffffff);
  font-weight: 500;
  padding: 12px 12px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

/* หลังเลือก */
.select-seat.active {
  border-color: #f59e0b;
}

.select-seat.active .select-seat-header {
  background-color: #f59e0b;
  color: white;
  padding: 12px 25px;
  justify-content: space-between;
}

.select-seat.active .edit-btn {
  display: inline-block;
  background: transparent;
  border: 1px solid white;
  border-radius: 6px;
  padding: 3px 10px;
  color: white;
  cursor: pointer;
}

.select-seat.active .edit-btn:hover {
  background-color: white;
  color: #f59e0b;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.select-seat.active .edit-btn.active {
  background-color: white;
  color: #f59e0b;
  transition: background-color 0.3s ease-out, color 0.3s ease-out;
}

/* Content เหมือนเดิม */
.select-seat-content {
  background-color: var(--c-white, #ffffff);
  font-size: 14px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  color: #5a6872;
}

/* Status */
.status-line {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  gap: 10px;
  color: var(--vt-c-gray);
  line-height: 1.2;
  position: absolute;
  z-index: 1;
}

.status-dropdow-edit {
  position: relative;
  top: 100%;
}

.checked-in {
  display: inline-block;
  background-color: #fff7ed;
  color: #f59e0b;
  padding: 3px 12px;
  border-radius: 999px;
  font-weight: bold;
}

/* ส่วนของ type seat */
.type-seat {
  display: flex;
  padding: 12px;
  justify-content: space-around;
  border: 1px solid var(--c-navy-light);
  border-radius: 10px;
}

.type {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  gap: 5px;
}

.type p {
  font-size: 14px;
  color: var(--vt-c-gray);
  line-height: 1.2;
}

/* ส่วนของ seat view type */
.seat-view-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 15px;
}

.seat-view {
  border: 1px solid var(--c-navy-light);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.seat-class-types {
  display: flex;
  justify-content: center;
  gap: 45px;
  align-items: center;
  width: 100%;
  padding: 10px;
  font-weight: 500;
}

.seat-class-types div {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 25px;
  gap: 5px;
  border-radius: 50px;
  border: 1px solid var(--c-navy-light);
  font-size: 14px;
}

.seat-class-types div:hover {
  background-color: var(--c-navy-light);
  color: white;
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
}

.seat-class-types div.active {
  background-color: var(--c-navy-light);
  color: white;
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
}

/* ส่วนของ seat view */

/* ==== Seat Grid Layout ==== */
.seat-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

/* ==== Column Headers ==== */
.seat-columns {
  display: grid;
  margin-top: 15px;
  grid-template-columns: repeat(11, 50px); /* 9 ที่นั่ง + 2 ช่องว่าง */
  justify-content: center;
  margin-bottom: 24px;
  gap: 8px;
}

.column-header {
  text-align: center;
  font-weight: 500;
  font-size: 16px;
  color: var(--c-navy-light);
}

.column-header.spacer {
  visibility: hidden;
  pointer-events: none;
}

/* ==== Seat Styling ==== */
.seat {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.seat:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}
/* ==== Seat Row ==== */
.seat-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  gap: 12px;
}

.row-header {
  width: 32px;
  font-weight: 500;
  text-align: center;
  color: var(--c-navy-light);
}

.seat-grid-row {
  display: grid;
  grid-template-columns: repeat(11, 50px); /* 9 ที่นั่ง + 2 ช่องว่าง */
  gap: 8px;
  justify-content: center;
}

.seat-container {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .seat {
    width: 56px;
    height: 56px;
  }

  .row-header {
    width: 32px;
    font-size: 14px;
  }

  .column-header {
    font-size: 14px;
  }
}

/* ส่วนของมุมปะ พื้นหลังสีขวา */
.notches {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

.left-notches {
  left: 0;
}

.right-notches {
  right: 0;
}

.notch {
  width: 20px;
  height: 20px;
  background-color: var(--c-soft-blue, #e0e8f0);
  border-radius: 50%;
}

.left-notches .notch {
  transform: translateX(-50%);
}

.right-notches .notch {
  transform: translateX(50%);
}

.btn-add-seat {
  padding: 6px 16px;
  border: 1px solid #397499;
  background-color: white;
  color: #397499;
  border-radius: 6px;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 10px;
  width: 320px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-content label {
  font-weight: 600;
  margin-bottom: 4px;
}

.modal-content input,
.modal-content select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

.modal-content button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.modal-content button:first-of-type {
  background-color: #3e7ca3;
  color: white;
}

.modal-content button:last-of-type {
  background-color: #ccc;
  color: #333;
}

/* --- Delete Button --- */
.btn-delete {
  background-color: #e74c3c; /* red */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-delete:hover {
  background-color: #c0392b;
}

/* --- Confirmation Modal --- */
.modal-content.warning {
  border: 2px solid #e74c3c;
  background-color: #fff6f6;
}

.modal-content.warning h3 {
  color: #e74c3c;
}

.modal-content.warning p {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  color: #333;
}

/* Optional: Style Yes/Cancel buttons */
.modal-content.warning button {
  margin: 0 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}

.modal-content.warning button:first-of-type {
  background-color: #e74c3c;
  color: white;
}

.modal-content.warning button:last-of-type {
  background-color: #ddd;
  color: #333;
}

</style>
