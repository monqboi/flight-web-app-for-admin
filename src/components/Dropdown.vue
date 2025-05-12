<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const modelValue = defineModel(); // <-- bind v-model ได้โดยตรง
const props = defineProps({
  statusOptions: {
    type: Array,
    required: true,
    default: () => [],
  },
});

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", handleClickOutside);
});

const emit = defineEmits(["update:modelValue"]);
const isOpen = ref(false);
const dropdownRef = ref(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (value) => {
  emit("update:modelValue", value);
  isOpen.value = false;
};

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

const selectedOption = computed(() => {
  if (!props.statusOptions || !Array.isArray(props.statusOptions)) {
    return null;
  }
  return props.statusOptions.find((opt) => opt.value === props.modelValue);
});
</script>

<template>
  <div class="status-selector" ref="dropdownRef" @click.stop="toggleDropdown">
    <div
      class="status-button"
      :style="{ justifyContent: selectedOption ? 'center' : 'space-between' }"
    >
      <div>
        <slot name="trigger" :selected="selectedOption"></slot>
      </div>
      <span
        class="dropdown-icon"
        :class="{ open: isOpen }"
        v-if="!selectedOption"
      ></span>
    </div>

    <div v-if="isOpen" class="status-dropdown" @click.stop>
      <div
        v-for="(option, index) in statusOptions"
        :key="index"
        :class="['status-option', String(option.class).toLowerCase()]"
        @click="selectOption(option.value)"
      >
        <span>{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-selector {
  position: relative;
}

.status-button {
  padding: 10px 15px;
  width: 200px;
  height: 40px;
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

.status-trigger {
  flex: 1;
  display: flex;
  align-items: center;
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
  background-color: #36be5d;
  color: #ffffff;
}

.status-option.canceled span {
  background-color: var(--c-dark-navy);
  color: var(--c-soft-blue);
}

.status-option.delayed span {
  background-color: var(--c-soft-orange);
  color: var(--c-light-orange);
}

.status-option.scheduled span {
  background-color: var(--c-soft-blue);
  color: var(--c-navy-light);
}

.status-option.open span {
  background-color: var(--c-dark-navy, #e0e8f0);
  color: var(--c-soft-blue, #2d4b6d);
}

.status-option.temporarily-closed span {
  background-color: var(--c-soft-blue, #e0e8f0);
  color: var(--c-navy, #2d4b6d);
}

.status-option.available span {
  background-color: var(--c-dark-navy, #e0e8f0);
  color: var(--c-soft-blue, #2d4b6d);
}

.status-option.not-available span {
  background-color: var(--c-soft-blue, #e0e8f0);
  color: var(--c-navy, #2d4b6d);
}

.status-option.checked-in span,
.status-option.not-checked-in span {
  background-color: var(--c-light-orange);
  color: var(--c-orange);
}

.status-option.all span {
  background-color: var(--c-light-gray, #f0f0f0);
  color: var(--c-dark-gray, #333333);
}

.status-option:last-child {
  border-bottom: none;
}

/* ส่วนของ status value */
:deep(.badge) {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 25px;
  border-radius: 15px;
  display: inline-block;
}

:deep(.badge.pending) {
  background-color: var(--c-light-orange);
  color: var(--c-orange);
}
:deep(.badge.scheduled) {
  background-color: var(--c-soft-blue);
  color: var(--c-navy-light);
}
:deep(.badge.completed) {
  background-color: #36be5d;
  color: #ffffff;
}
:deep(.badge.canceled) {
  background-color: var(--c-dark-navy);
  color: var(--c-soft-blue);
}
:deep(.badge.delayed) {
  background-color: var(--c-soft-orange);
  color: var(--c-light-orange);
}
:deep(.badge.open) {
  background-color: var(--c-dark-navy, #e0e8f0);
  color: var(--c-soft-blue, #2d4b6d);
}

:deep(.badge.temporarily-closed) {
  background-color: var(--c-soft-blue, #e0e8f0);
  color: var(--c-navy, #2d4b6d);
}

:deep(.badge.available) {
  background-color: var(--c-dark-navy, #e0e8f0);
  color: var(--c-soft-blue, #2d4b6d);
}

:deep(.badge.not-available) {
  background-color: var(--c-soft-blue, #e0e8f0);
  color: var(--c-navy, #2d4b6d);
}

:deep(.badge.checked-in),
:deep(.badge.not-checked-in) {
  background-color: var(--c-light-orange);
  color: var(--c-orange);
}

:deep(.badge.all) {
  background-color: var(--c-light-gray, #f0f0f0);
  color: var(--c-dark-gray, #333333);
}
</style>
