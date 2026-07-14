<script setup lang="ts">
import { Archive, BookOpen, Settings } from '@lucide/vue'

import { useAppStore, type AppWorkspaceId } from '../stores/app'
import AppSettingsWorkspace from '../workspaces/AppSettingsWorkspace.vue'
import LibraryWorkspace from '../workspaces/LibraryWorkspace.vue'

const appStore = useAppStore()

function selectWorkspace(workspace: AppWorkspaceId): void {
  appStore.setAppWorkspace(workspace)
}
</script>

<template>
  <main class="app-shell">
    <aside class="app-rail">
      <nav
        class="rail-nav"
        aria-label="应用导航"
      >
        <button
          type="button"
          class="rail-item"
          :class="{ active: appStore.activeAppWorkspace === 'library' }"
          :aria-current="appStore.activeAppWorkspace === 'library' ? 'page' : undefined"
          @click="selectWorkspace('library')"
        >
          <BookOpen :size="18" />
          <span>书架</span>
        </button>
        <button
          type="button"
          class="rail-item"
          disabled
        >
          <Archive :size="18" />
          <span>归档</span>
        </button>
        <button
          type="button"
          class="rail-item"
          :class="{ active: appStore.activeAppWorkspace === 'settings' }"
          :aria-current="appStore.activeAppWorkspace === 'settings' ? 'page' : undefined"
          @click="selectWorkspace('settings')"
        >
          <Settings :size="18" />
          <span>设置</span>
        </button>
      </nav>
    </aside>

    <LibraryWorkspace v-if="appStore.activeAppWorkspace === 'library'" />
    <AppSettingsWorkspace v-else />
  </main>
</template>
