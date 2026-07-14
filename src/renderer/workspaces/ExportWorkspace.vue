<script setup lang="ts">
import { CheckCircle2, Download, FileCode2, FileText } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { Component } from 'vue'

import type { SupportedExportFormat } from '@shared/ipc'

import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const selectedFormat = ref<SupportedExportFormat>('txt')

const formats: Array<{
  id: SupportedExportFormat
  label: string
  extension: string
  description: string
  icon: Component
}> = [
  {
    id: 'txt',
    label: '纯文本',
    extension: '.txt',
    description: '适合通用阅读、投稿和进一步排版',
    icon: FileText
  },
  {
    id: 'markdown',
    label: 'Markdown',
    extension: '.md',
    description: '保留章节标题与基础文本格式',
    icon: FileCode2
  }
]

const actionLabel = computed(() => {
  if (appStore.isExporting) {
    return '导出中'
  }

  return appStore.hasUnsavedChanges ? '保存并导出' : '导出作品'
})
</script>

<template>
  <section class="export-workspace">
    <header class="workspace-header">
      <div>
        <h1>导出</h1>
        <p>{{ appStore.activeProjectName }}</p>
      </div>
    </header>

    <div class="export-content">
      <section class="export-section">
        <div class="section-heading">
          <div>
            <h2>文件格式</h2>
            <p>导出内容来自最近保存的 SQLite 正文。</p>
          </div>
        </div>

        <div
          class="format-options"
          role="radiogroup"
          aria-label="导出格式"
        >
          <button
            v-for="format in formats"
            :key="format.id"
            type="button"
            class="format-option"
            :class="{ active: selectedFormat === format.id }"
            role="radio"
            :aria-checked="selectedFormat === format.id"
            @click="selectedFormat = format.id"
          >
            <component
              :is="format.icon"
              :size="20"
            />
            <span>
              <strong>{{ format.label }}</strong>
              <small>{{ format.description }}</small>
            </span>
            <code>{{ format.extension }}</code>
          </button>
        </div>
      </section>

      <div class="export-actions">
        <button
          type="button"
          class="button primary"
          :disabled="appStore.isExporting"
          @click="appStore.exportActiveProject(selectedFormat)"
        >
          <Download :size="16" />
          {{ actionLabel }}
        </button>
      </div>

      <section
        v-if="appStore.lastExport"
        class="export-result"
        role="status"
      >
        <CheckCircle2 :size="19" />
        <strong>导出完成</strong>
        <span>{{ appStore.lastExport.chapterCount }} 个章节</span>
        <p :title="appStore.lastExport.path">{{ appStore.lastExport.path }}</p>
      </section>
    </div>
  </section>
</template>
