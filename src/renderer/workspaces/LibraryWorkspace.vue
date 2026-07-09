<script setup lang="ts">
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
</script>

<template>
  <section class="library-main">
    <header class="compact-header">
      <div>
        <h1>书架</h1>
        <p>{{ appStore.recentProjects.length }} 个本地项目</p>
      </div>

      <div class="module-actions">
        <button
          type="button"
          class="button secondary"
          :disabled="appStore.isBusy"
          @click="appStore.openProject()"
        >
          打开本地项目
        </button>
        <button
          type="button"
          class="button primary"
          :disabled="appStore.isBusy"
          @click="appStore.createProject()"
        >
          新建作品
        </button>
      </div>
    </header>

    <section class="library-section">
      <div class="section-heading">
        <h2>最近打开</h2>
      </div>

      <div
        v-if="appStore.recentProjects.length === 0"
        class="empty-line"
      >
        暂无最近作品
      </div>

      <div
        v-else
        class="recent-list"
      >
        <button
          v-for="project in appStore.recentProjects.slice(0, 3)"
          :key="project.path"
          type="button"
          class="recent-row"
          :disabled="appStore.isBusy"
          @click="appStore.openProject(project.path)"
        >
          <strong>{{ project.name }}</strong>
          <span>{{ project.path }}</span>
        </button>
      </div>
    </section>

    <section class="library-section">
      <div class="section-heading">
        <h2>全部作品</h2>
      </div>

      <div class="project-table">
        <div class="project-row table-head">
          <span>作品名</span>
          <span>最近章节</span>
          <span>字数</span>
          <span>更新时间</span>
          <span>路径</span>
        </div>

        <button
          v-for="project in appStore.recentProjects"
          :key="project.path"
          type="button"
          class="project-row project-data-row"
          :disabled="appStore.isBusy"
          @click="appStore.openProject(project.path)"
        >
          <span>{{ project.name }}</span>
          <span>未命名章节</span>
          <span>-</span>
          <span>{{ new Date(project.updatedAt).toLocaleDateString() }}</span>
          <span>{{ project.path }}</span>
        </button>

        <div
          v-if="appStore.recentProjects.length === 0"
          class="project-empty-row"
        >
          还没有本地作品
        </div>
      </div>
    </section>
  </section>
</template>
