<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePassengerStore } from '@/stores/passengerStore'
import { useFlightStore } from '@/stores/flightStore'
import { formatDate } from '@/utils/flightUtils'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const showModal = ref(false)
const isEditing = ref(false)
isEditing.value = false
const editingIndex = ref(null)
const toggleView = ref(false)

const flightID = route.params.flightID
const airlineID = route.params.airlineID
const passengerStore = usePassengerStore()
const flightStore = useFlightStore()
const flight = computed(() => flightStore.getFlightByID(flightID))

const form = ref({
  id: null,
  userId: '',
  reservationId: '',
  seat: '',
  firstName: '',
  middleName: '',
  lastName: '',
  nationality: '',
  birth: '',
  passport: '',
  address: ''
})

onMounted(async () => {
  await flightStore.loadFlights()
  await passengerStore.loadPassengers(flightID)
})

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return passengerStore.passengers.filter(p =>
    (p.Username || '').toLowerCase().includes(q) ||
    (`${p.Firstname} ${p.Lastname}` || '').toLowerCase().includes(q) ||
    (p.SeatNumber || '').toString().includes(q)
  )
})

function switchView() {
  if (toggleView.value) {
    router.push({ name: 'FlightReservation', params: { flightID, airlineID } })
  } else {
    router.push({ name: 'PassengerManagement', params: { flightID, airlineID } })
  }
}

async function openModal(p = null, idx = null) {
  await passengerStore.loadValidReservations(flightID)
  if (p) {
    isEditing.value = true
    editingIndex.value = idx
    form.value = { ...p }
  } else {
    isEditing.value = false
    editingIndex.value = null
    form.value = {
      reservationId: '',
      seat: '',
      firstName: '',
      middleName: '',
      lastName: '',
      nationality: '',
      birth: '',
      passport: '',
      address: ''
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function savePassenger() {
  await passengerStore.savePassenger(form.value, isEditing.value)
  showModal.value = false
}

async function deletePassenger(id) {
  if (confirm('Delete this passenger?')) {
    await passengerStore.deletePassenger(id)
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="layout">
    <main class="main-content">
      <div class="flight-header">
        <button class="back-button" @click="goBack">←</button>
        <div class="flight-date-info">
          <span class="date">{{ formatDate(flight.departure.date) }}</span>
          <div class="flight-route">
            <img src="/src/assets/plane-fly.png" />
            <span class="airport">{{ flight.departure.airport }}</span>
            <span class="time">{{ flight.departure.time }}</span>
            <img src="/src/assets/fly-duration.png" class="flight-arrow" />
            <img src="/src/assets/plane-land.png" />
            <span class="airport">{{ flight.destination.airport }}</span>
            <span class="time">{{ flight.destination.time }}</span>
          </div>
        </div>
        <div class="flight-mode-toggle">
          <label class="toggle-label">Flight view mode</label>
          <div class="view-switch">
            <span :class="{ active: !toggleView }">Passenger</span>
            <label class="switch">
              <input type="checkbox" v-model="toggleView" @change="switchView" />
              <span class="slider round"></span>
            </label>
            <span :class="{ active: toggleView }">Reservation</span>
          </div>
        </div>
        <div class="search-actions">
          <input class="search-box" v-model="searchQuery" placeholder="🔍 Search Passenger" />
          <!--<button class="add-btn" @click="openModal()">+ Add</button>-->
        </div>
      </div>

      <div class="payment-table">
        <table class="passenger-table">
          <thead>
            <tr>
              <th class="spacer-col"></th>
              <th>User</th>
              <th>Seat Number</th>
              <th>Full Name</th>
              <th>Passport No.</th>
              <th>Nationality</th>
              <th>Birthdate</th>
              <th>Address</th>
              <th>Action</th>
              <th class="spacer-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in filtered" :key="p.PassengerID" class="ticket-row">
              <td>{{ p.Username }}<br><span class="small-id">#{{ p.Username }}</span></td>
              <td>#{{ p.PassengerID }}</td><!--<td>{{ p.SeatNumber }}</td>-->
              <td>{{ p.Firstname }} {{ p.Middlename }} {{ p.Lastname }}</td>
              <td>{{ p.PassportNumber }}</td>
              <td>{{ p.Nationality }}</td>
              <td>{{ formatDate(p.BirthDate) }}</td>
              <td>{{ p.Address }}</td>
              <td>
                <div class="action-buttons">
                  <i class="fa fa-edit" @click="openModal(p, index)"></i>
                  <font-awesome-icon icon="trash" @click="deletePassenger(p.PassengerID)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showModal" class="modal">
        <div class="modal-content user-form">
          <h3>{{ isEditing ? 'Modify Passenger' : 'Add Passenger' }}</h3>
          <div class="form-row">
            <input v-model="form.reservationId" placeholder="Reservation ID" />
            <input v-model="form.seat" placeholder="Seat ID" />
          </div>
          <div class="form-row">
            <input v-model="form.firstName" placeholder="First Name" />
            <input v-model="form.middleName" placeholder="Middle Name" />
            <input v-model="form.lastName" placeholder="Last Name" />
          </div>
          <div class="form-row">
            <input v-model="form.nationality" placeholder="Nationality" />
            <input type="date" v-model="form.birth" />
            <input v-model="form.passport" placeholder="Passport Number" />
          </div>
          <div class="form-row">
            <input v-model="form.address" placeholder="Address" />
          </div>
          <div class="modal-actions">
            <button class="save-btn" @click="savePassenger">Save ✔</button>
            <button class="discard-btn" @click="closeModal">Discard ✖</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
  
  .layout { display: flex; min-height: 100vh; }
  .flight-header {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 25px;
  }
  .back-button {
    padding: 6px 12px; border: 1px solid #ccc; background: white;
    border-radius: 8px; font-weight: bold; cursor: pointer;
  }
  .flight-date-info { display: flex; flex-direction: column; gap: 4px; }
  .flight-route { display: flex; align-items: center; gap: 6px; }
  .flight-route .airport { font-weight: bold; color: #1a1a1a; }
  .flight-route .time { color: #2e7ec7; font-weight: 600; }
  .flight-arrow { width: 24px; }
  .flight-mode-toggle { display: flex; flex-direction: column; align-items: center; }
  .toggle-label { font-size: 12px; color: #999; margin-bottom: 4px; }
  .view-switch { display: flex; align-items: center; gap: 10px; }
  .view-switch span { font-size: 14px; font-weight: bold; color: #999; }
  .view-switch span.active { color: #2c4c65; }
  .search-actions { display: flex; align-items: center; gap: 10px; }
  .search-box {
    padding: 8px 14px; border-radius: 16px; border: 1px solid #ccc; min-width: 320px;
  }
  .add-btn {
    background-color: #f6b52e; color: white; border: none;
    padding: 10px 18px; border-radius: 10px; font-weight: bold; cursor: pointer;
  }
  .passenger-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
    table-layout: auto; /* เปลี่ยนจาก fixed เป็น auto */
  }

  .passenger-table th, .passenger-table td {
    padding: 14px 16px;
    font-size: 14px;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: visible; /* แสดงค่าทั้งหมด */
    text-overflow: unset;
  }

  .passenger-table th:nth-child(3),
  .passenger-table td:nth-child(3) {
    width: 160px; /* Full Name */
  }
  
  .passenger-table th:nth-child(4),
  .passenger-table td:nth-child(4) {
    width: 160px; /* Passport Number */
  }

  .passenger-table th:nth-child(7),
  .passenger-table td:nth-child(7) {
    width: 160px; /* Address */
  }

  .small-id { font-size: 12px; color: #888; }
  .ticket-row {
    position: relative; border-bottom: 2px dashed #cce4f5;
  }
  .ticket-row::before, .ticket-row::after {
    content: ""; position: absolute; width: 16px; height: 16px; background: #dbe7ef;
    border-radius: 50%; bottom: -9px; z-index: 2;
  }
  .ticket-row::before { left: -7px; }
  .ticket-row::after { right: -7px; }
  .action-buttons {
    display: flex; gap: 8px;
  }
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }
  
  .modal-content input,
  .modal-content select {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border-radius: 8px;
    border: 1px solid #ccc;
  }
.modal-content.user-form {
  width: 600px;
  background: white;
  border-radius: 12px;
  padding: 30px 40px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  font-family: "Inter", sans-serif;
}

.modal-content.user-form h3 {
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row input {
  flex: 1;
  padding: 10px 15px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
  .save-btn, .discard-btn {
    padding: 10px 25px; font-size: 14px; border: none;
    border-radius: 6px; font-weight: bold; cursor: pointer;
  }

  .switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3e7ca3;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3e7ca3;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.save-btn {
    background-color: #ffc107;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
  }
  
  .discard-btn {
    background-color: #1d3a4c;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
  }
  

  </style>
  