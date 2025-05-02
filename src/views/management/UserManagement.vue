<template>
  <div class="admin-card user-management">
  <div class="card-header">
    <div class="left">
      <h2>All Users</h2>
      <p class="subtitle">Manage registered user information</p>
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
            v-model="search"
          />
        </div>
      <button class="add-btn" @click="showAddModal = true">+ Add</button>
    </div>
  </div>

  <div class="table-section users">
      <div class="table-row table-head">
        <div>Profile</div>
        <div>User ID</div>
        <div>Username</div>
        <div>Status</div>
        <div>Name</div>
        <div>Email</div>
        <div>Actions</div>
      </div>
      <div
        class="table-row"
        v-for="user in paginatedUsers"
        :key="user.id"
        :class="{ suspended: user.status === 'Suspended' }"
      >
      <div>
        <img :src="user.profile || '/src/assets/default-avatar.png'" alt="Avatar" class="table-avatar" />
      </div>
        <div><span :class="{ strike: user.status === 'Suspended' }">{{ user.id }}</span></div>
        <div><span :class="{ strike: user.status === 'Suspended' }">{{ user.username }}</span></div>
        <div>
          <span
            class="status suspended"
            v-if="user.status === 'Suspended'"
          >
            Suspended
          </span>
          <span class="status active" v-else>Active</span>
        </div>
        <div><span :class="{ strike: user.status === 'Suspended' }">{{ user.firstname }} {{ user.lastname }}</span></div>
        <div><span :class="{ strike: user.status === 'Suspended' }">{{ user.email }}</span></div>
        <div class="action-buttons">
          <router-link 
            :to="{ name: 'modify-user', params: { id: user.id } }"
            class="action-btn"
            title="Edit"
          >
            <font-awesome-icon icon="edit" />
          </router-link>
          
          <button 
            class="action-btn"
            @click="toggleSuspend(user)"
            :title="user.status === 'Suspended' ? 'Unsuspend' : 'Suspend'"
          >
            <font-awesome-icon :icon="user.status === 'Suspended' ? 'undo' : 'user-slash'" />
          </button>
          
          <button 
            class="action-btn"
            @click="deleteUser(user.id)"
            title="Delete"
          >
            <font-awesome-icon icon="trash" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div class="modal" v-if="showAddModal">
      <div class="modal-content user-form">
        <h3>Add User</h3>
        <div class="profile-upload">
          <label class="avatar-wrapper">
            <img :src="newUser.profile || defaultAvatar"  alt="Avatar" />
            <input type="file" accept="image/*" @change="onFileChange" />
            <span class="upload-icon">+</span>
          </label>
        </div>
        <div class="form-row">
          <input type="email" v-model="newUser.email" placeholder="Email" />
          <input type="text" v-model="newUser.phone" placeholder="Phone" />
        </div>
        <div class="form-row">
          <input type="text" v-model="newUser.firstname" placeholder="First name" />
          <input type="text" v-model="newUser.middlename" placeholder="Middle name" />
          <input type="text" v-model="newUser.lastname" placeholder="Last name" />
        </div>
        <div class="form-row">
          <input type="text" v-model="newUser.username" placeholder="Username" />
          <input type="password" v-model="newUser.password" placeholder="Password" />
        </div>
        <div class="modal-actions">
          <button class="save-btn" @click="addUser">✔ Save</button>
          <button class="discard-btn" @click="discardAddUser">✖ Discard</button>
        </div>
      </div>
    </div>


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
import { useRouter } from 'vue-router';
import { watchEffect } from 'vue';
import defaultAvatar from '@/assets/default-avatar.png';  

// State
const search = ref('');
const showAddModal = ref(false);
const showEditModal = ref(false);
const users = reactive([
  { id: 1, firstname: 'Alice', middlename: 'B.', lastname: 'Brown', email: 'alice@example.com', phone: '0812345678', passport: 'A12345678', username: 'alicebrown', password: 'secret123', status: 'Active' },
  { id: 2, firstname: 'Bob', middlename: '', lastname: 'Smith', email: 'bob@example.com', phone: '0823456789', passport: 'B98765432', username: 'bobsmith', password: 'password456', status: 'Inactive' }
]);

const currentPage = ref(1);
const usersPerPage = 5;

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * usersPerPage;
  return sortedUsers.value.slice(start, start + usersPerPage);
});

const totalPages = computed(() => {
  return Math.ceil(sortedUsers.value.length / usersPerPage);
});


const newUser = reactive({  profile: '', firstname: '', middlename: '', lastname: '', email: '', phone: '', passport: '', username: '', password: '', status: 'Active' });

let editUser = reactive(null);

// Computed
const filteredUsers = computed(() =>
  users.filter(u =>
    (`${u.firstname} ${u.lastname}`.toLowerCase().includes(search.value.toLowerCase()) ||
     u.email.toLowerCase().includes(search.value.toLowerCase()) ||
     u.username.toLowerCase().includes(search.value.toLowerCase()))
  )
);
const sortedUsers = computed(() => {
  const active = filteredUsers.value.filter(u => u.status !== 'Suspended');
  const suspended = filteredUsers.value.filter(u => u.status === 'Suspended');
  return [...active, ...suspended];
});

// Methods
function addUser() {
  if (!newUser.firstname || !newUser.email) return alert('Please fill required fields');

  users.push({ id: Date.now(), ...newUser }); // ชั่วคราว

  Object.assign(newUser, {
    profile: '',
    firstname: '', middlename: '', lastname: '',
    email: '', phone: '', passport: '',
    username: '', password: '', status: 'Active'
  });

  showAddModal.value = false;
  search.value = ''; // ✅ Reset search input

  // ตรวจสอบว่า pagination ยังอยู่ในหน้าที่ valid
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value || 1;
  }

  watchEffect(() => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value || 1;
  }
  });
}
function onFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      newUser.profile = reader.result;
    };
    reader.readAsDataURL(file);
  }
}
function toggleSuspend(user) {
  user.status = user.status === 'Suspended' ? 'Active' : 'Suspended';
}
function deleteUser(id) {
  if (confirm('Confirm delete?')) users.splice(users.findIndex(u => u.id === id), 1);
}
function discardAddUser() {
  Object.assign(newUser, {
    profile: '',
    firstname: '', middlename: '', lastname: '',
    email: '', phone: '', passport: '',
    username: '', password: '', status: 'Active'
  });
  showAddModal.value = false;
}

</script>

<style scoped>
/* --- Router Link Looks Like Button --- */
.action-buttons a {
  text-decoration: none;
}
/* --- Strike style for suspended --- */
.strike {
  text-decoration: line-through;
  opacity: 0.6;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.action-buttons i {
  cursor: pointer;
  font-size: 16px;
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
    z-index: 99; /* สูงกว่า pagination แน่นอน */
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
/* Save / Discard button look */
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
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #1d3a4c;
  font-size: 16px;
  padding: 5px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
}

.action-btn:hover {
  color: #f6b52e;
  background: rgba(0,0,0,0.05);
}

/* Make router-link look like a button */
.action-buttons a {
  text-decoration: none;
}

/* Layout padding */
.content.admin-page.user-management {
  padding: 40px;
}

/* Header section */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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


.add-btn {
  background-color: #1d3a4c;
  color: white;
  font-size: 1rem;
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  cursor: pointer;
}

/* Status badge */
.status {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.status.active {
  background-color: #3f8efc;
  color: white;
}

.status.suspended {
  background-color: #c0c0c0;
  color: white;
}

.strike {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #1d3a4c;
  padding: 6px;
  display: flex;
  align-items: center;
  transition: 0.2s ease;
  border-radius: 6px;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #f6b52e;
}

.action-buttons a {
  text-decoration: none;
}

.admin-card.user-management {
  background: white;
  border-radius: 24px;
  padding: 32px;
  margin-top: 20px;
  position: relative;
  overflow: visible;
}

/* Ticket half-circle edge effect */

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header .left h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.card-header .left .subtitle {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.card-header .right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-section.users {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 2fr 3fr 1.5fr;
  padding: 16px 24px;
  align-items: center;
  background: #fff;
  font-size: 14px;
  color: #333;
  background-color: transparent; /* ไม่มีสีพื้นหลัง */
  border-radius: 0; /* ตัดมุมโค้ง */
  box-shadow: none; /* ตัดเงา */
  border-bottom: 3px dashed #e6eff6; 
  position: relative;
}
.table-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}


.table-head {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 13px;
  color: #555;
  background-color: transparent;
  padding: 16px 16px;
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
  top: 100%; /* 👉 อยู่พอดีกับเส้นล่าง */
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

.profile-upload {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.avatar-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: visible; 
  border: 4px solid #fff;
  box-shadow: 0 0 0 4px #f6f6f6;
  cursor: pointer;
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block; /* ✅ ป้องกันการมี margin/padding แอบแฝง */
}

.avatar-wrapper input {
  display: none;
}

.upload-icon {
  position: absolute;
  bottom: 0px; /* ✅ เปลี่ยนเป็น 0 */
  right: 0px;   /* ✅ เปลี่ยนเป็น 0 */
  background: #1d3a4c;
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

</style>
