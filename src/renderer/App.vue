<script setup lang="ts">
import { onMounted } from 'vue'

import { useAppStore } from './stores/app'
import LibraryWorkspace from './workspaces/LibraryWorkspace.vue'

const appStore = useAppStore()

onMounted(() => {
  void appStore.loadAppInfo()
})
</script>

<template>
  <div class="app-frame">
    <LibraryWorkspace />

    <p
      v-if="appStore.errorMessage"
      class="error-line"
    >
      {{ appStore.errorMessage }}
    </p>
  </div>
</template>
