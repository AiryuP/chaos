import type { AppError } from './errors'
import type {
  Chapter,
  ExportFormat,
  NovelProject,
  ProjectDetails,
  ProjectSummary,
  ProseMirrorDoc
} from './domain'

export const IPC_CHANNELS = {
  getAppInfo: 'app:get-info',
  requestClose: 'app:request-close',
  enableCloseGuard: 'app:enable-close-guard',
  disableCloseGuard: 'app:disable-close-guard',
  confirmClose: 'app:confirm-close',
  getProjectLibrarySettings: 'settings:get-project-library',
  chooseProjectLibrary: 'settings:choose-project-library',
  resetProjectLibrary: 'settings:reset-project-library',
  revealProjectLibrary: 'settings:reveal-project-library',
  createProject: 'project:create',
  openProject: 'project:open',
  getRecentProjects: 'project:get-recent',
  saveChapter: 'chapter:save',
  exportProject: 'project:export'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: string
}

export type RecentProject = ProjectSummary

export type CreateProjectInput = ProjectDetails

export interface ProjectLibrarySettings {
  path: string
  isDefault: boolean
}

export interface SaveChapterInput {
  projectPath: string
  chapterId: string
  content: ProseMirrorDoc
}

export interface SaveChapterOutput {
  chapter: Chapter
  mirrorSynced: boolean
  warning?: string
}

export type SupportedExportFormat = Extract<ExportFormat, 'txt' | 'markdown'>

export interface ExportProjectInput {
  projectPath: string
  format: SupportedExportFormat
}

export interface ExportProjectOutput {
  format: SupportedExportFormat
  path: string
  exportedAt: string
  chapterCount: number
}

export type IpcResult<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: AppError
    }

export interface ChaosApi {
  getAppInfo: () => Promise<IpcResult<AppInfo>>
  getProjectLibrarySettings: () => Promise<IpcResult<ProjectLibrarySettings>>
  chooseProjectLibrary: () => Promise<IpcResult<ProjectLibrarySettings | null>>
  resetProjectLibrary: () => Promise<IpcResult<ProjectLibrarySettings>>
  revealProjectLibrary: () => Promise<IpcResult<null>>
  createProject: (input: CreateProjectInput) => Promise<IpcResult<NovelProject>>
  openProject: (path?: string) => Promise<IpcResult<NovelProject | null>>
  getRecentProjects: () => Promise<IpcResult<RecentProject[]>>
  saveChapter: (input: SaveChapterInput) => Promise<IpcResult<SaveChapterOutput>>
  exportProject: (input: ExportProjectInput) => Promise<IpcResult<ExportProjectOutput>>
  onCloseRequested: (callback: () => void) => () => void
  enableCloseGuard: () => void
  disableCloseGuard: () => void
  confirmClose: () => void
}
