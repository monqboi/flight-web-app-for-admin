<template>
  <div class="content modify-user-page" v-if="user">
    <!-- Top Bar -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack"><font-awesome-icon icon="arrow-left" /></button>
      <div class="user-id-header">
        <h2>{{ user.Username }}</h2>
        <p>#{{ user.UserID }}</p>
      </div>
      <button class="save-btn" @click="saveChanges">Save <font-awesome-icon icon="check" /></button>
    </div>

    <!-- Two-Panel Layout -->
    <div class="modify-user-layout">
      <!-- Left: User Details Form -->
      <section class="user-details-panel">
        <div class="user-photo">
          <label class="photo-wrapper">
            <img :src="user.ProfilePicture?.startsWith('data:image') ? user.ProfilePicture : '/src/assets/default-avatar.png'" alt="User Photo" />
            <input type="file" accept="image/*" @change="onFileChange" />
            <span class="edit-icon">
              <font-awesome-icon icon="pen-to-square" />
            </span>
          </label>
          <h3>{{ user.Firstname }} {{ user.Middlename }} {{ user.Lastname }}</h3>
        </div>

        <div class="user-edit-fields">
          <div v-for="field in editableFields" :key="field.key" class="field-row">
            <font-awesome-icon :icon="getIconName(field.icon)" />
            <input v-model="user[field.key]" :placeholder="field.label" />
          </div>
        </div>
      </section>

      <!-- Right: Summary Panels -->
      <section class="user-summary-panel">
        <!-- Booking Section -->
        <div class="booking-section">
          <h3>Booking</h3>
          <div class="booking-box">
            <div v-if="bookings.length > 0" class="booking-cards">
              <div v-for="(b, i) in bookings" :key="i" class="booking-card">
                <div class="booking-left">
                  <img src="/src/assets/plane-fly.png" class="plane-icon" />
                  <div class="flight-info">
                    <strong>{{ b.from_location }}</strong>
                    <span>{{ formatDateTime(b.depart) }}</span>
                  </div>
                </div>
                <div class="booking-middle">
                  <img src="/src/assets/fly-duration.png" class="fly-line" />
                  <p class="duration">{{ minutesToHours(b.duration)}}</p>
                  <p class="stops">{{ b.stops || '-' }}</p>
                </div>
                <div class="booking-right">
                  <img src="/src/assets/plane-land.png" class="plane-icon" />
                  <div class="flight-info">
                    <strong>{{ b.to_location }}</strong>
                    <span>{{ formatDateTime(b.arrive) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-data-card">
              <img src="/src/assets/empty.png" alt="No bookings" />
              <p class="no-data-text">This user has no booking records</p>
            </div>
          </div>
        </div>

        <!-- Payment Section -->
        <div class="payment-section">
          <h3>Payment</h3>
          <div v-if="payments.length > 0">
          <table class="payment-table">
            <thead>
              <tr>
                <th>ReservationID</th>
                <th>Route</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in payments" :key="i">
                <td>{{ p.paymentId }}</td>
                <td>{{ p.route }}</td>
                <td>{{ p.date }}</td>
                <td>{{ p.amount }}</td>
                <td><span :class="['badge', p.status.toLowerCase()]">{{ p.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-data-card">
          <img src="/src/assets/empty.png" alt="No payments" />
          <p class="no-data-text">This user has no payment history</p>
        </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '/src/utils/api'
import { formatDateTime } from "@/utils/timeFunction";

const router = useRouter()
const route = useRoute()
const userId = route.params.id

const user = ref({})
const bookings = ref([])
const payments = ref([])

const editableFields = [
  { key: 'Username', label: 'Username', icon: 'user' },
  { key: 'Password', label: 'Password', icon: 'lock' },
  { key: 'Firstname', label: 'First name', icon: 'user-tag' },
  { key: 'Middlename', label: 'Middle name', icon: 'user-tag' },
  { key: 'Lastname', label: 'Last name', icon: 'user-tag' },
  { key: 'Email', label: 'Email', icon: 'envelope' },
  { key: 'Phone', label: 'Phone', icon: 'phone' },
]

function getIconName(oldIcon) {
  return oldIcon.replace('fas fa-', '')
}

function goBack() {
  router.back()
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      user.value.ProfilePicture = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

async function saveChanges() {
  try {
    await api.put(`/users/${userId}`, user.value)

    if (user.value.ProfilePicture?.startsWith('data:image')) {
      await api.post(`/users/${userId}/profile`, {
        imageUrl: user.value.ProfilePicture
      })
    }

    alert('ข้อมูลถูกบันทึกแล้ว')
    router.push({ name: 'UserManagement' }).then(() => {
      window.location.reload()
    })
  } catch (err) {
    console.error('บันทึกไม่สำเร็จ:', err)
    alert('บันทึกไม่สำเร็จ')
  }
}

onMounted(async () => {
  try {
    const res = await api.get(`/users/${userId}`)
    user.value = res.data
  } catch (err) {
    console.error('โหลดข้อมูลผู้ใช้ล้มเหลว:', err)
  }

  try {
    const res = await api.get(`/users/${userId}/bookings`)
    bookings.value = res.data
  } catch (err) {
    console.warn('ไม่มีข้อมูล booking:', err.message)
  }

  try {
    const res = await api.get(`/users/${userId}/payments`)
    payments.value = res.data
  } catch (err) {
    console.warn('ไม่มีข้อมูล payment:', err.message)
  }
})

</script>

<style scoped>
/* Your existing styles remain unchanged */
.modify-user-page { padding: 30px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.back-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
.save-btn { background-color: #f6b52e; color: white; padding: 10px 25px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }

.modify-user-layout { display: flex; gap: 30px; }
.user-details-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.1);
  max-height: fit-content; /* ✅ ไม่ให้ยืดเกินเนื้อหา */
  align-self: flex-start;   /* ✅ ปรับให้ยึดตามเนื้อหา ไม่ยืดตาม column */
}
.user-photo { text-align: center; margin-bottom: 20px; }
.user-photo img { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; border: 5px solid #f6b52e; }
.user-photo h3 { font-size: 18px; margin-top: 15px; }
.field-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.field-row input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }

.user-summary-panel { flex: 1.5; display: flex; flex-direction: column; gap: 15px; }
.booking-section h3, .payment-section h3 { margin-bottom: 10px; }
.booking-box { background: white; padding: 25px 20px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 10px; }
.booking-cards { display: flex; flex-direction: column; gap: 15px; }
.booking-card { display: flex; justify-content: center; align-items: center; gap: 60px; background: #dde9ef; border-radius: 12px; padding: 20px 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.booking-left, .booking-right { display: flex; align-items: center; gap: 15px; flex: 1; }
.flight-info { display: flex; flex-direction: column; font-size: 14px; }
.flight-info strong { font-weight: bold; color: #2c3e50; }
.flight-info span { color: #326992; font-weight: bold; }
.booking-middle { text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.booking-middle .fly-line { width: 100px; object-fit: contain; }
.duration, .stops { font-size: 12px; color: #888; margin: 1px 0; }

.payment-section table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.05); }
.payment-section th, .payment-section td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
.payment-section th { background: #f5f5f5; }
.badge.pending { background-color: #f6b52e; }
.badge.successful { background-color: #4caf50; color: #ffffff}
.badge.failed  { background-color: #d32f2f; color: #ffffff}
.photo-wrapper {
  top: 25px;
  position: relative;
  display: inline-block;
  width: 160px;
  height: 160px;
}
.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.photo-wrapper img {
  top: 25px;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 5px solid #f6b52e;
}

.photo-wrapper input[type="file"] {
  display: none;
}

.edit-icon {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  background-color: #1d3a4c;
  color: white;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  z-index: 1;
}
.user-details-panel {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.modify-user-layout {
  display: flex;
  gap: 30px;
  align-items: stretch; /* ✅ new */
}
.field-row input {
  font-size: 14px;
  padding: 10px 12px;
}

.no-data-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  color: #999;
  background: #ffffff;
  border-radius: 12px;
}

.no-data-card img {
  width: 120px;
  height: auto;
  opacity: 0.6;
  margin-bottom: 1rem;
}

.no-data-text {
  font-style: italic;
  font-size: 1rem;
}

</style>