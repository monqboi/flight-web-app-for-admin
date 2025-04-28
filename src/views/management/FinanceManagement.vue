<template>
  <div class="admin-card finance-management">
    <header class="page-header">
      <div class="left">
        <h2>All Payments</h2>
        <p class="subtitle">Manage payment records</p>
      </div>
      <div class="right">
        <div class="search-container">
          <div class="search-icon">
            <img src="/search-input.svg" alt="Search Input Icon" />
          </div>
          <input
          type="text"
            placeholder="Search User"
            class="search-input"
            v-model="searchQuery"
          />
        </div>
        <select class="status-filter" v-model="statusFilter">
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Success</option>
          <option>Failed</option>
        </select>
        <button class="add-btn" @click="openModal()">+ Add</button>
      </div>
    </header>

    <!-- Payment Table -->
    <div class="table-section payments">
      <div class="table-row table-head">
        <div>Payment ID</div>
        <div>User</div>
        <div>Reservation ID</div>
        <div>Route</div>
        <div>Date</div>
        <div>Amount</div>
        <div>Status</div>
        <div>Actions</div>
      </div>
      <div
        class="table-row"
        v-for="payment in paginatedPayments"
        :key="payment.id"
      >
        <div>{{ payment.id }}</div>
        <div>{{ payment.username }}<br /><span class="small-id">#{{ payment.userId }}</span></div>
        <div>{{ payment.reservationId }}</div>
        <div>{{ payment.route }}</div>
        <div>{{ payment.date }}</div>
        <div>{{ payment.amount }}</div>
        <div>
          <span :class="['status', payment.status.toLowerCase()]">{{ payment.status }}</span>
        </div>
        <div class="action-buttons">
          <button class="action-btn" @click="openEdit(payment)"><font-awesome-icon icon="edit" /></button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Payment Modal -->
    <div class="modal" v-if="showAddModal">
      <div class="modal-content user-form">
        <h3>{{ editingPayment ? 'Edit Payment' : 'Add Payment' }}</h3>
        <div class="form-row">
          <input type="text" v-model="form.id" placeholder="Payment ID"/>
          <input type="text" v-model="form.reservationId" placeholder="Reservation ID" />
        </div>
        <div class="form-row">
          <input type="text" v-model="form.userId" placeholder="User ID" />
          <input type="text" v-model="form.username" placeholder="Username" />
        </div>
        <div class="form-row">
          <input type="text" v-model="form.route" placeholder="Route" />
          <input type="date" v-model="form.date" />
        </div>
        <div class="form-row">
          <input type="number" v-model="form.amount" placeholder="Amount" />
          <select v-model="form.status">
            <option>Pending</option>
            <option>Success</option>
            <option>Failed</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="save-btn" @click="savePayment">✔ Save</button>
          <button class="discard-btn" @click="discardPayment">✖ Discard</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">«</button>
      <button 
        v-for="page in totalPages" 
        :key="page"
        :class="{ active: currentPage === page }"
        @click="currentPage = page"
      >
        {{ page }}
      </button>
      <button :disabled="currentPage === totalPages" @click="currentPage++">»</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import Dropdown from '@/components/Dropdown.vue';
const searchQuery = ref('');
const showAddModal = ref(false);
const editingPayment = ref(false);
const currentPage = ref(1);
const paymentsPerPage = 5;
const statusFilter = ref('');
const showModal = ref(false);

const payments = reactive([
  { id: 'PMT-001', reservationId: 'RSV-2023101', userId: 'USR001', username: 'inwza241', route: 'BKK → JKT', date: '2024-04-01', amount: 5600, status: 'Pending' },
  { id: 'PMT-002', reservationId: 'RSV-2023102', userId: 'USR002', username: 'jaturon93', route: 'DMK → CNX', date: '2024-04-04', amount: 3200, status: 'Success' }
]);

const form = reactive({ id: '', reservationId: '', userId: '', username: '', route: '', date: '', amount: null, status: 'Pending' });

const filteredPayments = computed(() => {
  return payments.filter(p => {
    const matchSearch = !searchQuery.value || p.username.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchStatus =
      statusFilter.value.trim().toLowerCase() === '' ||
      p.status.toLowerCase() === statusFilter.value.trim().toLowerCase();
    return matchSearch && matchStatus;
  });
});


const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * paymentsPerPage;
  return filteredPayments.value.slice(start, start + paymentsPerPage);
});

const totalPages = computed(() => {
  return Math.ceil(filteredPayments.value.length / paymentsPerPage);
});

function openModal(payment = null) {
  if (payment) {
    Object.assign(form, payment);
  } else {
    Object.assign(form, {
      id: '',
      reservationId: '',
      userId: '',
      username: '',
      route: '',
      date: '',
      amount: null,
      status: 'Pending',
    });
  }
  showAddModal.value = true; // ✅ เปลี่ยนตรงนี้
}



function openEdit(payment) {
  editingPayment.value = true;
  Object.assign(form, payment);
  showAddModal.value = true;
}

function savePayment() {
  if (!form.id) return alert('Please enter a Payment ID');

  const duplicate = payments.find(p => p.id === form.id);
  const idx = payments.findIndex(p => p.id === form.id);

  if (idx === -1 && duplicate) {
    return alert('Payment ID already exists!');
  }

  if (idx !== -1) {
    payments[idx] = { ...form };
  } else {
    payments.push({ ...form });
  }

  discardPayment();
}

function discardPayment() {
  Object.assign(form, { id: '', reservationId: '', userId: '', username: '', route: '', date: '', amount: null, status: 'Pending' });
  showAddModal.value = false;
  editingPayment.value = false;
}
</script>

<style scoped> 
/* ── Layout for the FinanceManagement view ── */
/* ✅ New Modernized Finance Management CSS matching User Management theme */

.finance-management {
  background: white;
  border-radius: 24px;
  padding: 32px;
  margin-top: 20px;
  overflow: visible;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header .left {
  display: flex;
  flex-direction: column;
}

.page-header .left h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.page-header .left .subtitle {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.page-header .right {
  display: flex;
  align-items: center;
  gap: 12px;
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

.status-filter {
  padding: 10px 12px;
  border-radius: 24px;
  border: 1px solid #ccc;
  background-color: #fff;
  font-size: 0.95rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.add-btn {
  background-color: #1d3a4c;
  color: white;
  font-size: 1rem;
  border: none;
  padding: 10px 24px;
  border-radius: 24px;
  cursor: pointer;
}

/* --- Table Section --- */
.table-section.payments {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 2fr 2fr 2fr 1.5fr 1.5fr 1fr 1fr;
  padding: 16px 24px;
  align-items: center;
  font-size: 14px;
  color: #333;
  background-color: transparent;
  border-bottom: 3px dashed #e6eff6;
  position: relative;
}

.table-head {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 13px;
  color: #555;
  padding: 16px 0;
  border-bottom: 2px solid #e6eff6;
}

.table-row::before,
.table-row::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  transition: background-color 0.3s ease;
  border-radius: 50%;
  top: 100%;
  transform: translateY(-50%);
  z-index: 2;
  background-color: var(--c-soft-blue);
}

.table-row::before {
  left: -44px;
}

.table-row::after {
  right: -44px;
}

/* Status Badge */
.status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.status.pending {
  background-color: #f6b52e;
  color: white;
}

.status.success {
  background-color: #34c38f;
  color: white;
}

.status.failed {
  background-color: #e74c3c;
  color: white;
}

/* Edit Button */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #1d3a4c;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: 0.2s ease;
  display: flex;
  align-items: center;
}

.action-btn:hover {
  background-color: rgba(0,0,0,0.05);
  color: #f6b52e;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}

.pagination button {
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s ease;
}

.pagination button.active {
  background-color: #4592c3;
  color: white;
  border-color: transparent;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Modal */
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
  z-index: 99;
}

.modal-content.user-form {
  width: 600px;
  background: white;
  border-radius: 12px;
  padding: 30px 40px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.modal-content input,
.modal-content select {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.save-btn,
.discard-btn {
  padding: 10px 25px;
  font-size: 14px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.save-btn {
  background-color: #f6b52e;
  color: white;
}

.discard-btn {
  background-color: #1d3a4c;
  color: white;
}


</style>
