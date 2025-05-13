<script setup>
import {
  ref,
  defineProps,
  defineEmits,
  computed,
  watch,
  onBeforeUnmount,
} from "vue";
import { object, string } from "zod";
import ModalConfirm from "../ModalConfirm.vue";
import Dropdown from "@/components/Dropdown.vue";
import { useAirlineStore } from "@/stores/airlineStore";

const airlineStore = useAirlineStore();

const emit = defineEmits(["close"]);
const isShowConfirmModal = ref(false);

const showConfirmAddFlight = () => {
  isShowConfirmModal.value = true;
  };

const { isShowModalAddAirline, airlineID, formMode } = defineProps({
  isShowModalAddAirline: {
    type: Boolean,
    default: false,
  },
  airlineID: {
    type: [String, Number],
    default: null,
  },
  formMode: {
    type: String,
    default: "",
  },
});

const confirmMode = ref("");

const statusOptions = [
  { value: "Open", label: "Open", class: "open" },
  { value: "Temporarily closed",label: "Temporarily closed", class: "temporarily-closed" },
];

const formSchema = object({
  name: string()
    .min(1, "Airline name is required")
    .max(100, "Airline name must not exceed 100 characters"),
  code: string()
    .min(1, "Code is required")
    .max(10, "Code must not exceed 10 characters"),
  contactPrefix: string().min(1, "Contact prefix is required"),
  contactNumber: string().min(10, "Contact number is invalid"),
  country: string()
    .min(1, "Country is required")
    .max(50, "Country must not exceed 50 characters"),
  headquarters: string().min(1, "Headquarters is required"),
  airlineImage: string().nullable().optional(),
  airlineStatus: string().min(1, "Airline status is required"),
  airlineColor: string().optional(),
});

// form data
const form = ref({
  name: "",
  code: "",
  contactPrefix: "",
  contactNumber: "",
  country: "",
  headquarters: "",
  airlineImage: null,
  airlineStatus: "",
  airlineColor: "#ffffff",
});

const isFormValid = computed(() => {
  const f = form.value;
  return (
    f.name &&
    f.name_short &&
    f.code &&
    f.contactPrefix &&
    f.contactNumber &&
    f.country &&
    f.headquarters &&
    f.airlineImage &&
    f.airlineStatus
  );
});

const confirmAddAirline = () => {
  if (isFormValid.value) {
    confirmMode.value = "success";
    showConfirmAddFlight();
  }
};

const discardAddAirline = () => {
  confirmMode.value = "discard";
  showConfirmAddFlight();
};

const addAirline = () => {
  if (formMode === "edit") {
    airlineStore.updateAirline(airlineID, { ...form.value });
  } else {
    airlineStore.addAirline({ ...form.value });
  }
  closeModal();
};

const closeModal = () => {
  for (const key in form.value) {
    form.value[key] = typeof form.value[key] === "string" ? "" : null;
  }
  isShowConfirmModal.value = false;
  emit("close");
};

// ส่วนของการอัปโหลดรูปภาพ
const uploadInputRef = ref(null);
const imagePreviewRef = ref(null);

const openUploadImageAirline = () => {
  if (!uploadInputRef.value) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    input.onchange = handleImageUpload;
    document.body.appendChild(input);
    uploadInputRef.value = input;
  }

  uploadInputRef.value.click();
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const imageDataUrl = e.target.result;
    // จำลอง path ที่จะแสดงใน backend
    const mockImagePath = `/uploads/airlines/${file.name}`;
    console.log("mockImagePath:", mockImagePath);
    form.value.airlineImage = imageDataUrl;

    if (imagePreviewRef.value) {
      setTimeout(() => {
        imagePreviewRef.value.style.backgroundImage = `url(${imageDataUrl})`;
        imagePreviewRef.value.style.backgroundSize = "cover";
        imagePreviewRef.value.style.backgroundPosition = "center";
      }, 10);
    } else {
      console.error("ไม่พบองค์ประกอบที่มี imagePreviewRef.value");
    }
  };

  reader.readAsDataURL(file);
  event.target.value = "";
};

onBeforeUnmount(() => {
  uploadInputRef.value = null;
});

const addPlusSign = () => {
  // ตรวจสอบว่า contactPrefix ไม่มีเครื่องหมาย + ข้างหน้า
  if (!form.value.contactPrefix.startsWith('+')) {
    form.value.contactPrefix = '+' + form.value.contactPrefix.replace(/^(\+)?/, '');
  }
};

const modalTitle = computed(() =>
  airlineID ? "Edit Airline Details" : "Add Airline Details"
);

watch(
  () => airlineID,
  (newAirlineID) => {
    if (newAirlineID) {
      const selectedAirline = airlineStore.getAirlineByID(newAirlineID);
      if (selectedAirline) {
        form.value = { ...selectedAirline };
      }
    } else {
      // resetForm();
    }
  },
  { immediate: true }
);

const selecedtedAirline = computed(() => {
  return airlineStore.getAirlineByID(airlineID);
});
</script>

<template>
  <Transition name="modal-container">
    <div
      v-if="isShowModalAddAirline"
      class="modal-container"
      @click.self="closeModal"
    >
      <div class="modal-content">
        <div>
          <div class="modal-add-airline">
            <div class="modal-header">
              <div class="modal-action">
                <div
                  @click="isFormValid ? confirmAddAirline() : null"
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

                <div class="check-button" @click="discardAddAirline">
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
              <h2>{{ modalTitle }}</h2>
              <Dropdown
                v-model="form.airlineStatus"
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

            <div class="pic-detail">
              <div class="profile-pic-wrapper">
                <div class="pic-container">
                  <div
                      class="pic-image"
                      :style="{ backgroundImage: 'url(' + form.airlineImage + ')' }"
                    ></div>
                </div>
                <div class="pic-edit" @click="openUploadImageAirline">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="16"
                      cy="16"
                      r="15.25"
                      fill="#DDE9EF"
                      stroke="#397499"
                      stroke-width="1.5"
                    />
                    <path
                      d="M10.0458 22.1623L10.4866 21.5555L10.4866 21.5555L10.0458 22.1623ZM9.21619 21.3327L8.60942 21.7735L8.60942 21.7735L9.21619 21.3327ZM20.4542 22.1623L20.0134 21.5555L20.0134 21.5555L20.4542 22.1623ZM21.2838 21.3327L20.6771 20.8918L20.6771 20.8918L21.2838 21.3327ZM9.21619 10.9243L8.60942 10.4834L8.60942 10.4834L9.21619 10.9243ZM10.0458 10.0947L10.4866 10.7014L10.4866 10.7014L10.0458 10.0947ZM13.759 10.1338C14.1732 10.1289 14.5049 9.78908 14.4999 9.3749C14.495 8.96071 14.1552 8.62898 13.741 8.63394L13.759 10.1338ZM22.7445 17.6375C22.7495 17.2233 22.4178 16.8835 22.0036 16.8785C21.5894 16.8736 21.2496 17.2053 21.2446 17.6195L22.7445 17.6375ZM15.8482 19.1318L15.7653 18.3864L15.8482 19.1318ZM12.7583 18.9087L12.228 19.439L12.228 19.439L12.7583 18.9087ZM12.5352 15.8189L13.2806 15.9017L12.5352 15.8189ZM13.3956 14.0289L12.8652 13.4985L12.8652 13.4985L13.3956 14.0289ZM12.7322 14.8118L12.0562 14.4869L12.0562 14.4869L12.7322 14.8118ZM17.6382 18.2715L18.1685 18.8018L18.1685 18.8018L17.6382 18.2715ZM16.8553 18.9348L17.1801 19.6108L17.1801 19.6108L16.8553 18.9348ZM15.25 22.8785V22.1285C13.8271 22.1285 12.8202 22.1275 12.0437 22.0433C11.2812 21.9607 10.8304 21.8053 10.4866 21.5555L10.0458 22.1623L9.60497 22.7691C10.247 23.2355 10.9921 23.4382 11.8822 23.5346C12.7582 23.6295 13.8606 23.6285 15.25 23.6285V22.8785ZM8.5 16.1285H7.75C7.75 17.5179 7.74897 18.6203 7.84389 19.4963C7.94032 20.3864 8.14296 21.1315 8.60942 21.7735L9.21619 21.3327L9.82295 20.8918C9.57323 20.5481 9.41777 20.0972 9.33516 19.3348C9.25103 18.5582 9.25 17.5513 9.25 16.1285H8.5ZM10.0458 22.1623L10.4866 21.5555C10.232 21.3705 10.008 21.1465 9.82295 20.8918L9.21619 21.3327L8.60942 21.7735C8.88698 22.1555 9.22294 22.4915 9.60497 22.7691L10.0458 22.1623ZM15.25 22.8785V23.6285C16.6394 23.6285 17.7418 23.6295 18.6178 23.5346C19.5079 23.4382 20.253 23.2355 20.895 22.7691L20.4542 22.1623L20.0134 21.5555C19.6696 21.8053 19.2187 21.9607 18.4563 22.0433C17.6798 22.1275 16.6729 22.1285 15.25 22.1285V22.8785ZM21.2838 21.3327L20.6771 20.8918C20.492 21.1465 20.268 21.3705 20.0134 21.5555L20.4542 22.1623L20.895 22.7691C21.2771 22.4915 21.613 22.1555 21.8906 21.7735L21.2838 21.3327ZM8.5 16.1285H9.25C9.25 14.7056 9.25103 13.6987 9.33516 12.9222C9.41777 12.1597 9.57323 11.7088 9.82295 11.3651L9.21619 10.9243L8.60942 10.4834C8.14296 11.1255 7.94032 11.8705 7.84389 12.7606C7.74897 13.6367 7.75 14.739 7.75 16.1285H8.5ZM10.0458 10.0947L9.60497 9.48791C9.22294 9.76546 8.88698 10.1014 8.60942 10.4834L9.21619 10.9243L9.82295 11.3651C10.008 11.1104 10.232 10.8865 10.4866 10.7014L10.0458 10.0947ZM13.75 9.38389L13.741 8.63394C11.9304 8.65565 10.6195 8.75078 9.60497 9.48791L10.0458 10.0947L10.4866 10.7014C11.0569 10.2871 11.8741 10.1564 13.759 10.1338L13.75 9.38389ZM21.9946 17.6285L21.2446 17.6195C21.2221 19.5044 21.0913 20.3216 20.6771 20.8918L21.2838 21.3327L21.8906 21.7735C22.6277 20.7589 22.7228 19.4481 22.7445 17.6375L21.9946 17.6285ZM21.667 14.2426L21.1367 13.7123L17.1079 17.7412L17.6382 18.2715L18.1685 18.8018L22.1974 14.773L21.667 14.2426ZM13.3956 14.0289L13.9259 14.5592L17.9547 10.5303L17.4244 10L16.8941 9.46967L12.8652 13.4985L13.3956 14.0289ZM15.8482 19.1318L15.7653 18.3864C14.882 18.4846 14.3007 18.5473 13.8736 18.5335C13.4666 18.5204 13.35 18.4397 13.2887 18.3784L12.7583 18.9087L12.228 19.439C12.6764 19.8875 13.2447 20.014 13.8252 20.0327C14.3855 20.0508 15.0943 19.9702 15.931 19.8772L15.8482 19.1318ZM12.5352 15.8189L11.7898 15.7361C11.6968 16.5728 11.6162 17.2815 11.6343 17.8419C11.6531 18.4223 11.7796 18.9906 12.228 19.439L12.7583 18.9087L13.2887 18.3784C13.2273 18.317 13.1467 18.2004 13.1335 17.7934C13.1198 17.3663 13.1825 16.785 13.2806 15.9017L12.5352 15.8189ZM13.3956 14.0289L12.8652 13.4985C12.5329 13.8308 12.235 14.1149 12.0562 14.4869L12.7322 14.8118L13.4082 15.1367C13.4507 15.0481 13.5213 14.9638 13.9259 14.5592L13.3956 14.0289ZM12.5352 15.8189L13.2806 15.9017C13.3438 15.333 13.3656 15.2252 13.4082 15.1367L12.7322 14.8118L12.0562 14.4869C11.8775 14.8588 11.8417 15.269 11.7898 15.7361L12.5352 15.8189ZM17.6382 18.2715L17.1079 17.7412C16.7032 18.1458 16.6189 18.2163 16.5304 18.2589L16.8553 18.9348L17.1801 19.6108C17.5521 19.4321 17.8362 19.1341 18.1685 18.8018L17.6382 18.2715ZM15.8482 19.1318L15.931 19.8772C16.3981 19.8253 16.8082 19.7896 17.1801 19.6108L16.8553 18.9348L16.5304 18.2589C16.4418 18.3014 16.3341 18.3232 15.7653 18.3864L15.8482 19.1318ZM21.667 10L21.1367 10.5303C21.6517 11.0453 21.9835 11.3793 22.1958 11.6576C22.3949 11.9186 22.417 12.0406 22.417 12.1213H23.167H23.917C23.917 11.5807 23.6892 11.1421 23.3883 10.7477C23.1006 10.3707 22.6824 9.95468 22.1974 9.46967L21.667 10ZM21.667 14.2426L22.1974 14.773C22.6824 14.288 23.1006 13.872 23.3883 13.4949C23.6892 13.1005 23.917 12.6619 23.917 12.1213H23.167H22.417C22.417 12.2021 22.3949 12.3241 22.1958 12.585C21.9835 12.8633 21.6517 13.1973 21.1367 13.7123L21.667 14.2426ZM21.667 10L22.1974 9.46967C21.7124 8.98466 21.2964 8.56643 20.9193 8.27873C20.5249 7.97783 20.0863 7.75 19.5457 7.75V8.5V9.25C19.6265 9.25 19.7485 9.27217 20.0094 9.47127C20.2877 9.68357 20.6217 10.0153 21.1367 10.5303L21.667 10ZM17.4244 10L17.9547 10.5303C18.4697 10.0153 18.8037 9.68357 19.082 9.47127C19.343 9.27217 19.465 9.25 19.5457 9.25V8.5V7.75C19.0051 7.75 18.5665 7.97783 18.1721 8.27873C17.7951 8.56643 17.3791 8.98466 16.8941 9.46967L17.4244 10ZM21.667 14.2426L22.1974 13.7123L17.9547 9.46967L17.4244 10L16.8941 10.5303L21.1367 14.773L21.667 14.2426Z"
                      fill="#397499"
                    />
                  </svg>
                </div>
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
                  <label>Airline Name</label>
                  <label>Code</label>
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
                    placeholder="Enter Airline Name"
                    maxlength="100"
                    v-model="form.name"
                  />
                  <input 
                    type="text" 
                    placeholder="- -" 
                    maxlength="10"
                    v-model="form.code" />
                </div>

                <div
                  class="form-row"
                  style="
                    grid-template-columns: 0.5fr 1fr 2fr;
                    gap: 20px;
                    align-items: center;
                  "
                >
                  <label>Contact</label>
                  <label style="grid-column: 3">Country</label>
                </div>

                <div
                  class="form-row inputs"
                  style="
                    grid-template-columns: 0.5fr 1fr 2fr;
                    gap: 20px;
                    align-items: center;
                  "
                >
                  <input
                    type="text"
                    placeholder="+66"
                    maxlength="3"
                    v-model="form.contactPrefix"
                    @input="addPlusSign"
                  />
                  <input
                    type="text"
                    placeholder="1234567890"
                    maxlength="11"
                    v-model="form.contactNumber"
                  />
                  <input
                    type="text"
                    placeholder="Enter Country"
                    maxlength="50"
                    v-model="form.country"
                  />
                </div>

                <div
                  class="form-row"
                  style="
                    grid-template-columns: 0.8fr 1fr 2fr;
                    gap: 20px;
                    align-items: center;
                  "
                >
                  <label>Short Name</label>
                  <label>Airline Color</label>
                  <label>Headquarters</label>
                </div>

                <div
                  class="form-row inputs"
                  style="
                    grid-template-columns: .4fr .4fr 1fr;
                    gap: 20px;
                    align-items: center;
                  "
                >
                  <input
                    type="text"
                    placeholder="- - -"
                    maxlength="10"
                    v-model="form.name_short"
                  />
                  <input
                    type="color"
                    v-model="form.airlineColor"
                    style="width: 100%; height: 100%"
                  />
                  <input
                    type="text"
                    placeholder="Enter Headquarters of Airline"
                    maxlength="50"
                    v-model="form.headquarters"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <ModalConfirm
    :confirmMode="confirmMode"
    :isShowConfirmModal="isShowConfirmModal"
    @closeConfirmModal="isShowConfirmModal = false"
    @closeModal="closeModal"
    @confirmModal="addAirline"
  >
    <template #header>
      {{
        confirmMode === "success"
          ? "Success Confirmation"
          : "Discard Confirmation"
      }}
    </template>
    <template #body>
      <p>
        {{
          confirmMode === "success"
            ? "Are you sure you want to add this airline?"
            : "Are you sure you want to discard this airline?"
        }}
      </p>
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
.modal-add-airline {
  background-color: white;
  border: 1px solid var(--c-navy-light);
  border-radius: 10px;
  width: 100%;
  max-width: 760px;
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
  right: 35px;
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

.pic-detail {
  display: flex;
  gap: 35px;
  align-items: center;
}

.pic-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 165px;
  height: 165px;
  border-radius: 50%;
  background-color: #f0f5fa;
  overflow: hidden;
  border: 1px solid var(--c-navy-light);
  flex-shrink: 0;
}

.pic-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

/* สร้าง wrapper ที่จะครอบทั้ง container และปุ่ม edit */
.profile-pic-wrapper {
  position: relative;
  width: fit-content;
  height: fit-content;
}

.pic-edit {
  position: absolute;
  bottom: 10px;
  right: 1px; /* ให้ยื่นออกไปทางขวาของ container */
  cursor: pointer;
  z-index: 2;
}

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
