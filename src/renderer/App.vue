<script setup lang="ts">
import { onMounted } from 'vue'

import { useAppStore } from './stores/app'
import AppShell from './shells/AppShell.vue'
import ProjectShell from './shells/ProjectShell.vue'

const appStore = useAppStore()

onMounted(() => {
  void appStore.loadAppInfo()
  void appStore.loadRecentProjects()
})
</script>

<template>
  <div class="app-frame">
    <AppShell v-if="appStore.activeShell === 'library'" />
    <ProjectShell v-else />

    <p
      v-if="appStore.errorMessage"
      class="error-line"
    >
      {{ appStore.errorMessage }}
    </p>
  </div>
</template>
