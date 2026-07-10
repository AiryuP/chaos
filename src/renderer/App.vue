<script setup lang="ts">
import { X } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted } from 'vue'

import AppShell from './shells/AppShell.vue'
import ProjectShell from './shells/ProjectShell.vue'
import { useAppStore } from './stores/app'

const appStore = useAppStore()
let removeCloseListener: (() => void) | undefined

const exitDialogTitle = computed(() =>
  appStore.pendingExitAction === 'close-window' ? '关闭 Chaos 前保存吗？' : '返回书架前保存吗？'
)

onMounted(() => {
  void appStore.loadAppInfo()
  void appStore.loadRecentProjects()

  removeCloseListener = window.chaos?.onCloseRequested(() => appStore.requestWindowClose())
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  removeCloseListener?.()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (!appStore.hasUnsavedChanges) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}
</script>

<template>
  <div class="app-frame">
    <AppShell v-if="appStore.activeShell === 'library'" />
    <ProjectShell v-else />

    <section
      v-if="appStore.errorMessage"
      class="notice-toast error-toast"
      role="alert"
    >
      <div>
        <strong>操作未完成</strong>
        <p>{{ appStore.errorMessage }}</p>
      </div>
      <button
        type="button"
        class="notice-dismiss"
        aria-label="关闭错误提示"
        @click="appStore.clearError"
      >
        <X :size="16" />
      </button>
    </section>

    <div
      v-if="appStore.pendingExitAction"
      class="dialog-backdrop"
      @click.self="appStore.cancelPendingExit"
    >
      <section
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-dialog-title"
      >
        <h2 id="exit-dialog-title">{{ exitDialogTitle }}</h2>
        <p>当前章节有尚未保存的修改。</p>

        <div class="dialog-actions">
          <button
            type="button"
            class="button secondary"
            :disabled="appStore.isSavingChapter"
            @click="appStore.cancelPendingExit"
          >
            取消
          </button>
          <button
            type="button"
            class="button danger-quiet"
            :disabled="appStore.isSavingChapter"
            @click="appStore.discardPendingExit"
          >
            放弃更改
          </button>
          <button
            type="button"
            class="button primary"
            :disabled="appStore.isSavingChapter"
            @click="appStore.saveAndContinueExit"
          >
            {{ appStore.isSavingChapter ? '保存中' : '保存并继续' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
