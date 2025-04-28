<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  isShowConfirmModal: Boolean,
  confirmMode: {
    type: String,
  },
});

const emit = defineEmits(["closeConfirmModal", "confirmModal", "closeModal"]);
</script>

<template>
  <Transition name="confirm-modal-container">
    <div
      v-if="isShowConfirmModal"
      class="confirm-modal-overlay"
      @click.self="emit('closeConfirmModal')"
    >
      <div class="confirm-modal">
        <div class="confirm-header">
          <slot name="header"> </slot>
        </div>
        <div class="confirm-body">
          <slot name="body"> </slot>
        </div>
        <div class="confirm-footer">
          <button
            class="footer-summit"
            :class="confirmMode === 'success' ? 'success' : 'discard'"
            @click="
              {
                confirmMode === 'success'
                  ? emit('confirmModal')
                  : emit('closeModal');
              }
            "
          >
            <slot name="footer-summit"> </slot>
          </button>
          <button
            class="footer-cancel"
            :class="confirmMode === 'success' ? 'success' : 'discard'"
            @click="emit('closeConfirmModal')"
          >
            <slot name="footer-cancel"> </slot>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ส่วนของ confirm modal */
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.confirm-modal {
  background-color: white;
  border: 1px solid var(--c-navy-light);
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.confirm-modal-container-enter-active,
.confirm-modal-container-leave-active {
  transition: all 0.3s ease;
}

.confirm-modal-container-enter-from,
.confirm-modal-container-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ส่วนของ confirm modal mode */
.confirm-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 20px;
}

.confirm-header {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
}

.confirm-header,
.confirm-body {
  display: flex;
  justify-content: center;
  align-items: center;
}

button {
  width: auto;
  min-width: 80px;
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
}

button:hover {
  filter: brightness(0.9);
  color: white;
  transition: all 0.3s ease;
}

.footer-cancel.success {
  background-color: var(--c-light-orange);
  color: var(--c-orange);
}

.footer-summit.success {
  background-color: var(--c-orange);
  color: white;
}

.footer-summit.discard {
  background-color: var(--c-navy-light);
  color: var(--c-soft-blue);
}

.footer-cancel.discard {
  background-color: var(--c-soft-blue);
  color: var(--c-navy-light);
}
</style>
