import { defineStore } from 'pinia'

import type { Chapter, NovelProject } from '@shared/domain'
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
  errorMessage: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    activeShell: 'library',
    activeProject: null,
    activeProjectWorkspace: 'writing',
    appInfo: null,
    recentProjects: [],
    isBusy: false,
    errorMessage: ''
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
