<script setup>
import { useFlightStore } from "@/stores/flightStore";
import { ref, computed, watch, defineEmits, onMounted } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({
  flights: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:paginatedData"]);
const route = useRoute();
const airlineID = Number(route.params.airlineID);
const flightStore = useFlightStore();

const flightData = computed(() => props.flights); 

const itemsPerPage = 6;
const currentPage = ref(1);

//  คำนวณจำนวนหน้าทั้งหมด = จำนวนเที่ยวบิน ÷ จำนวนรายการต่อหน้า
//  flightData.value.length = 12, itemsPerPage = 6, totalPages = 2
const totalPages = computed(() =>
  Math.ceil(flightData.value.length / itemsPerPage)
);

//  คำนวณเที่ยวบินที่จะแสดงในหน้าปัจจุบัน
// [index] = 0-5, 6-11, 12-17, ...
const paginatedFlights = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return flightData.value.slice(start, end);
});

watch(paginatedFlights, (val) => {
  console.log(" paginatedFlights updated and emitted:", val);
});

onMounted(() => {
  console.log("Flights received as props:", props.flights);
  emit("update:paginatedData", paginatedFlights.value);
});

watch(
  () => props.flights,
  () => {
    emit("update:paginatedData", paginatedFlights.value);
  },
  { immediate: true }
);

watch(currentPage, () => {
  emit("update:paginatedData", paginatedFlights.value);
});

// คำนวณว่าจะแสดงเลขหน้าไหนบ้าง
// ถ้าหน้าแรกหรือหน้าสุดท้ายให้แสดงเลขหน้า 1-3 หรือ 2-4
const displayedPages = computed(() => {
  const pages = [];
  let startPage = Math.max(1, currentPage.value - 1); // เริ่มจากหน้าปัจจุบัน - 1 แต่ไม่น้อยกว่า 1
  let endPage = Math.min(totalPages.value, currentPage.value + 1); // จบที่หน้าปัจจุบัน + 1 แต่ไม่เกินหน้าสุดท้าย

  if (endPage - startPage + 1 < 3) {
    if (startPage === 1) {
      endPage = Math.min(3, totalPages.value);
    } else if (endPage === totalPages.value) {
      startPage = Math.max(1, totalPages.value - 2);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
});

// จะแสดงจุดไข่ปลา (...) เมื่อมีจำนวนหน้ามากกว่า 5 หน้า และไม่ได้อยู่ในช่วง 3 หน้าสุดท้าย
const showEllipsis = computed(() => {
  return totalPages.value > 5 && currentPage.value < totalPages.value - 2;
});

function goToPage(page) {
  currentPage.value = page;
  emit("update:paginatedData", paginatedFlights.value)
}

function goToPrevPage() {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1);
  }
}

function goToFirstPage() {
  goToPage(1);
}

function goToLastPage() {
  goToPage(totalPages.value);
}

</script>

<template>
  <div class="pagination-container">
    <button
      class="pagination-button first"
      @click="goToFirstPage"
      :disabled="currentPage === 1"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="11 17 6 12 11 7"></polyline>
        <polyline points="18 17 13 12 18 7"></polyline>
      </svg>
    </button>

    <button
      class="pagination-button prev"
      @click="goToPrevPage"
      :disabled="currentPage === 1"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <button
      v-for="page in displayedPages"
      :key="page"
      class="pagination-button page-number"
      :class="{ active: currentPage === page }"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>

    <span v-if="showEllipsis" class="ellipsis">...</span>

    <button
      class="pagination-button next"
      @click="goToNextPage"
      :disabled="currentPage === totalPages"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>

    <button
      class="pagination-button last"
      @click="goToLastPage"
      :disabled="currentPage === totalPages"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="13 17 18 12 13 7"></polyline>
        <polyline points="6 17 11 12 6 7"></polyline>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
  gap: 8px;
}

.pagination-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background-color: white;
  color: #4592c3;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.pagination-button:hover:not(:disabled):not(.active) {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-button.active {
  background-color: #4592c3;
  color: white;

  font-weight: 600;
}

.ellipsis {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  color: #666;
  font-size: 14px;
}
</style>
