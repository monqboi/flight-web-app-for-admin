<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="management-container">
    <div class="management-menu">
      <!-- User -->
      <div class="management-user-item">
        <div
          class="management-item"
          @click="
            router.push({
              name: 'UserManagement',
            })
          "
        >
          <div class="icon-box">
            <img
              src="/management-pic/management-menu/user-menu-icon.png"
              alt="User Icon"
            />
          </div>
        </div>
        <div class="label-container">
          <div class="label-text">User <br />Management</div>
        </div>
      </div>

      <!-- Flight -->
      <div class="management-flight-item">
        <div
          class="management-item"
          @click="
            router.push({
              name: 'management-airline',
            })
          "
        >
          <div class="icon-box">
            <img
              src="/management-pic/management-menu/flight-menu-icon.png"
              alt="Flight Icon"
            />
          </div>
        </div>
        <div class="label-container">
          <div class="label-text">Airline <br />Management</div>
        </div>
      </div>

      <!-- Payment -->
      <div class="management-payment-item">
        <div
          class="management-item"
          @click="
            router.push({
              name: 'FinanceManagement',
            })
          "
        >
          <div class="icon-box">
            <img
              src="/management-pic/management-menu/payment-menu-icon.png"
              alt="Payment Icon"
            />
          </div>
        </div>
        <div class="label-container">
          <div class="label-text">
            Payment <br />
            Management
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.management-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 40px);
  box-sizing: border-box;
}

.management-menu {
  display: flex;
  gap: 100px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
}

.management-item {
  background-color: #ffffff;
  border-radius: 20px;
  padding: 30px;
  width: 240px;
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-align: center;
  cursor: pointer;
}

.management-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.icon-box img {
  max-width: 100%;
  max-height: 100%;
}

.label-container {
  margin-top: 10px;
  text-align: center;
}

.label-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-dark-blue);
  line-height: 1.2;
}

.sub-text {
  font-size: 16px;
}

.management-payment-item,
.management-flight-item,
.management-user-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
