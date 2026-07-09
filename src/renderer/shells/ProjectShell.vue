<script setup lang="ts">
import { computed } from 'vue'

import { projectWorkspaceItems, useAppStore } from '../stores/app'
import WritingWorkspace from '../workspaces/WritingWorkspace.vue'

const appStore = useAppStore()

const activeWorkspace = computed(
  () =>
    projectWorkspaceItems.find((workspace) => workspace.id === appStore.activeProjectWorkspace) ??
    projectWorkspaceItems[0]
)
</script>

<template>
  <main class="project-shell">
    <aside class="project-rail">
      <button
        type="button"
        class="back-button"
        @click="appStore.returnToLibrary"
      >
        书架
      </button>

      <div class="project-name">
        {{ appStore.activeProjectName || '未打开作品' }}
      </div>

      <nav
        class="project-nav"
        aria-label="书内工作区"
      >
        <button
          v-for="workspace in projectWorkspaceItems"
          :key="workspace.id"
          type="button"
          :class="{ active: workspace.id === appStore.activeProjectWorkspace }"
          @click="appStore.setProjectWorkspace(workspace.id)"
        >
          {{ workspace.label }}
        </button>
      </nav>
    </aside>

    <WritingWorkspace v-if="appStore.activeProjectWorkspace === 'writing'" />

    <section
      v-else
      class="project-placeholder"
    >
      <header class="compact-header">
        <div>
          <h1>{{ activeWorkspace.label }}</h1>
          <p>该工作区会独占主界面，后续按书内结构单独实现。</p>
        </div>
      </header>
    </section>
  </main>
</template>
