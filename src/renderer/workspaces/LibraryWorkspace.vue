<script setup lang="ts">
import { BookOpen, FolderOpen, Plus, X } from '@lucide/vue'
import { nextTick, reactive, ref } from 'vue'

import type { CreateProjectInput, RecentProject } from '@shared/ipc'

import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const isCreateDialogOpen = ref(false)
const projectNameInput = ref<HTMLInputElement | null>(null)
const formError = ref('')
const projectForm = reactive<CreateProjectInput>(createEmptyProjectForm())

function openCreateDialog(): void {
  Object.assign(projectForm, createEmptyProjectForm())
  formError.value = ''
  appStore.clearError()
  isCreateDialogOpen.value = true
  void nextTick(() => projectNameInput.value?.focus())
}

function closeCreateDialog(): void {
  if (appStore.isBusy) {
    return
  }

  isCreateDialogOpen.value = false
}

async function submitProject(): Promise<void> {
  if (projectForm.name.trim().length === 0) {
    formError.value = '请输入作品名称'
    projectNameInput.value?.focus()
    return
  }

  formError.value = ''
  const created = await appStore.createProject({ ...projectForm })

  if (created) {
    isCreateDialogOpen.value = false
  }
}

function formatProjectMeta(project: RecentProject): string {
  return [project.author, project.genre].filter(Boolean).join(' · ') || '未填写'
}

function createEmptyProjectForm(): CreateProjectInput {
  return {
    name: '',
    author: '',
    genre: '',
    description: ''
  }
}
</script>

<template>
  <section class="library-main">
    <header class="compact-header">
      <div>
        <h1>书架</h1>
        <p>{{ appStore.recentProjects.length }} 部作品</p>
      </div>

      <div class="module-actions">
        <button
          type="button"
          class="button secondary"
          :disabled="appStore.isBusy"
          @click="appStore.openProject()"
        >
          <FolderOpen :size="16" />
          <span>打开本地项目</span>
        </button>
        <button
          type="button"
          class="button primary"
          :disabled="appStore.isBusy"
          @click="openCreateDialog"
        >
          <Plus :size="16" />
          <span>新建作品</span>
        </button>
      </div>
    </header>

    <section class="library-section">
      <div class="section-heading">
        <h2>全部作品</h2>
      </div>

      <div class="project-table">
        <div class="project-row table-head">
          <span>作品</span>
          <span>作者 / 题材</span>
          <span>最近修改</span>
        </div>

        <button
          v-for="project in appStore.recentProjects"
          :key="project.path"
          type="button"
          class="project-row project-data-row"
          :disabled="appStore.isBusy"
          @click="appStore.openProject(project.path)"
        >
          <strong>{{ project.name }}</strong>
          <span>{{ formatProjectMeta(project) }}</span>
          <span>{{ new Date(project.updatedAt).toLocaleString() }}</span>
        </button>

        <div
          v-if="appStore.recentProjects.length === 0"
          class="project-empty-row"
        >
          <BookOpen :size="22" />
          <span>还没有最近作品</span>
        </div>
      </div>
    </section>

    <div
      v-if="isCreateDialogOpen"
      class="dialog-backdrop"
      @click.self="closeCreateDialog"
      @keydown.esc.prevent="closeCreateDialog"
    >
      <section
        class="create-project-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
      >
        <header class="dialog-header">
          <h2 id="create-project-title">新建作品</h2>
          <button
            type="button"
            class="notice-dismiss"
            aria-label="关闭新建作品窗口"
            :disabled="appStore.isBusy"
            @click="closeCreateDialog"
          >
            <X :size="17" />
          </button>
        </header>

        <form
          class="project-form"
          @submit.prevent="submitProject"
        >
          <label class="form-field">
            <span>作品名称</span>
            <input
              ref="projectNameInput"
              v-model="projectForm.name"
              type="text"
              maxlength="120"
              autocomplete="off"
              :aria-invalid="Boolean(formError)"
              aria-describedby="project-name-error"
              @input="formError = ''"
            />
            <small
              v-if="formError"
              id="project-name-error"
              class="field-error"
            >
              {{ formError }}
            </small>
          </label>

          <div class="form-columns">
            <label class="form-field">
              <span>作者名称 <small>可选</small></span>
              <input
                v-model="projectForm.author"
                type="text"
                maxlength="80"
                autocomplete="off"
              />
            </label>

            <label class="form-field">
              <span>作品题材 <small>可选</small></span>
              <input
                v-model="projectForm.genre"
                type="text"
                maxlength="60"
                autocomplete="off"
              />
            </label>
          </div>

          <label class="form-field">
            <span>作品简介 <small>可选</small></span>
            <textarea
              v-model="projectForm.description"
              maxlength="2000"
              rows="5"
            />
          </label>

          <div class="dialog-actions">
            <button
              type="button"
              class="button secondary"
              :disabled="appStore.isBusy"
              @click="closeCreateDialog"
            >
              取消
            </button>
            <button
              type="submit"
              class="button primary"
              :disabled="appStore.isBusy"
            >
              {{ appStore.isBusy ? '正在创建' : '创建并开始写作' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>
