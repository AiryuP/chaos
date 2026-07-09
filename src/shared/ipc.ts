import type { AppError } from './errors'
import type { Chapter, NovelProject, ProseMirrorDoc } from './domain'

export const IPC_CHANNELS = {
  getAppInfo: 'app:get-info',
  createProject: 'project:create',
  openProject: 'project:open',
  getRecentProjects: 'project:get-recent',
  saveChapter: 'chapter:save'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: string
}

export interface RecentProject {
  name: string
  path: string
  updatedAt: string
}

export interface SaveChapterInput {
  projectPath: string
  chapterId: string
  content: ProseMirrorDoc
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
  createProject: () => Promise<IpcResult<NovelProject | null>>
  openProject: (path?: string) => Promise<IpcResult<NovelProject | null>>
  getRecentProjects: () => Promise<IpcResult<RecentProject[]>>
  saveChapter: (input: SaveChapterInput) => Promise<IpcResult<Chapter>>
}
