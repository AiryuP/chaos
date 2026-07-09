import { defineStore } from 'pinia'

import type { Chapter, NovelProject, ProseMirrorDoc } from '@shared/domain'
import type { AppInfo, ChaosApi, IpcResult, RecentProject } from '@shared/ipc'

const LOCAL_API_UNAVAILABLE_MESSAGE =
  '本地能力接口未加载。请确认当前页面运行在 Electron 应用中，而不是普通浏览器的 Vite 页面；如果刚改过代码，请重启 Electron 窗口。'

export const projectWorkspaceItems = [
  { id: 'writing', label: '写作' },
  { id: 'outline', label: '大纲' },
  { id: 'storyline', label: '故事线' },
  { id: 'memory', label: '记忆' },
  { id: 'export', label: '导出' },
  { id: 'settings', label: '设置' }
] as const

export type AppShell = 'library' | 'project'
export type ProjectWorkspaceId = (typeof projectWorkspaceItems)[number]['id']

interface AppState {
  activeShell: AppShell
  activeProject: NovelProject | null
  activeProjectWorkspace: ProjectWorkspaceId
  appInfo: AppInfo | null
  recentProjects: RecentProject[]
  isBusy: boolean
  isSavingChapter: boolean
  errorMessage: string
  saveMessage: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    activeShell: 'library',
    activeProject: null,
    activeProjectWorkspace: 'writing',
    appInfo: null,
    recentProjects: [],
    isBusy: false,
    isSavingChapter: false,
    errorMessage: '',
    saveMessage: ''
  }),
  getters: {
    activeProjectName(state): string {
      return state.activeProject?.name ?? ''
    },
    activeChapter(state): Chapter | null {
      if (!state.activeProject) {
        return null
      }

      return (
        state.activeProject.chapters.find(
          (chapter) => chapter.id === state.activeProject?.activeChapterId
        ) ?? state.activeProject.chapters[0] ?? null
      )
    }
  },
  actions: {
    returnToLibrary(): void {
      this.activeShell = 'library'
      this.activeProject = null
      this.saveMessage = ''
    },
    setProjectWorkspace(workspace: ProjectWorkspaceId): void {
      this.activeProjectWorkspace = workspace
    },
    async loadAppInfo(): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      try {
        const result = await api.getAppInfo()

        if (result.ok) {
          this.appInfo = result.data
          this.errorMessage = ''
          return
        }

        this.errorMessage = result.error.message
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      }
    },
    async loadRecentProjects(): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      try {
        const result = await api.getRecentProjects()

        if (result.ok) {
          this.recentProjects = result.data
          return
        }

        this.errorMessage = result.error.message
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      }
    },
    async createProject(): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      await this.runProjectAction(() => api.createProject())
    },
    async openProject(path?: string): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      await this.runProjectAction(() => api.openProject(path))
    },
    async saveActiveChapter(content: ProseMirrorDoc): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      const project = this.activeProject
      const chapter = this.activeChapter

      if (!project || !chapter) {
        this.errorMessage = '没有可保存的章节'
        return
      }

      if (!project.path) {
        this.errorMessage = '当前作品缺少本地路径'
        return
      }

      this.isSavingChapter = true
      this.errorMessage = ''
      this.saveMessage = ''

      try {
        const result = await api.saveChapter({
          projectPath: project.path,
          chapterId: chapter.id,
          content
        })

        if (!result.ok) {
          this.errorMessage = result.error.message
          return
        }

        this.replaceSavedChapter(result.data)
        this.saveMessage = '已保存'
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      } finally {
        this.isSavingChapter = false
      }
    },
    replaceSavedChapter(chapter: Chapter): void {
      if (!this.activeProject) {
        return
      }

      const index = this.activeProject.chapters.findIndex((item) => item.id === chapter.id)

      if (index >= 0) {
        this.activeProject.chapters.splice(index, 1, chapter)
      } else {
        this.activeProject.chapters.push(chapter)
      }

      this.activeProject.activeChapterId = chapter.id
      this.activeProject.updatedAt = chapter.updatedAt
    },
    async runProjectAction(action: () => Promise<IpcResult<NovelProject | null>>): Promise<void> {
      this.isBusy = true
      this.errorMessage = ''

      try {
        const result = await action()

        if (!result.ok) {
          this.errorMessage = result.error.message
          return
        }

        if (!result.data) {
          return
        }

        this.activeProject = result.data
        this.activeProjectWorkspace = 'writing'
        this.activeShell = 'project'
        this.saveMessage = ''
        await this.loadRecentProjects()
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      } finally {
        this.isBusy = false
      }
    }
  }
})

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '操作失败，请重启应用后重试'
}

function getChaosApi(): ChaosApi | null {
  return window.chaos ?? null
}
