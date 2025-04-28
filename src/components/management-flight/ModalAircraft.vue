<script setup>
import { ref, defineProps, defineEmits, watch } from "vue";
import { useAircraftStore } from "@/stores/aircraftStore";
import { useAirlineStore } from "@/stores/airlineStore";
import { onMounted } from "vue";

import Dropdown from "../Dropdown.vue";

const emit = defineEmits(["close"]);
const aircraftStore = useAircraftStore();
const airlineStore = useAirlineStore();

const props = defineProps({
  showAircraft: {
    type: Boolean,
    default: false,
  },
  aircraftID: {
    type: String,
    default: "",
  },
});

onMounted(() => {
  aircraftStore.loadAircrafts();
  airlineStore.loadAirlines();
});

const statusOptions = [
  { value: "available", label: "Available", class: "available" },
  { value: "not-available", label: "Not Available", class: "not-available" },
];

const form = ref({
  airline: "",
  aircraftID: "",
  capacity: 0,
  model: "",
  registrationNumber: "",
  aircraftStatus: "",
});

// ดึงข้อมูลจาก store ตาม aircraftID ที่ส่งเข้ามา
watch(
  () => props.aircraftID,
  (newID) => {
    if (!newID) return;

    const aircraft = aircraftStore.getAircraftByID(newID);
    let airlineNameShort = "";

    if (aircraft?.airlineID) {
      const airline = airlineStore.getAirlineByID(aircraft.airlineID);
      airlineNameShort = airline?.name_short || "";
    }

    if (aircraft) {
      form.value = {
        ...form.value,
        ...aircraft,
        airline: airlineNameShort,
      };
    }
  },
  { immediate: true }
);

const isFormChanged = () => {
  const currentAircraft = aircraftStore.getAircraftByID(form.value.aircraftID);
  return form.value.aircraftStatus !== currentAircraft?.aircraftStatus;
};

const handleClose = () => {
  if (isFormChanged()) {
    aircraftStore.updateAircraftStatus(
      form.value.aircraftID,
      form.value.aircraftStatus
    );
  }
  emit("close");
};
</script>

<template>
  <Transition name="modal-container">
    <div v-if="showAircraft" class="modal-container" @click.self="handleClose">
      <div class="modal-content">
        <div>
          <div class="modal-add-flight">
            <div class="modal-header">
              <div class="modal-action">
                <div class="check-button" @click="handleClose">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.5"
                      y="0.5"
                      width="29"
                      height="29"
                      rx="4.5"
                      fill="#397499"
                      stroke="#397499"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M10.3866 8.40948L14.9996 13.0228L19.6134 8.40948C20.1593 7.86351 21.0445 7.86351 21.5905 8.40948C22.1365 8.95546 22.1365 9.84066 21.5905 10.3866L16.9769 14.9996L21.5905 19.6134C22.1365 20.1593 22.1365 21.0445 21.5905 21.5905C21.0445 22.1365 20.1593 22.1365 19.6134 21.5905L14.9996 16.9769L10.3866 21.5905C9.84066 22.1365 8.95546 22.1365 8.40948 21.5905C7.86351 21.0445 7.86351 20.1593 8.40948 19.6134L13.0228 14.9996L8.40948 10.3866C7.86351 9.84066 7.86351 8.95546 8.40948 8.40948C8.95546 7.86351 9.84066 7.86351 10.3866 8.40948Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>
              <h2>{{ form.model || "No Model" }}</h2>
              <Dropdown
                v-model="form.aircraftStatus"
                :statusOptions="statusOptions"
              >
                <template #trigger="{ selected }">
                  <span
                    :class="['badge', selected?.class?.toLowerCase()]"
                    v-if="selected"
                  >
                    {{ selected.label || form.aircraftStatus }}
                  </span>
                </template>
              </Dropdown>
            </div>

            <div class="form-container">
              <div class="form-row">
                <label>Airline</label>
                <label>AircraftID</label>
                <label>Capacity</label>
              </div>

              <div class="form-row inputs">
                <input type="text" v-model="form.airline" disabled />
                <input type="text" v-model="form.aircraftID" disabled />
                <input type="number" v-model="form.capacity" disabled />
              </div>

              <div
                class="form-row"
                style="
                  grid-template-columns: 2fr 1fr;
                  gap: 20px;
                  align-items: center;
                "
              >
                <label>Model</label>
                <label>RegistrationNumber</label>
              </div>

              <div
                class="form-row inputs"
                style="
                  grid-template-columns: 2fr 1fr;
                  gap: 20px;
                  align-items: center;
                "
              >
                <input type="text" v-model="form.model" disabled />
                <input type="text" v-model="form.registrationNumber" disabled />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* Fade-in for the container (only affects opacity) */
.modal-container-enter-active,
.modal-container-leave-active {
  transition: opacity 0.3s ease;
}
.modal-container-enter-from,
.modal-container-leave-to {
  opacity: 0;
}

/* Add this class to your modal content div and target it with CSS */
.modal-container-enter-active .modal-content {
  transition: transform 0.3s ease;
}
.modal-container-leave-active .modal-content {
  transition: transform 0.3s ease;
}
.modal-container-enter-from .modal-content {
  transform: scale(0.95);
}
.modal-container-leave-to .modal-content {
  transform: scale(0.95);
}

/* ส่วนของ Modal Add Flight */
.modal-add-flight {
  background-color: white;
  border: 1px solid var(--c-navy-light);
  border-radius: 10px;
  width: 100%;
  max-width: 550px;
  padding: 35px;
  font-family: Arial, sans-serif;
  position: relative;
}

/* ส่วนของ Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.modal-action {
  display: flex;
  gap: 10px;
  position: absolute;
  top: -15px;
  right: 0;
}

/* ส่วนของ Open , Close Modal Button */
.check-button,
.close-button {
  cursor: pointer;
}

.check-button:hover svg rect,
.close-button:hover svg rect {
  filter: brightness(0.9);
  transition: filter 0.3s ease;
}

.check-button:active,
.close-button:active {
  transform: scale(0.95);
}

.modal-header h2 {
  font-weight: 600;
  color: #5a6777;
  margin: 0;
  font-size: 22px;
}

/* ส่วนของ Status Selector */
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
  transition: background-color 0.3s ease, color 0.3s ease;
}

.status-button:hover {
  background-color: var(--c-navy-light);
  color: white;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.status-button:active {
  background-color: var(--c-navy-light);
  color: white;
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

.dropdown-icon {
  margin-left: 8px;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.dropdown-icon.open {
  transform: rotate(-135deg);
}
.status-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 5px;
  padding: 0;
  border: 1px solid var(--c-navy-light);
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
}

.status-option {
  padding: 7px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--c-navy-light);
  cursor: pointer;
  border-bottom: 1px solid var(--c-navy-light);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.status-option:hover {
  background-color: #f5f3f3;
}

.status-option span {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 25px;
  border-radius: 15px;
}

.status-option.pending span {
  background-color: var(--c-light-orange);
  color: var(--c-orange);
}

.status-option.completed span {
  background-color: var(--c-soft-blue);
  color: var(--c-navy-light);
}

.status-option.canceled span {
  background-color: var(--c-dark-navy);
  color: var(--c-soft-blue);
}

.status-option.delayed span {
  background-color: var(--c-soft-orange);
  color: var(--c-light-orange);
}

.status-option:last-child {
  border-bottom: none;
}

/* ส่วนของ Form Container */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  align-items: center;
}

.form-row.inputs {
  margin-bottom: 15px;
}

label {
  color: #5a6777;
  font-weight: 500;
  font-size: 16px;
  text-align: start;
}

input {
  border: 1px solid var(--c-navy-light);
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  color: #5a6777;
  background-color: #f0f5fa;
  width: 100%;
  cursor: not-allowed;
}

input::placeholder {
  color: #a0b2c4;
  font-size: 14px;
}

.form-row:last-child input:first-child {
  grid-column: span 1;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
