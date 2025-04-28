<template>
  <div class="app-container">
    <Sidebar v-if="showLayout" />
    <div class="main-content" v-if="showLayout">
      <router-view />
    </div>
    <RouterView v-else />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";

const route = useRoute();
const showLayout = computed(() => route.meta.layout !== false);
</script>
