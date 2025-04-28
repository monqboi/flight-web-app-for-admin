<script setup>
import { defineProps } from "vue";

defineProps({
  showModal: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="management">
    <div class="content-container">
      <header class="management-header">
        <div class="header-left">
          <slot name="header-left"></slot>
        </div>
        <div class="header-right">
          <slot name="header-right"></slot>
        </div>
      </header>

      <main class="management-body">
        <slot name="content"></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.management {
  margin: 20px;
  padding: 20px 40px;
  background-color: var(--vt-c-white, #ffffff);
  border-radius: 16px;
  position: relative;
  display: flex;
  box-sizing: border-box;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  margin-bottom: 10px;
  width: 100%;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  flex: 1;
}

.header-right {
  justify-content: flex-end;
}

.management-body {
  padding: 10px 0;
  width: 100%;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 1;
}
</style>
