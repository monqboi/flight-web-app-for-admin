<template>
    <div class="layout">
      
      <!-- ========== MAIN CONTENT ========== -->
      <main class="content admin-page">
        <div class="admin-header">
          <h2>All Administrators</h2>
          <div>
            <input
              type="text"
              v-model="search"
              class="search-box"
              placeholder="Search Admin"
            />
            <button class="add-btn" @click="showModal = true">+ Add</button>
          </div>
        </div>
  
        <div class="admin-table admins">
          <div class="table-row table-head">
            <div>Profile</div> 
            <div>Full Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Action</div>
          </div>
          <div
            class="table-row"
            v-for="admin in filteredAdmins"
            :key="admin.UserID"
          >
          <div>
            <img :src="admin.ProfilePicture || '/src/assets/default-avatar.png'" alt="Profile" class="profile-img" />
          </div>
            <div>
              {{ admin.Firstname || admin.Username }} {{ admin.Lastname || '' }}
            </div>
            <div>{{ admin.Email }}</div>
            <div>{{ admin.Role }}</div>
            <div>
              <font-awesome-icon icon="trash" 
                @click="removeAdmin(admin.UserID)"
                class="delete-icon"
              />
            </div>
          </div>
        </div>

        <!-- Modal -->
        <div class="modal" v-if="showModal">
          <div class="modal-content">
            <h3>Add Admin</h3>
            <label>User ID</label>
            <input type="number" v-model="newAdminId" />
            <label>Role</label>
            <select v-model="newAdminRole">
              <option disabled value="">Select Role</option>
              <option>Super Admin</option>
              <option>Flight Admin</option>
              <option>User Admin</option>
              <option>Finance Admin</option>
            </select>
            <div class="modal-actions">
              <button class="save-btn" @click="saveAdmin">Save</button>
              <button class="discard-btn" @click="showModal = false">
                Discard
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'

const search = ref('')
const admins = ref([])
const showModal = ref(false)
const newAdminId = ref('')
const newAdminRole = ref('')

const fetchAdmins = async () => {
  try {
    const res = await api.get('/admins')
    admins.value = res.data

  } catch (err) {
    console.error('โหลดข้อมูลแอดมินล้มเหลว:', err)
  }
}

const saveAdmin = async () => {
  if (!newAdminId.value || !newAdminRole.value) {
    alert('กรุณากรอกข้อมูลให้ครบ')
    return
  }
  try {
    await api.post(`/admins/${newAdminId.value}`, {
      role: newAdminRole.value
    })
    await fetchAdmins()
    showModal.value = false
    newAdminId.value = ''
    newAdminRole.value = ''
  } catch (err) {
    console.error('เพิ่มแอดมินล้มเหลว:', err)
    alert('เพิ่มแอดมินไม่สำเร็จ')
  }
}

const removeAdmin = async (userId) => {
  if (!confirm('ต้องการลบสิทธิ์แอดมินของผู้ใช้นี้หรือไม่?')) return
  try {
    await api.delete(`/admins/${userId}`)
    await fetchAdmins()
  } catch (err) {
    console.error('ลบแอดมินล้มเหลว:', err)
    alert('ลบแอดมินไม่สำเร็จ')
  }
}

const filteredAdmins = computed(() => {
  return admins.value.filter(admin => {
    const name = `${admin.Firstname} ${admin.Lastname}`.toLowerCase()
    return (
      name.includes(search.value.toLowerCase()) ||
      (admin.Email || '').toLowerCase().includes(search.value.toLowerCase()) ||
      admin.Role.toLowerCase().includes(search.value.toLowerCase())
    )
  })
})

onMounted(fetchAdmins)
</script>
  
  <style scoped>
  .layout { display: flex; min-height:100vh; }
  
  .content { flex:1; padding:40px; }
  .admin-header {
    display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;
  }
  .admin-header h2 { margin:0; color:#1d3a4c; font-size:1.4rem; }
  .search-box {
    padding:8px 16px; border:none; border-radius:20px; font-size:1rem;
    width:200px; margin-right:10px;
  }
  .add-btn {
    padding:8px 16px; border:none; background:#1d3a4c;
    color:white; border-radius:20px; font-size:1rem; cursor:pointer;
  }
  .admin-table {
    background:white; border-radius:20px; overflow:hidden;
    box-shadow:0 5px 15px rgba(0,0,0,0.1); padding:10px 0;
  }
  .table-row {
    display:grid; align-items:center; gap:10px;
    padding:10px 40px; border-bottom:1px dashed #ccc;
  }
  .table-row.table-head {
    font-weight: bold;
    background: #f5f5f5;
    border-bottom: 2px solid #ddd;
    grid-template-columns: 1fr 2fr 3fr 1.5fr 1fr;
  }

  .admins .table-row {
    grid-template-columns: 1fr 2fr 3fr 1.5fr 1fr;
  }

  .status {
    padding:3px 10px; border-radius:15px; font-size:12px;
    display:inline-block; font-weight:600; margin-top:4px;
  }
  .status.online  { background:#3f8efc; color:white; }
  .status.offline { background:#ffc107; color:white; }
  .delete-icon { color:#ff5722; cursor:pointer; }
  
  .modal {
    position:fixed; top:0; left:0; width:100vw; height:100vh;
    background:rgba(0,0,0,0.3); display:flex; justify-content:center; align-items:center;
  }
  .modal-content {
    background:white; padding:30px; border-radius:15px;
    width:350px; box-shadow:0 10px 25px rgba(0,0,0,0.2);
  }
  .modal-content h3 { margin-top:0; }
  .modal-content input, .modal-content select {
    width:100%; padding:10px; margin:10px 0; border-radius:8px; border:1px solid #ccc;
  }
  .modal-actions {
    text-align:right; display:flex; gap:10px; justify-content:flex-end;
  }
  .save-btn {
    background:#ffc107; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer;
  }
  .discard-btn {
    background:#1d3a4c; color:white; border:none; padding:8px 16px; border-radius:8px; cursor:pointer;
  }
  .profile-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  </style>
  