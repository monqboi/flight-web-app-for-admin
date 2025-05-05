  <script setup>
  import ManagementOverview from "@/components/ManagementOverview.vue";
  import FlightPagination from "@/components/management-flight/FlightPagination.vue";
  import ModalAddFlight from "@/components/management-flight/ModalAddFlight.vue";
  import ModalConfirm from "@/components/ModalConfirm.vue";
  import { formatDate, mapFlightStatus } from "@/utils/flightUtils";
  import { getFlightDurationHours } from "@/utils/flightDurationHours";
  import { ref, computed, onMounted, watch } from "vue";
  import { useFlightStore } from "@/stores/flightStore";
  import { useAircraftStore } from "@/stores/aircraftStore";
  import { useRouter, useRoute } from "vue-router";
  import Dropdown from "@/components/Dropdown.vue";
  import ModalAircraft from "@/components/management-flight/ModalAircraft.vue";
  import {
    getAircraftModelPart,
    getAircraftStatusClass,
  } from "@/utils/flightUtils";

  const tableHeaders = [
    { label: "SeatAvailable" },
    { label: "Departure" },
    { label: "" },
    { label: "Destination" },
    { label: "Date" },
    { label: "Aircraft" },
    { label: "Status" },
    { label: "Action" },
  ];

  const statusOptions = [
    { label: "All", value: "all", class: "all" },
    { label: "Canceled", value: "Canceled", class: "canceled" },
    { label: "Completed", value: "Completed", class: "completed" },
    { label: "Pending", value: "Pending", class: "pending" },
    { label: "Delayed", value: "Delayed", class: "delayed" },
  ];

  function getStatusClass(status) {
    switch ((status || "").toLowerCase()) {
      case "pending": return "pending";
      case "delayed": return "delayed";
      case "completed": return "completed";
      case "canceled": return "canceled";
      default: return "";
    }
  }
  
  const route = useRoute();
  const flightStore = useFlightStore();
  const aircraftStore = useAircraftStore();
  const airlineID = Number(route.params.airlineID);
  const aircraftsForThisAirline = computed(() =>
    aircraftStore.getAircraftsByAirlineID(Number(airlineID))
  );
  const router = useRouter();
  const isShowModal = ref(false);
  const isShowAircraft = ref(false);
  const isShowConfirmModal = ref(false);
  const confirmMode = ref("");  

  const status = ref("");
  const formMode = ref("");
  const selectedAircraftID = ref("");
  const selectedFlightID = ref(0);

  const filteredFlights = computed(() => {
    return flightStore.getFlightsByAirlineId(airlineID);
  });

  onMounted(async () => {
    console.log("onMounted ManagementFlight.vue");
    await flightStore.loadFlights();
    await aircraftStore.loadAircrafts();
    console.log("All aircrafts loaded:", aircraftStore.aircraft);
    console.log("All flights from store:", flightStore.flights);
    console.log("Filtered flights by airline", airlineID, ":", filteredFlights.value);
  });

  watch(filteredFlights, (newFlights) => {
    console.log("filteredFlights changed:", newFlights); 
    paginatedFlights.value = newFlights;
  });

  // ส่วนของ pageination เเละ sort data
  const paginatedFlights = ref([]);

  // เป็นการส่งค่าจาก child component ไปยัง parent component
  // เพื่อให้ parent component สามารถอัพเดทข้อมูลได้ จากการกดเปลี่ยนหน้าเเต่ละครั้ง ข้อมูลจะถูกส่งไปที่ parent component
  // ex. กด next page จะส่งข้อมูลเที่ยวบินที่อยู่ในหน้าที่ 2 ไปที่ parent component
  const updatePaginatedFlights = (flights) => {
    paginatedFlights.value = flights;
  };

  const addFlight = (newFlight) => {
    flightStore.addFlight(newFlight);
    isShowModal.value = false;
  };

  const editFlight = (flightID, updatedFlight) => {
    flightStore.updateFlight(flightID, updatedFlight);
    isShowModal.value = false;
  };

  const showModalAddFlight = () => {
    isShowModal.value = true;
    formMode.value = "add";
  };

  const showModalInfoAircraft = (aircraftID) => {
    selectedAircraftID.value = aircraftID;
    isShowAircraft.value = true;
  };

  const handleSearch = (event) => {
    flightStore.setSearchQuery(event.target.value);
  };

  const showEditFlightModal = (flightID) => {
    selectedFlightID.value = flightID;
    formMode.value = "edit";
    isShowModal.value = true;
  };

  const showDeleteFlightConfirmModal = (flightID) => {
    selectedFlightID.value = flightID;
    isShowConfirmModal.value = true;
    confirmMode.value = "success";
  };

  const deleteFlight = () => {
    console.log("Deleting flight with ID:", selectedFlightID.value);
    const flightID = selectedFlightID.value;
    flightStore.deleteFlight(flightID);
    isShowConfirmModal.value = false;
  };

  watch(status, (newStatus) => {
    flightStore.setSelectedStatus(newStatus);
  });
  </script>

  <template>
    <ManagementOverview :showModal="isShowModal">
      <!-- ฝั่งซ้ายของ header -->
      <template #header-left>
        <div class="section-header">
          <h2>All Bookings</h2>
          <p>Overview of Recent Reservations</p>
        </div>
      </template>

      <!-- ฝั่งขวาของ header -->
      <template #header-right>
        <div class="controls">
          <div class="search-container">
            <div class="search-icon">
              <img src="/search-input.svg" alt="Search Input Icon" />
            </div>
            <input
              type="text"
              placeholder="Search Flight"
              class="search-input"
              @input="handleSearch"
            />
          </div>
          <Dropdown v-model="status" :statusOptions="statusOptions">
            <template #trigger="{ selected }">
              <span
                :class="['badge', selected?.class?.toLowerCase()]"
                v-if="selected"
              >
                {{ selected.label }}
              </span>
              <span v-else>Select Status</span>
            </template>
          </Dropdown>
          <div class="status-selector">
            <button class="status-button" @click="showModalAddFlight">
              Add +
            </button>
          </div>
        </div>
      </template>

      <template #content>
        <div class="management-filght-content">
          <div class="flight-table-header">
            <div
              class="header-item"
              v-for="(header, index) in tableHeaders"
              :key="index"
              :style="
                header.label === 'SeatAvailable'
                  ? 'display: flex; justify-content: center;'
                  : ''
              "
            >
              {{ header.label }}
            </div>
          </div>

          <div
            class="flight-row"
            v-for="(flight, index) in paginatedFlights"
            :key="index"
          >
            <div class="flight-cell seat-cell">
              <div
                class="seat-icon"
                @click="
                  router.push({
                    name: 'management-seat',
                    params: {
                      airlineID: airlineID,
                      flightID: flight.flightID,
                    },
                  })
                "
              >
                <img
                  v-if="flight.isSeatAvailable === true"
                  src="/management-pic/management-flight/available-seat.png"
                  alt="Available Seat"
                />
                <img
                  v-else
                  src="/management-pic/management-flight/not-available-seat.png"
                  alt="Not available Seat"
                />
              </div>
            </div>

            <div
              class="flight-cell departure-cell"
              @click="
                router.push({
                  name: 'PassengerManagement',
                  params: {
                    airlineID: airlineID,
                    flightID: flight.flightID,
                  },
                })
              "
            >
              <div class="flight-info">
                <div class="flight-icon">
                  <img src="/dashboard-pic/plane-booking-up.png" alt="Plane" />
                </div>
                <div class="flight-details">
                  <div class="flight-code">
                    {{ flight.departure.airport }}
                  </div>
                  <div class="flight-time">
                    {{ flight.departure.time }}
                  </div>
                </div>
              </div>
            </div>

            <div
              class="flight-cell route-cell"
              @click="
                router.push({
                  name: 'PassengerManagement',
                  params: {
                    airlineID: airlineID,
                    flightID: flight.flightID,
                  },
                })
              "
            >
              <div class="flight-line">
                <p>{{ getFlightDurationHours(flight) }} hrs</p>
                <div class="line">
                  <img
                    src="/dashboard-pic/icons/plane-icon.png"
                    
                    :class="{
                      animate: flight.flightStatus === 'Pending' || flight.flightStatus === 'Delayed',
                      center: flight.flightStatus !== 'Pending' && flight.flightStatus !== 'Delayed',
                    }"
                    alt="Plane Icon"
                  />
                </div>
                <p>{{ flight.duration.stop }} stop</p>
              </div>
            </div>

            <div
              class="flight-cell destination-cell"
              @click="
                router.push({
                  name: 'PassengerManagement',
                  params: {
                    flightID: flight.flightID,
                    airlineID: airlineID,
                  },
                })
              "
            >
              <div class="flight-info">
                <div class="flight-icon">
                  <img src="/dashboard-pic/plane-booking-down.png" alt="Plane" />
                </div>
                <div class="flight-details">
                  <div class="flight-code">
                    {{ flight.destination.airport }}
                  </div>
                  <div class="flight-time">
                    {{ flight.destination.time }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flight-cell date-cell">
              {{ formatDate(flight.departure.date) }}
            </div>

            <div
              class="flight-cell aircraft-cell"
              @click="showModalInfoAircraft(flight.aircraftID)"
            >
            <p :class="getAircraftStatusClass(flight.aircraftID)">
              {{ aircraftStore.getAircraftByID(flight.aircraftID)?.model || "Unknown Model" }}
            </p>
            </div>

            <div class="flight-cell status-cell">
              <span :class="['badge', getStatusClass(flight.flightStatus.toLowerCase())]">
                {{ flight.flightStatus }}
              </span>
            </div>

            <div class="flight-cell action-cell">
              <button
                class="edit-button"
                @click="showEditFlightModal(flight.flightID)"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  ></path>
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  ></path>
                </svg>
              </button>
              <button
                class="delete-button"
                @click="showDeleteFlightConfirmModal(flight.flightID)"
              >
                <svg
                  width="17"
                  height="21"
                  viewBox="0 0 17 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12.625 3.62512L12.4793 3.33499C11.7256 1.82737 10.1848 0.875 8.49931 0.875C6.81382 0.875 5.27301 1.82737 4.51937 3.33499L4.375 3.62512H12.625Z"
                    stroke="#FB8B01"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M6.73821 10.4278C6.44531 10.1349 5.97044 10.1349 5.67754 10.4278C5.38465 10.7207 5.38465 11.1956 5.67754 11.4884L6.73821 10.4278ZM7.96967 13.7806C8.26256 14.0735 8.73744 14.0735 9.03033 13.7806C9.32322 13.4877 9.32322 13.0128 9.03033 12.7199L7.96967 13.7806ZM5.67754 15.012C5.38465 15.3049 5.38465 15.7798 5.67754 16.0727C5.97044 16.3656 6.44531 16.3656 6.73821 16.0727L5.67754 15.012ZM9.03033 13.7806C9.32322 13.4877 9.32322 13.0128 9.03033 12.7199C8.73744 12.427 8.26256 12.427 7.96967 12.7199L9.03033 13.7806ZM11.3225 11.4884C11.6153 11.1956 11.6153 10.7207 11.3225 10.4278C11.0296 10.1349 10.5547 10.1349 10.2618 10.4278L11.3225 11.4884ZM7.96967 12.7199C7.67678 13.0128 7.67678 13.4877 7.96967 13.7806C8.26256 14.0735 8.73744 14.0735 9.03033 13.7806L7.96967 12.7199ZM10.2618 16.0727C10.5547 16.3656 11.0296 16.3656 11.3225 16.0727C11.6153 15.7798 11.6153 15.3049 11.3225 15.012L10.2618 16.0727ZM9.03033 12.7199C8.73744 12.427 8.26256 12.427 7.96967 12.7199C7.67678 13.0128 7.67678 13.4877 7.96967 13.7806L9.03033 12.7199ZM15.375 4.37524C15.7892 4.37524 16.125 4.03946 16.125 3.62524C16.125 3.21103 15.7892 2.87524 15.375 2.87524V4.37524ZM12.625 2.87524C12.2108 2.87524 11.875 3.21103 11.875 3.62524C11.875 4.03946 12.2108 4.37524 12.625 4.37524V2.87524ZM1.625 2.87524C1.21079 2.87524 0.875 3.21103 0.875 3.62524C0.875 4.03946 1.21079 4.37524 1.625 4.37524V2.87524ZM4.375 4.37524C4.78921 4.37524 5.125 4.03946 5.125 3.62524C5.125 3.21103 4.78921 2.87524 4.375 2.87524V4.37524ZM2.63182 19.1184L2.10149 19.6488H2.10149L2.63182 19.1184ZM1.625 16.6877H2.375H1.625ZM5.67754 11.4884L7.96967 13.7806L9.03033 12.7199L6.73821 10.4278L5.67754 11.4884ZM6.73821 16.0727L9.03033 13.7806L7.96967 12.7199L5.67754 15.012L6.73821 16.0727ZM10.2618 10.4278L7.96967 12.7199L9.03033 13.7806L11.3225 11.4884L10.2618 10.4278ZM11.3225 15.012L9.03033 12.7199L7.96967 13.7806L10.2618 16.0727L11.3225 15.012ZM15.375 2.87524H12.625V4.37524H15.375V2.87524ZM1.625 4.37524H4.375V2.87524H1.625V4.37524ZM2.77037 7.12524H14.2296V5.62524H2.77037V7.12524ZM14.2296 7.12524C14.448 7.12524 14.625 7.30226 14.625 7.52062H16.125C16.125 6.47383 15.2764 5.62524 14.2296 5.62524V7.12524ZM14.625 7.52062V16.6877H16.125V7.52062H14.625ZM14.625 16.6877C14.625 18.172 13.4218 19.3752 11.9375 19.3752V20.8752C14.2502 20.8752 16.125 19.0004 16.125 16.6877H14.625ZM11.9375 19.3752H5.0625V20.8752H11.9375V19.3752ZM5.0625 19.3752C4.34973 19.3752 3.66615 19.0921 3.16215 18.5881L2.10149 19.6488C2.8868 20.4341 3.95191 20.8752 5.0625 20.8752V19.3752ZM3.16215 18.5881C2.65815 18.0841 2.375 17.4005 2.375 16.6877H0.875C0.875 17.7983 1.31618 18.8634 2.10149 19.6488L3.16215 18.5881ZM2.375 16.6877V7.52062H0.875V16.6877H2.375ZM2.375 7.52062C2.375 7.30226 2.55202 7.12524 2.77037 7.12524V5.62524C1.72359 5.62524 0.875 6.47383 0.875 7.52062H2.375Z"
                    fill="#FB8B01"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <!-- :flights="filteredFlights" -->
        <FlightPagination
          :flights="filteredFlights"
          @update:paginatedData="updatePaginatedFlights"
        />
        <!-- <pre>All flights: {{ flightStore.flights }}</pre> -->
        <!-- <pre>Filtered: {{ filteredFlights }}</pre> -->
        <!-- <pre>Paginated: {{ paginatedFlights }}</pre> -->
      </template>
    </ManagementOverview>
    <ModalAircraft
      :showAircraft="isShowAircraft"
      :aircraftID="selectedAircraftID"
      :airlineID="airlineID"
      formMode="edit"
      @close="isShowAircraft = false"
    ></ModalAircraft>

    <ModalAddFlight
      :formMode="formMode"
      :showModal="isShowModal"
      :selectedFlightID="selectedFlightID"
      @close="isShowModal = false"
      @addFlight="addFlight"
      @editFlight="editFlight"
    ></ModalAddFlight>

    <ModalConfirm
      :isShowConfirmModal="isShowConfirmModal"
      :confirmMode="confirmMode"
      @confirmModal="deleteFlight"
      @closeConfirmModal="isShowConfirmModal = false"
    >
      <template #header>Delete Flight</template>
      <template #body>
        <p>Are you sure you want to delete this flight?</p>
      </template>
      <template #footer-summit>Delete</template>
      <template #footer-cancel>Cancel</template>
    </ModalConfirm>
  </template>

<style scoped>
/* Header Section Styling */
.section-header {
  display: flex;
  flex-direction: column;
  position: relative;
}

.section-header h2 {
  margin: 0;
  font-weight: 700;
  color: var(--c-navy-light);
  font-size: 1.5rem;
}

.section-header p {
  color: var(--c-navy-green);
  font-weight: 400;
  font-size: 0.9rem;
  margin-top: 5px;
}

/* Control Section - Search and Buttons */
.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* Search Input Styling */
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
  padding: 10px 10px 10px 40px;
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
  box-shadow: 0 0 5px rgba(57, 116, 153, 0.3);
  transition: all 0.3s ease;
}

/* Status Selector Button */
.status-selector {
  position: relative;
}

.status-button {
  padding: 10px 25px;
  border: 1px solid var(--c-navy-light);
  border-radius: 10px;
  background: white;
  display: flex;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
  color: var(--c-navy-light);
  transition: all 0.3s ease;
  font-weight: 500;
}

.status-button:hover {
  background-color: var(--c-navy-light);
  color: white;
}

/* Main Flight Table Container */
.management-flight-content {
  padding: 20px;
  width: 100%;
}

/* Table Header Styling */
.flight-table-header {
  display: grid;
  grid-template-columns: 1fr 120px 300px 120px 1fr 1fr 1fr 0.5fr;
  padding: 16px 0;
  border-bottom: 2px solid var(--c-soft-blue);
  color: var(--vt-c-gray);
  font-size: 14px;
  font-weight: 600;
  position: relative;
  letter-spacing: 0.5px;
}

.flight-table-header::after,
.flight-table-header::before {
  content: "";
  position: absolute;
  bottom: -12px;
  width: 25px;
  height: 25px;
  background-color: var(--c-soft-blue);
  border-radius: 50%;
  z-index: 1;
}

.flight-table-header::after {
  left: -52px;
}

.flight-table-header::before {
  right: -52px;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.header-item .filter-icon {
  cursor: pointer;
}

/* Flight Row Styling */
.flight-row {
  display: grid;
  grid-template-columns: 1fr 120px 300px 120px 1fr 1fr 1fr 0.5fr;
  border-bottom: 3px dashed var(--c-soft-blue);
  padding: 16px 0;
  align-items: center;
  min-height: 80px;
  position: relative;
  transition: all 0.2s ease-in-out;
}

.flight-row::after,
.flight-row::before {
  content: "";
  position: absolute;
  bottom: -12px;
  width: 25px;
  height: 25px;
  background-color: var(--c-soft-blue);
  border-radius: 50%;
  z-index: 1;
  transition: background-color 0.3s ease;
}

.flight-row::after {
  left: -52px;
}

.flight-row::before {
  right: -52px;
}

.flight-row:last-child {
  border-bottom: none;
}

.flight-row:last-child::after,
.flight-row:last-child::before {
  display: none;
}

.flight-row:hover {
  background-color: #f9fafb;
}

/* Seat Cell Styling */
.seat-cell {
  display: flex;
  justify-content: center;
  cursor: pointer;
}

.seat-icon {
  cursor: pointer;
}

/* Flight Information Cell Styling */
.flight-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.flight-icon img {
  width: 32px;
  height: 32px;
}

.flight-code {
  font-size: 16px;
  font-weight: bold;
  color: var(--vt-c-navy-light);
}

.flight-time {
  font-weight: bold;
  color: var(--c-navy-light);
}

/* Flight Route Line Styling */
.flight-line {
  flex: 1;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.flight-line p {
  font-size: 0.8rem;
  color: var(--vt-c-gray-2);
  margin: 0;
}
.line {
  position: relative;
  width: 100%;
  max-width: 200px;
  height: 2px;
  background-color: var(--vt-c-gray-3);
}

.line img {
  position: absolute;
  width: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--c-soft-blue);
}

/* not pending  */
.line img.center {
  left: 50%;
  transform: translate(-50%, -50%);
}

/* pending */
.line img.animate {
  left: 0;
  animation: plane-move 4s infinite linear;
}

@keyframes plane-move {
  0% {
    transform: translateY(-50%) translateX(0);
  }
  100% {
    transform: translateY(-50%) translateX(180px);
  }
}

.line::before,
.line::after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background-color: var(--vt-c-gray-4);
  border-radius: 50%;
}

.line::before {
  left: 0;
}

.line::after {
  right: 0;
}

.time {
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--c-navy-light);
}

.airport {
  font-size: 0.9rem;
  color: var(--vt-c-gray);
}

/* Route Information Styling */
.flight-route {
  display: flex;
  justify-content: center;
}

.route-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.route-duration {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.route-line {
  display: flex;
  align-items: center;
  width: 60px;
  margin: 4px 0;
}

.route-line::before,
.route-line::after {
  content: "";
  flex-grow: 1;
  height: 1px;
  background-color: #cbd5e1;
}

.route-dot {
  width: 8px;
  height: 8px;
  background-color: #94a3b8;
  border-radius: 50%;
  margin: 0 4px;
}

.route-stops {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.aircraft-cell {
  cursor: pointer;
}

.status-AC-not-available {
  color: var(--c-soft-blue);
}

.status-AC-not-available:hover {
  color: var(--c-soft-blue);
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.status-AC-available {
  color: var(--vt-c-gray-5);
}

.status-AC-available:hover {
  color: var(--vt-c-gray-5);
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.aircraft-cell:hover {
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.date-cell,
.aircraft-cell {
  color: var(--vt-c-gray-5);
  font-weight: 500;
  line-height: 1.4;
}

/* Status Badge Styling */
.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending {
  background-color: var(--c-light-orange);
  color: var(--c-orange);
}

.status-completed {
  background-color: var(--c-soft-blue);
  color: var(--c-navy-light);
}

.status-canceled {
  background-color: var(--c-dark-navy);
  color: var(--c-soft-blue);
}

.status-delayed {
  background-color: var(--c-soft-orange);
  color: var(--c-light-orange);
}

/* Action Button Styling */
.edit-button {
  background-color: transparent;
  color: #3e7ca3;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-button:hover {
  background-color: #d0edfe;
}

.delete-button {
  background-color: transparent;
  color: #3e7ca3;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-button:hover {
  background-color: #fce2d0;
  color: white;
}

.clickable-cell {
  cursor: pointer;
}
.clickable-cell:hover {
  background-color: #f9fafb; /* match your row-hover color */
}

.flight-cell {
  cursor: default;
}

.action-cell {
  display: flex;
  gap: 5px;
  justify-content: center;
  align-items: center;
}

.flight-cell.departure-cell,
.flight-cell.route-cell,
.flight-cell.destination-cell {
  cursor: pointer;
}

.flight-cell.departure-cell:hover,
.flight-cell.route-cell:hover,
.flight-cell.destination-cell:hover {
  background-color: #f9fafb;
}

@media (max-width: 992px) {
  .flight-table-header,
  .flight-row {
    grid-template-columns: 0.5fr 1fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.5fr;
  }
}

@media (max-width: 768px) {
  .flight-table-header {
    display: none;
  }

  .flight-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px;
  }
}
</style>
