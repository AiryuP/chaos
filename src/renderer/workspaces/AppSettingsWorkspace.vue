<script setup lang="ts">
import { FolderCog, FolderOpen, RotateCcw } from '@lucide/vue'

import { useAppStore } from '../stores/app'

const appStore = useAppStore()
</script>

<template>
  <section class="app-settings-main">
    <header class="compact-header">
      <div>
        <h1>设置</h1>
        <p>应用级设置</p>
      </div>
    </header>

    <div class="settings-content">
      <section class="settings-section">
        <div class="settings-heading">
          <div>
            <h2>作品存放</h2>
            <p>现有作品保持原位；新的存放位置用于之后创建的作品。</p>
          </div>
          <span class="settings-state">
            {{
              !appStore.projectLibrarySettings
                ? '尚未读取'
                : appStore.projectLibrarySettings.isDefault
                  ? '软件私有目录'
                  : '自定义目录'
            }}
          </span>
        </div>

        <div class="settings-path-row">
          <FolderOpen :size="18" />
          <code :title="appStore.projectLibrarySettings?.path">
            {{ appStore.projectLibrarySettings?.path || '正在读取存放位置…' }}
          </code>
        </div>

        <div class="settings-actions">
          <button
            type="button"
            class="button secondary"
            :disabled="appStore.isUpdatingProjectLibrary || !appStore.projectLibrarySettings"
            @click="appStore.revealProjectLibrary"
          >
            <FolderOpen :size="16" />
            <span>打开目录</span>
          </button>
          <button
            type="button"
            class="button secondary"
            :disabled="
              appStore.isUpdatingProjectLibrary || appStore.projectLibrarySettings?.isDefault === true
            "
            @click="appStore.resetProjectLibrary"
          >
            <RotateCcw :size="16" />
            <span>恢复默认</span>
          </button>
          <button
            type="button"
            class="button primary"
            :disabled="appStore.isUpdatingProjectLibrary"
            @click="appStore.chooseProjectLibrary"
          >
            <FolderCog :size="16" />
            <span>{{ appStore.isUpdatingProjectLibrary ? '处理中' : '更改位置' }}</span>
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
