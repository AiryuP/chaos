<script setup lang="ts">
import { ArrowLeft, Brain, FileOutput, ListTree, PenLine, Route, Settings } from '@lucide/vue'
import type { Component } from 'vue'

import {
  projectWorkspaceItems,
  type ProjectWorkspaceId,
  useAppStore
} from '../stores/app'
import ExportWorkspace from '../workspaces/ExportWorkspace.vue'
import WritingWorkspace from '../workspaces/WritingWorkspace.vue'

const appStore = useAppStore()
const workspaceIcons: Record<ProjectWorkspaceId, Component> = {
  writing: PenLine,
  outline: ListTree,
  storyline: Route,
  memory: Brain,
  export: FileOutput,
  settings: Settings
}
</script>

<template>
  <main class="project-shell">
    <aside class="project-rail">
      <button
        type="button"
        class="back-button"
        aria-label="返回书架"
        @click="appStore.requestReturnToLibrary"
      >
        <ArrowLeft :size="17" />
        <span>书架</span>
      </button>

      <div
        class="project-name"
        :title="appStore.activeProjectName"
      >
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
          :disabled="!workspace.available"
          :aria-current="workspace.id === appStore.activeProjectWorkspace ? 'page' : undefined"
          @click="appStore.setProjectWorkspace(workspace.id)"
        >
          <component
            :is="workspaceIcons[workspace.id]"
            :size="17"
          />
          <span>{{ workspace.label }}</span>
        </button>
      </nav>
    </aside>

    <WritingWorkspace v-show="appStore.activeProjectWorkspace === 'writing'" />
    <ExportWorkspace v-show="appStore.activeProjectWorkspace === 'export'" />
  </main>
</template>
