<script setup>
import { ref, defineProps, defineEmits, computed, watch } from "vue";
import { useAircraftStore } from "@/stores/aircraftStore";
import { useAirlineStore } from "@/stores/airlineStore";
import { onMounted } from "vue";
import { object, string, number } from "zod";

import ModalConfirm from "../ModalConfirm.vue";
import Dropdown from "../Dropdown.vue";

const props = defineProps({
  showAircraft: Boolean,
  aircraftID: [Number, String],
  airlineID: Number,
  formMode: String
});

const emit = defineEmits(["close", "aircraftAdded"]);
const aircraftStore = useAircraftStore();
const airlineStore = useAirlineStore();
const showConfirmModal = ref(false);
const confirmMode = ref("");
const aircrafts = ref([]);
const aircraft = ref(null);

const statusOptions = [
  { label: "Available", value: "Available", class: "available" },
  { label: "Not Available", value: "Not Available", class: "not-available" },
];

onMounted(() => {
  if (props.airlineID && airlineStore.airlines.length > 0) {
    const airline = airlineStore.getAirlineByID(props.airlineID);
    if (airline) {
      form.value.airline = airline.name;
    }
  }
});

const formSchema = object({
  capacity: number()
    .min(1, "Capacity is required")
    .refine((value) => value > 0, {
      message: "Capacity must be greater than 0.",
    }),
  model: string()
    .min(1, "Model is required")
    .max(50, "Model must be less than 50 characters"),
  registrationNumber: string()
    .min(1, "Registration Number is required")
    .max(20, "Registration Number must be less than 20 characters"),
  aircraftStatus: string().min(1, "Aircraft Status is required"),
  airlineID: number().int().positive("AirlineID is required"),
});

const form = ref({
  capacity: 0,
  model: "",
  registrationNumber: "",
  aircraftStatus: "",
  airlineID: props.airlineID,
});

const loaded = ref(false)

watch(
  () => props.aircraftID,
  async (newID) => {
    if (!newID) return;

    if (aircraftStore.aircraft.length === 0) {
      await aircraftStore.loadAircrafts();
      aircrafts.value = aircraftStore.getAircraftsByAirlineID(props.airlineID); 
    }

    if (airlineStore.airlines.length === 0) {
      await airlineStore.loadAirlines();
    }

    const aircraft = aircraftStore.getAircraftByID(newID);
    const airline = airlineStore.getAirlineByID(aircraft?.airlineID);

    console.log("aircraft:", aircraft);
    console.log("airline:", airline);

    if (aircraft) {
      form.value = {
        ...form.value,
        ...aircraft,
        airline: airline?.name || "",
      };
    }
  },
  { immediate: true }
);

const isFormValid = computed(() => {
  const result = formSchema.safeParse(form.value);
  return result.success;
});

const handleClose = () => {
  confirmMode.value = "discard";
  showConfirmModal.value = true;
  const aircraft = aircraftStore.getAircraftByID(props.aircraftID);

  if (aircraft) {
    form.value = {
      ...form.value,
      ...aircraft,
    };
  }
};

const confirmAddAircraft = () => {
  confirmMode.value = "success";
  showConfirmModal.value = true;

  // aircraftStore.updateAircraft(props.aircraftID, form.value);
};

const addAircraft = async () => {
  try {
    if (props.formMode === "add") {
      await aircraftStore.addAircraft({ ...form.value });
      emit("aircraftAdded", form.value);
    } else if (props.formMode === "edit") {
      await aircraftStore.updateAircraft(props.aircraftID, form.value);
    }
    showConfirmModal.value = false;
    emit("close");
  } catch (error) {
    console.error("Failed to save aircraft:", error);
  }
};

const closeModal = () => {
  showConfirmModal.value = false;
  emit("close");
};

const confirmText = computed(() => {
  if (props.formMode === "add") {
    return confirmMode.value === "success"
      ? "Are you sure you want to add this flight?"
      : "Are you sure you want to discard this flight?";
  } else if (props.formMode === "edit") {
    return confirmMode.value === "success"
      ? "Are you sure you want to edit this flight?"
      : "Are you sure you want to discard this flight?";
  }
  return "";
});
</script>

<template>
  <Transition name="modal-container">
    <div v-if="showAircraft" class="modal-container" @click.self="handleClose">
      <div class="modal-content">
        <div>
          <div class="modal-add-flight">
            <div class="modal-header">
              <div class="modal-action">
                <div
                  @click="isFormValid ? confirmAddAircraft() : null"
                  :class="{ disabled: !isFormValid }"
                  class="check-button"
                >
                  <!-- Confirm Button SVG -->
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <rect
                      x="0.5"
                      y="0.5"
                      width="29"
                      height="29"
                      rx="4.5"
                      fill="#FFB042"
                      stroke="#FFB042"
                    />
                    <path
                      d="M24.6174 8.40514C24.4913 8.27676 24.3414 8.17487 24.1762 8.10534C24.011 8.0358 23.8338 8 23.6548 8C23.4758 8 23.2986 8.0358 23.1334 8.10534C22.9682 8.17487 22.8182 8.27676 22.6922 8.40514L12.5917 18.6227L8.3481 14.322C8.21723 14.1943 8.06276 14.0939 7.89348 14.0265C7.7242 13.9591 7.54345 13.9261 7.36153 13.9293C7.17961 13.9324 7.00009 13.9718 6.83323 14.045C6.66636 14.1183 6.51541 14.2241 6.389 14.3563C6.26259 14.4885 6.16319 14.6445 6.09648 14.8155C6.02978 14.9865 5.99706 15.1691 6.00021 15.3529C6.00335 15.5367 6.0423 15.7181 6.11483 15.8866C6.18735 16.0552 6.29203 16.2077 6.4229 16.3354L11.6291 21.5949C11.7551 21.7232 11.9051 21.8251 12.0703 21.8947C12.2355 21.9642 12.4127 22 12.5917 22C12.7706 22 12.9479 21.9642 13.1131 21.8947C13.2783 21.8251 13.4282 21.7232 13.5543 21.5949L24.6174 10.4185C24.755 10.2903 24.8648 10.1346 24.94 9.96134C25.0151 9.78808 25.0539 9.60098 25.0539 9.41183C25.0539 9.22268 25.0151 9.03558 24.94 8.86232C24.8648 8.68906 24.755 8.5334 24.6174 8.40514Z"
                      fill="white"
                    />
                  </svg>
                </div>
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
              <h2>{{ form.model || "New Model" }}</h2>
              <Dropdown
                v-model="form.aircraftStatus"
                :statusOptions="statusOptions"
              >
                <template #trigger="{ selected }">
                  <span
                    :class="['badge', selected?.class?.toLowerCase()]"
                    v-if="selected"
                  >
                    {{ selected.label }}
                  </span>
                  <span v-else>Select Status</span>
                </template>
              </Dropdown>
            </div>

            <div class="form-container">
              <div
                class="form-row"
                style="
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  align-items: center;
                "
              >
                <label>Airline</label>
                <label>Capacity</label>
              </div>

              <div
                class="form-row inputs"
                style="
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  align-items: center;
                "
              >
              <input
                type="text"
                :value="airlineStore.getAirlineByID(props.airlineID)?.name || 'Unknown Airline'"
                disabled
              />
                <input type="number" v-model="form.capacity" min="0" />
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
                <input type="text" v-model="form.model" />
                <input type="text" v-model="form.registrationNumber" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <ModalConfirm
    :confirmMode="confirmMode"
    :formMode="formMode"
    :isShowConfirmModal="showConfirmModal"
    @closeConfirmModal="showConfirmModal = false"
    @closeModal="closeModal"
    @confirmModal="addAircraft"
  >
    <template #header>
      {{
        confirmMode === "success"
          ? "Success Confirmation"
          : "Discard Confirmation"
      }}
    </template>
    <template #body>
      <p>{{ confirmText }}</p>
    </template>
    <template #footer-summit>
      <p>Yes</p>
    </template>
    <template #footer-cancel>
      <div>Cancel</div>
    </template>
  </ModalConfirm>
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

.check-button.disabled {
  cursor: not-allowed;
  filter: brightness(0.6);
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
}

input::placeholder {
  color: #a0b2c4;
  font-size: 14px;
}

input:disabled {
  cursor: not-allowed;
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
