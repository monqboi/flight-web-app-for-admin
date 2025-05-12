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
        :key="user.UserID"
        :class="{ suspended: user.UserStatus === 'Suspended' }"
      >
       <img
        :src="isValidBase64Image(user.ProfilePicture) ? user.ProfilePicture : '/src/assets/default-avatar.png'"
        alt="Avatar"
        class="table-avatar"
      />
        <div><span :class="{ strike: user.UserStatus === 'Suspended' }">{{ user.UserID }}</span></div>
        <div><span :class="{ strike: user.UserStatus === 'Suspended' }">{{ user.Username }}</span></div>
        <div>
          <span class="status suspended" v-if="user.UserStatus === 'Suspended'">Suspended</span>
          <span class="status active" v-else>Active</span>
        </div>
        <div><span :class="{ strike: user.UserStatus === 'Suspended' }">{{ user.Firstname }} {{ user.Lastname }}</span></div>
        <div><span :class="{ strike: user.UserStatus === 'Suspended' }">{{ user.Email }}</span></div>
        <div class="action-buttons">
          <router-link :to="{ name: 'modify-user', params: { id: user.UserID } }" class="action-btn" title="Edit">
            <font-awesome-icon icon="edit" />
          </router-link>

          <button class="action-btn" @click="toggleSuspend(user)" :title="user.UserStatus === 'Suspended' ? 'Unsuspend' : 'Suspend'">
            <font-awesome-icon :icon="user.UserStatus === 'Suspended' ? 'undo' : 'user-slash'" />
          </button>

          <button class="action-btn" @click="deleteUser(user.UserID)" title="Delete">
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
            <img :src="newUser.profile || '/src/assets/default-avatar.png'" alt="Avatar" />
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
import { ref, computed, onMounted, watchEffect } from 'vue'
import api from '/src/utils/api'

const usersAll = ref([])
const currentPage = ref(1)
const pageSize = ref(5)
const showAddModal = ref(false)
const search = ref('')

const newUser = ref({
  profile: '',
  firstname: '',
  middlename: '',
  lastname: '',
  email: '',
  phone: '',
  passport: '',
  username: '',
  password: '',
  status: 'Active',
  nationality: '',
  birthdate: '',
  address: ''
})

const filteredUsers = computed(() =>
  usersAll.value.filter(u =>
    (`${u.Firstname} ${u.Lastname}`.toLowerCase().includes(search.value.toLowerCase()) ||
     u.Email.toLowerCase().includes(search.value.toLowerCase()) ||
     u.Username.toLowerCase().includes(search.value.toLowerCase()))
  )
)

const sortedUsers = computed(() => {
  const active = filteredUsers.value.filter(u => u.UserStatus !== 'Suspended')
  const suspended = filteredUsers.value.filter(u => u.UserStatus === 'Suspended')
  return [...active, ...suspended]
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedUsers.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  return Math.ceil(sortedUsers.value.length / pageSize.value)
})

const fetchUsers = async () => {
  try {
    const res = await api.get('/users')
    usersAll.value = res.data.map(normalizeUserFields)
  } catch (err) {
    console.error('โหลดข้อมูลผู้ใช้ล้มเหลว:', err)
  }
}


const addUser = async () => {
  
  if (!newUser.value.firstname || !newUser.value.email || !newUser.value.username || !newUser.value.password) {
    alert('กรุณากรอกข้อมูลที่จำเป็น')
    return
  }
  try {
    const res = await api.post('/users', newUser.value)

    if (newUser.value.profile) {
      await api.post(`/users/${res.data.userId}/profile`, {
        imageUrl: newUser.value.profile
      })
    }

    await fetchUsers()
    discardAddUser()
  } catch (err) {
    if (err.response?.status === 409) {
      alert('Username หรือ Email นี้ถูกใช้ไปแล้ว')
    } else {
      console.error('เพิ่มผู้ใช้ล้มเหลว:', err)
    }
  }
  
}

const deleteUser = async (id) => {
  if (!confirm('ยืนยันการลบผู้ใช้งาน?')) return
  try {
    await api.delete(`/users/${id}`)
    await fetchUsers()
  } catch (err) {
    console.error('ลบผู้ใช้ล้มเหลว:', err)
  }
}

const toggleSuspend = async (user) => {
  const newStatus = user.UserStatus === 'Suspended' ? 'Active' : 'Suspended'
  try {
    await api.patch(`/users/${user.UserID}/status`, { status: newStatus })
    await fetchUsers()
  } catch (err) {
    console.error('เปลี่ยนสถานะล้มเหลว:', err)
  }
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      newUser.value.profile = reader.result
    }
    reader.readAsDataURL(file)
  }
}
function getValidProfilePicture(pic) {
  if (!pic || typeof pic !== 'string') return '/src/assets/default-avatar.png'

  // ✅ ถ้าเริ่มด้วย data:image = base64 valid
  if (pic.startsWith('data:image')) return pic

  // ✅ ถ้า pic เป็น URL ที่สมบูรณ์ เช่น https://example.com/image.jpg
  try {
    const url = new URL(pic)
    return url.href
  } catch {
    return '/src/assets/default-avatar.png'
  }
}
function isValidBase64Image(str) {
  if (!str || typeof str !== 'string') return false
  if (!str.startsWith('data:image')) return false
  try {
    const base64Part = str.split(',')[1]
    atob(base64Part) 
    return true
  } catch {
    return false
  }
}

function discardAddUser() {
  Object.assign(newUser.value, {
    profile: '',
    firstname: '', middlename: '', lastname: '',
    email: '', phone: '', passport: '',
    username: '', password: '', status: 'Active',
    nationality: '', birthdate: '', address: ''
  })
  showAddModal.value = false
  search.value = ''
}
function normalizeUserFields(u) {
  return {
    ...u,
    Username: u.Username || u.username || '',
    Firstname: u.Firstname || u.firstname || '',
    Middlename: u.Middlename || u.middlename || '',
    Lastname: u.Lastname || u.lastname || '',
    Email: u.Email || u.email || '',
    Phone: u.Phone || u.phone || '',
    UserStatus: u.UserStatus || u.status || 'Active',
    ProfilePicture: u.ProfilePicture || u.profile || ''
  }
}

watchEffect(() => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value || 1
  }
  fetchUsers()
})

onMounted(() => {
  fetchUsers()
})
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
  grid-template-columns: 1.3fr 1fr 2.5fr 1.3fr 2.5fr 3.5fr 1.5fr;
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
