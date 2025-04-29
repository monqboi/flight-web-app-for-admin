<template>
    <div class="layout">
      <Sidebar />
      <main class="main-content">
        <!-- HEADER -->
        <div class="flight-header">
          <button class="back-button" @click="goBack">←</button>
          <div class="flight-date-info">
            <span class="date">Mar 09, 2025</span>
            <div class="flight-route">
              <img src="/src/assets/plane-fly.png" />
              <span class="airport">BKK</span>
              <span class="time">18:00</span>
              <img src="/src/assets/fly-duration.png" class="flight-arrow" />
              <img src="/src/assets/plane-land.png" />
              <span class="airport">CNX</span>
              <span class="time">18:00</span>
            </div>
          </div>
          <div class="flight-mode-toggle">
            <label class="toggle-label">Flight view mode</label>
            <div class="view-switch">
              <span :class="{ active: !toggleView }">Passenger</span>
              <label class="switch">
                <input type="checkbox" v-model="toggleView" @change="switchView">
                <span class="slider round"></span>
              </label>
              <span :class="{ active: toggleView }">Reservation</span>
            </div>
          </div>
          <div class="search-actions">
            <input class="search-box" v-model="searchQuery" placeholder="🔍 Search Passenger" />
            <button class="add-btn" @click="openModal()">+ Add</button>
          </div>
        </div>
  
        <!-- TABLE -->
        <div class="payment-table">
          <table class="passenger-table">
            <thead>
              <tr>
                <th class="spacer-col"></th>
                <th>Reservation ID</th>
                <th>Seat ID</th>
                <th>Full Name</th>
                <th>Payment ID</th>
                <th>Booking Date</th>
                <th>Status</th>
                <th>Action</th>
                <th class="spacer-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr class="ticket-row" v-for="(res, index) in filteredReservations" :key="res.id">
                <td>{{ res.reservationId }}</td>
                <td>{{ res.seat }}</td>
                <td>{{ res.name }}</td>
                <td>{{ res.paymentId }}</td>
                <td>{{ res.bookingDate }}</td>
                <td>
                  <span
                    class="status"
                    :class="{
                      success: res.status === 'Confirmed',
                      failed: res.status === 'Cancelled',
                      pending: res.status === 'Pending'
                    }"
                  >
                    {{ res.status }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <i class="fa fa-edit" @click="openModal(res, index)"></i>
                    <font-awesome-icon icon="trash"  @click="deleteReservation(res.id)"title="Delete"
                    class="action-icon" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <!-- MODAL -->
        <div v-if="showModal" class="modal">
          <div class="modal-content user-form">
            <h3>{{ editIndex !== null ? 'Edit Reservation' : 'Add Reservation' }}</h3>
            <div class="form-row">
              <input v-model="form.reservationId" placeholder="Reservation ID" />
              <input v-model="form.userId" placeholder="User ID" />
              <input v-model="form.seat" placeholder="Seat ID" />
            </div>
            <div class="form-row">
              <input v-model="form.name" placeholder="Full Name" />
              <input v-model="form.paymentId" placeholder="Payment ID" />
              <input type="date" v-model="form.bookingDate" placeholder="Booking Date" />
            </div>
            <div class="form-row">
              <select v-model="form.status">
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div class="modal-actions">
              <button class="save-btn" @click="saveReservation">Save ✔</button>
              <button class="discard-btn" @click="closeModal">Discard ✖</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  
  const router = useRouter()
  const route = useRoute()
  const toggleView = ref(true)
  const searchQuery = ref('')
  const showModal = ref(false)
  const editIndex = ref(null)
  const form = ref({
    id: null,
    reservationId: '',
    userId: '',
    seat: '',
    name: '',
    paymentId: '',
    bookingDate: '',
    status: 'Pending'
  })
  
  const reservations = ref([
    { id: 1, reservationId: 'R001', seat: '01A', name: 'John Doe', paymentId: 'P1001', bookingDate: '2025-03-09', status: 'Confirmed' },
    { id: 2, reservationId: 'R002', seat: '02B', name: 'Jane Smith', paymentId: 'P1002', bookingDate: '2025-03-09', status: 'Pending' },
    { id: 3, reservationId: 'R003', seat: '03C', name: 'Alice Brown', paymentId: 'P1003', bookingDate: '2025-03-09', status: 'Cancelled' }
  ])
  
  const filteredReservations = computed(() => {
    const q = searchQuery.value.toLowerCase()
    return reservations.value.filter(r =>
      r.reservationId.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.seat.includes(q)
    )
  })
  
  function openModal(res = null, index = null) {
    if (res) {
      form.value = { ...res }
      editIndex.value = index
    } else {
      form.value = {
        id: Date.now(), reservationId: '', userId: '', seat: '', name: '', paymentId: '', bookingDate: '', status: 'Pending'
      }
      editIndex.value = null
    }
    showModal.value = true
  }
  
  function closeModal() {
    showModal.value = false
  }
  
  function saveReservation() {
    if (editIndex.value !== null) {
      reservations.value.splice(editIndex.value, 1, { ...form.value })
    } else {
      reservations.value.push({ ...form.value })
    }
    closeModal()
  }
  
  function deleteReservation(id) {
    if (confirm('Delete this reservation?')) {
      reservations.value = reservations.value.filter(r => r.id !== id)
    }
  }
  
  function switchView() {
    if (!toggleView.value) {
      router.push({ name: 'PassengerManagement', params: { flightId: route.params.flightId, airlineID: route.params.airlineID } })
    }
  }
  
  function goBack() {
    router.back()
  }
  </script>
  
  
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
    padding: 8px 14px; border-radius: 16px; border: 1px solid #ccc; min-width: 240px;
  }
  .add-btn {
    background-color: #f6b52e; color: white; border: none;
    padding: 10px 18px; border-radius: 10px; font-weight: bold; cursor: pointer;
  }
  .passenger-table {
    table-layout: fixed; width: 100%; border-collapse: collapse;
    background-color: white; border-radius: 12px;
    overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
  }
  .passenger-table th, .passenger-table td {
    padding: 14px 16px; font-size: 14px; text-align: left;
    vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
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



</style>
  