import { defineStore } from 'pinia'

import type { Chapter, NovelProject, ProseMirrorDoc } from '@shared/domain'
import type {
  AppInfo,
  ChaosApi,
  CreateProjectInput,
  ExportProjectOutput,
  IpcResult,
  ProjectLibrarySettings,
  RecentProject,
  SupportedExportFormat
} from '@shared/ipc'

const LOCAL_API_UNAVAILABLE_MESSAGE =
  '本地能力未加载。请在 Chaos 桌面应用中打开此页面；如果刚更新过主进程或 preload，请重启应用窗口。'

export const projectWorkspaceItems = [
  { id: 'writing', label: '写作', available: true },
  { id: 'outline', label: '大纲', available: false },
  { id: 'storyline', label: '故事线', available: false },
  { id: 'memory', label: '记忆', available: false },
  { id: 'export', label: '导出', available: true },
  { id: 'settings', label: '设置', available: false }
] as const

export type AppShell = 'library' | 'project'
export type AppWorkspaceId = 'library' | 'settings'
export type ProjectWorkspaceId = (typeof projectWorkspaceItems)[number]['id']
export type PendingExitAction = 'return-library' | 'close-window'

interface SaveNotice {
  tone: 'success' | 'warning'
  message: string
}

interface AppState {
  activeShell: AppShell
  activeAppWorkspace: AppWorkspaceId
  activeProject: NovelProject | null
  activeProjectWorkspace: ProjectWorkspaceId
  activeDraft: ProseMirrorDoc | null
  appInfo: AppInfo | null
  recentProjects: RecentProject[]
  projectLibrarySettings: ProjectLibrarySettings | null
  isBusy: boolean
  isUpdatingProjectLibrary: boolean
  isSavingChapter: boolean
  isExporting: boolean
  hasUnsavedChanges: boolean
  lastSavedAt: string
  errorMessage: string
  saveNotice: SaveNotice | null
  lastExport: ExportProjectOutput | null
  pendingExitAction: PendingExitAction | null
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    activeShell: 'library',
    activeAppWorkspace: 'library',
    activeProject: null,
    activeProjectWorkspace: 'writing',
    activeDraft: null,
    appInfo: null,
    recentProjects: [],
    projectLibrarySettings: null,
    isBusy: false,
    isUpdatingProjectLibrary: false,
    isSavingChapter: false,
    isExporting: false,
    hasUnsavedChanges: false,
    lastSavedAt: '',
    errorMessage: '',
    saveNotice: null,
    lastExport: null,
    pendingExitAction: null
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
    },
    saveStatusLabel(state): string {
      if (state.isSavingChapter) {
        return '保存中'
      }

      if (state.hasUnsavedChanges) {
        return '未保存'
      }

      if (state.saveNotice?.tone === 'warning') {
        return '正文已保存'
      }

      return state.lastSavedAt ? `已保存 ${formatTime(state.lastSavedAt)}` : '已保存'
    },
    saveStatusTone(state): 'saving' | 'dirty' | 'saved' | 'warning' {
      if (state.isSavingChapter) {
        return 'saving'
      }

      if (state.hasUnsavedChanges) {
        return 'dirty'
      }

      return state.saveNotice?.tone === 'warning' ? 'warning' : 'saved'
    }
  },
  actions: {
    clearError(): void {
      this.errorMessage = ''
    },
    setAppWorkspace(workspace: AppWorkspaceId): void {
      this.activeAppWorkspace = workspace

      if (workspace === 'settings') {
        void this.loadProjectLibrarySettings()
      }
    },
    updateActiveChapterDraft(content: ProseMirrorDoc): void {
      this.activeDraft = cloneDocument(content)
      this.hasUnsavedChanges = !documentsEqual(content, this.activeChapter?.content)

      if (this.hasUnsavedChanges && this.saveNotice?.tone === 'success') {
        this.saveNotice = null
      }
    },
    requestReturnToLibrary(): void {
      if (this.hasUnsavedChanges) {
        this.pendingExitAction = 'return-library'
        return
      }

      this.completeExit('return-library')
    },
    requestWindowClose(): void {
      if (this.hasUnsavedChanges) {
        this.pendingExitAction = 'close-window'
        return
      }

      this.completeExit('close-window')
    },
    cancelPendingExit(): void {
      this.pendingExitAction = null
    },
    discardPendingExit(): void {
      const action = this.pendingExitAction

      if (!action) {
        return
      }

      this.pendingExitAction = null
      this.completeExit(action)
    },
    async saveAndContinueExit(): Promise<void> {
      const action = this.pendingExitAction

      if (!action || !(await this.saveActiveChapter())) {
        return
      }

      this.pendingExitAction = null
      this.completeExit(action)
    },
    completeExit(action: PendingExitAction): void {
      if (action === 'close-window') {
        this.hasUnsavedChanges = false
        getChaosApi()?.confirmClose()
        return
      }

      this.activeShell = 'library'
      this.activeAppWorkspace = 'library'
      this.activeProject = null
      this.activeDraft = null
      this.activeProjectWorkspace = 'writing'
      this.hasUnsavedChanges = false
      this.lastSavedAt = ''
      this.saveNotice = null
      this.lastExport = null
    },
    setProjectWorkspace(workspace: ProjectWorkspaceId): void {
      const target = projectWorkspaceItems.find((item) => item.id === workspace)

      if (target?.available) {
        this.activeProjectWorkspace = workspace
      }
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
    async createProject(input: CreateProjectInput): Promise<boolean> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return false
      }

      return this.runProjectAction(() => api.createProject(input))
    },
    async openProject(path?: string): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      await this.runProjectAction(() => api.openProject(path))
    },
    async loadProjectLibrarySettings(): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      this.isUpdatingProjectLibrary = true

      try {
        const result = await api.getProjectLibrarySettings()

        if (result.ok) {
          this.projectLibrarySettings = result.data
          return
        }

        this.errorMessage = result.error.message
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      } finally {
        this.isUpdatingProjectLibrary = false
      }
    },
    async chooseProjectLibrary(): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      this.isUpdatingProjectLibrary = true
      this.errorMessage = ''

      try {
        const result = await api.chooseProjectLibrary()

        if (!result.ok) {
          this.errorMessage = result.error.message
          return
        }

        if (result.data) {
          this.projectLibrarySettings = result.data
        }
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      } finally {
        this.isUpdatingProjectLibrary = false
      }
    },
    async resetProjectLibrary(): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      this.isUpdatingProjectLibrary = true
      this.errorMessage = ''

      try {
        const result = await api.resetProjectLibrary()

        if (result.ok) {
          this.projectLibrarySettings = result.data
          return
        }

        this.errorMessage = result.error.message
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      } finally {
        this.isUpdatingProjectLibrary = false
      }
    },
    async revealProjectLibrary(): Promise<void> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return
      }

      this.isUpdatingProjectLibrary = true
      this.errorMessage = ''

      try {
        const result = await api.revealProjectLibrary()

        if (!result.ok) {
          this.errorMessage = result.error.message
        }
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
      } finally {
        this.isUpdatingProjectLibrary = false
      }
    },
    async saveActiveChapter(): Promise<boolean> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return false
      }

      const project = this.activeProject
      const chapter = this.activeChapter
      const sourceContent = this.activeDraft ?? chapter?.content
      const content = sourceContent ? cloneDocument(sourceContent) : undefined

      if (!project || !chapter || !content) {
        this.errorMessage = '没有可保存的章节'
        return false
      }

      if (!project.path) {
        this.errorMessage = '当前作品缺少本地路径'
        return false
      }

      this.isSavingChapter = true
      this.errorMessage = ''
      this.saveNotice = null

      try {
        const result = await api.saveChapter({
          projectPath: project.path,
          chapterId: chapter.id,
          content
        })

        if (!result.ok) {
          this.errorMessage = result.error.message
          return false
        }

        this.replaceSavedChapter(result.data.chapter)
        this.activeDraft = cloneDocument(result.data.chapter.content)
        this.hasUnsavedChanges = false
        this.lastSavedAt = result.data.chapter.updatedAt
        this.saveNotice = result.data.mirrorSynced
          ? { tone: 'success', message: '正文与 Markdown 镜像已保存' }
          : {
              tone: 'warning',
              message: result.data.warning ?? '正文已保存，但 Markdown 镜像同步失败'
            }
        return true
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
        return false
      } finally {
        this.isSavingChapter = false
      }
    },
    async exportActiveProject(format: SupportedExportFormat): Promise<boolean> {
      const api = getChaosApi()

      if (!api) {
        this.errorMessage = LOCAL_API_UNAVAILABLE_MESSAGE
        return false
      }

      if (this.hasUnsavedChanges && !(await this.saveActiveChapter())) {
        return false
      }

      const projectPath = this.activeProject?.path

      if (!projectPath) {
        this.errorMessage = '当前作品缺少本地路径'
        return false
      }

      this.isExporting = true
      this.errorMessage = ''
      this.lastExport = null

      try {
        const result = await api.exportProject({ projectPath, format })

        if (!result.ok) {
          this.errorMessage = result.error.message
          return false
        }

        this.lastExport = result.data
        return true
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
        return false
      } finally {
        this.isExporting = false
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
    async runProjectAction(
      action: () => Promise<IpcResult<NovelProject | null>>
    ): Promise<boolean> {
      this.isBusy = true
      this.errorMessage = ''

      try {
        const result = await action()

        if (!result.ok) {
          this.errorMessage = result.error.message
          return false
        }

        if (!result.data) {
          return false
        }

        this.activeProject = result.data
        const chapter =
          result.data.chapters.find((item) => item.id === result.data?.activeChapterId) ??
          result.data.chapters[0] ??
          null
        this.activeDraft = chapter ? cloneDocument(chapter.content) : null
        this.activeProjectWorkspace = 'writing'
        this.activeShell = 'project'
        this.hasUnsavedChanges = false
        this.lastSavedAt = chapter?.updatedAt ?? ''
        this.saveNotice = null
        this.lastExport = null
        await this.loadRecentProjects()
        return true
      } catch (error) {
        this.errorMessage = toErrorMessage(error)
        return false
      } finally {
        this.isBusy = false
      }
    }
  }
})

function formatTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function documentsEqual(left: ProseMirrorDoc, right: ProseMirrorDoc | undefined): boolean {
  return Boolean(right && JSON.stringify(left) === JSON.stringify(right))
}

function cloneDocument(document: ProseMirrorDoc): ProseMirrorDoc {
  return JSON.parse(JSON.stringify(document)) as ProseMirrorDoc
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '操作失败，请重试'
}

function getChaosApi(): ChaosApi | null {
  return window.chaos ?? null
}
