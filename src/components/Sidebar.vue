<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted } from 'vue'
import api from '/src/utils/api'
import { jwtDecode } from 'jwt-decode'


const route = useRoute()
const router = useRouter()

const userName = ref('Loading...')
const userEmail = ref('Loading...')
const userImage = ref('/src/assets/default-avatar.png')
const token = localStorage.getItem("token");
const decoded = jwtDecode(token);
const userId = decoded.UserID || decoded.userID || decoded.userId;


onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const decoded = jwtDecode(token)
    const userId = decoded.UserID || decoded.userID || decoded.userId

    const res = await api.get(`/users/${userId}`)
    userImage.value = res.data.ProfilePicture && res.data.ProfilePicture.startsWith('data:image')
      ? res.data.ProfilePicture
      : '/src/assets/default-avatar.png'
    userName.value = res.data.Firstname + ' ' + res.data.Lastname
    userEmail.value = res.data.Email
  } catch (err) {
    console.error('Failed to fetch user info:', err)
  }
})


const navItems = [
  { icon: "home", label: "Dashboard", path: "/dashboard" },
  { icon: "users", label: "Management", path: "/management/menu" },
  { icon: "file-text", label: "Reports", path: "/reports" },
  { icon: "active-users", label: "Active Users", path: "/admin-management" },
];

const iconMap = {
  home: "/dashboard-pic/icons/dashboard-icon.svg",
  users: "/dashboard-pic/icons/management-icon.svg",
  "file-text": "/dashboard-pic/icons/reports-icon.svg",
  logout: "/dashboard-pic/icons/logout-icon.svg",
};

const activeUsers = [
  { id: 1, avatar: "https://i.pravatar.cc/40?img=1" },
  { id: 2, avatar: "https://i.pravatar.cc/40?img=2" },
  { id: 3, avatar: "https://i.pravatar.cc/40?img=3" },
  { id: 4, avatar: "https://i.pravatar.cc/40?img=4" },
];
</script>

<template>
  <div class="sidebar">
    <!-- Profile  -->
    <div class="profile-section">
      <div class="profile-container">
        <div class="profile-image">
          <img :src="userImage" alt="Admin profile" />
        </div>
      </div>
      <div class="profile-info">
        <h3>{{ userName }}</h3>
        <p>{{ userEmail }}</p>
        <button class="logout-btn" @click="router.push({ name: 'login' })">
          <div class="icon">
            <img :src="iconMap.logout" alt="Logout icon" />
          </div>
          Log out
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="navigation">
      <ul>
        <li
          v-for="(item, index) in navItems"
          :key="index"
          class="nav-item"
          :class="{
            active:
              (item.label === 'Management' &&
                route.path.includes('/management')) ||
              route.path === item.path,
          }"
          @click="router.push(item.path)"
        >
          <div v-if="item.label !== 'Active Users'" class="nav-item-content">
            <div class="icon">
              <img :src="iconMap[item.icon]" :alt="item.label + ' Icon'" />
            </div>
            <span class="nav-label">{{ item.label }}</span>
          </div>
          <div
            v-else="item.label == 'Active Users'"
            class="active-users-section"
          >
            <div class="avatars-container">
              <div v-for="user in activeUsers" :key="user.id" class="avatar">
                <img :src="user.avatar" alt="User avatar" />
              </div>
              <div class="more-users">+50</div>
            </div>
            <div class="active-label">Active Users</div>
          </div>
        </li>
      </ul>
    </nav>

    <!-- World Map -->
    <div class="world-map">
      <img src="/dashboard-pic/world-map.png" alt="World map" />
    </div>
  </div>
</template>

<style scoped>
/* ส่วนของ Sidebar */
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: var(--c-navy-light);
  color: white;
  display: flex;
  flex-direction: column;
  border-radius: 0 20px 20px 0;
  position: relative;
  overflow: hidden;
}

/* ส่วนของ Profile */
.profile-section {
  background-color: var(--c-dark-navy);
  padding: 30px 0 20px;
  border-radius: 0 20px 20px 0;
  text-align: center;
  margin-bottom: 20px;
}

.profile-container {
  width: 60px;
  height: 60px;
  margin: 0 auto;
  background-color: var(--c-dark-navy);
  border-radius: 50%;
  padding: 3px;
  border: 2px solid var(--c-soft-blue);
}

.profile-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info h3 {
  font-size: 16px;
  margin: 8px 0 0;
  font-weight: 500;
}

.profile-info p {
  font-size: 12px;
  color: var(--c-light-blue);
  margin: 4px 0 8px;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: white;
  border: none;
  border-radius: 16px;
  color: black;
  padding: 1px 8px;
  font-size: 12px;
  cursor: pointer;
  margin: 0 auto;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

/* ส่วนของ Navigation */
.navigation {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 15px;
}

.navigation ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.navigation li:nth-last-child(1) {
  display: flex;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  margin: 6px 0;
  cursor: pointer;
  position: relative;
  margin-right: -16px;
  gap: 12px;
}

.nav-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-item:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.1);
  border-top-left-radius: 25px;
  border-bottom-left-radius: 25px;
  transition: background-color 0.3s ease;
}

.nav-item.active {
  background-color: var(--color-background);
  border-radius: 16px 0 0 16px;
  color: var(--c-dark-navy);
  margin-right: -16px;
  font-weight: 500;
  position: relative;
  border-top-left-radius: 25px;
  border-bottom-left-radius: 25px;
  z-index: 2;
}

.nav-item.active::before,
.nav-item.active::after {
  content: "";
  position: absolute;
  right: 0;
  width: 25px;
  height: 25px;
  background-color: transparent;
  z-index: 1;
}

.nav-item.active::before {
  top: -25px;
  border-bottom-right-radius: 16px;
  box-shadow: 0 12.5px 0 0 var(--color-background);
}

.nav-item.active::after {
  bottom: -25px;
  border-top-right-radius: 16px;
  box-shadow: 0 -12.5px 0 0 var(--color-background);
}

/* ส่วนของ Active Users */
.active-users-section {
  text-align: center;
}

.avatars-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: -8px;
}

.avatar:first-child {
  margin-left: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-users {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--c-soft-blue, #3b82f6);
  color: var(--c-dark-navy);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
  margin-left: -8px;
}

.active-label {
  font-size: 12px;
  color: var(--c-soft-orange, #fbbf24);
  font-weight: 500;
}

.world-map {
  margin-top: auto;
  padding: 15px;
  text-align: center;
}

.world-map img {
  width: 100%;
  max-width: 190px;
  height: auto;
  opacity: 0.9;
}
</style>
