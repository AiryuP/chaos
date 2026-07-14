import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { resolve } from 'node:path'

import { toAppError } from '../shared/errors'
import type { ProjectDetails } from '../shared/domain'
import {
  IPC_CHANNELS,
  type AppInfo,
  type ExportProjectInput,
  type IpcResult,
  type SaveChapterInput
} from '../shared/ipc'
import { ChapterService } from './chapter/ChapterService'
import { ExportService } from './export/ExportService'
import { ProjectService } from './project/ProjectService'
import { RecentProjectsService } from './recent/RecentProjectsService'
import { isTrustedIpcSender } from './security'
import { ProjectLibraryService } from './settings/ProjectLibraryService'
import {
  approveWindowClose,
  disableWindowCloseGuard,
  enableWindowCloseGuard
} from './windowCloseGuard'

type IpcHandler<T, TArgs extends unknown[]> = (...args: TArgs) => Promise<T> | T

export function registerIpcHandlers(): void {
  const projectService = new ProjectService()
  const chapterService = new ChapterService()
  const exportService = new ExportService()
  const recentProjectsService = new RecentProjectsService(app.getPath('userData'))
  const projectLibraryService = new ProjectLibraryService(app.getPath('userData'))

  ipcMain.on(IPC_CHANNELS.enableCloseGuard, (event) => {
    const window = getTrustedSenderWindow(event)

    if (window) {
      enableWindowCloseGuard(window)
    }
  })

  ipcMain.on(IPC_CHANNELS.disableCloseGuard, (event) => {
    const window = getTrustedSenderWindow(event)

    if (window) {
      disableWindowCloseGuard(window)
    }
  })

  ipcMain.on(IPC_CHANNELS.confirmClose, (event) => {
    const window = getTrustedSenderWindow(event)

    if (!window) {
      return
    }

    approveWindowClose(window)
    window.close()
  })

  handle(IPC_CHANNELS.getAppInfo, () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  }))

  handle(IPC_CHANNELS.getRecentProjects, () => {
    const projectLibraryPath = projectLibraryService.ensureProjectLibrary()
    const managedProjects = projectService.listProjectsIn(projectLibraryPath)

    return mergeKnownProjects(managedProjects, recentProjectsService.list())
  })

  handle(IPC_CHANNELS.getProjectLibrarySettings, () => projectLibraryService.getSettings())

  handle(IPC_CHANNELS.chooseProjectLibrary, async () => {
    const result = await dialog.showOpenDialog({
      title: '选择默认作品存放位置',
      properties: ['openDirectory', 'createDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return projectLibraryService.setProjectLibraryPath(result.filePaths[0])
  })

  handle(IPC_CHANNELS.resetProjectLibrary, () =>
    projectLibraryService.resetProjectLibraryPath()
  )

  handle(IPC_CHANNELS.revealProjectLibrary, async () => {
    const projectLibraryPath = projectLibraryService.ensureProjectLibrary()
    const errorMessage = await shell.openPath(projectLibraryPath)

    if (errorMessage) {
      throw new Error(`无法打开作品存放位置：${errorMessage}`)
    }

    return null
  })

  handle(IPC_CHANNELS.createProject, (input: unknown) => {
    const details = validateProjectDetails(input)
    const projectLibraryPath = projectLibraryService.ensureProjectLibrary()
    const project = projectService.createProjectIn(projectLibraryPath, details)
    recentProjectsService.remember({
      name: project.name,
      author: project.author,
      genre: project.genre,
      path: requireProjectPath(project.path),
      updatedAt: project.updatedAt
    })

    return project
  })

  handle(IPC_CHANNELS.openProject, async (projectPath?: unknown) => {
    const path = validateOptionalProjectPath(projectPath) ?? (await selectExistingProjectPath())

    if (!path) {
      return null
    }

    const project = projectService.openProjectAt(path)
    recentProjectsService.remember({
      name: project.name,
      author: project.author,
      genre: project.genre,
      path: project.path ?? path,
      updatedAt: project.updatedAt
    })

    return project
  })

  handle(IPC_CHANNELS.saveChapter, (input: SaveChapterInput) => chapterService.saveChapter(input))
  handle(IPC_CHANNELS.exportProject, (input: ExportProjectInput) =>
    exportService.exportProject(input)
  )
}

function getTrustedSenderWindow(event: Electron.IpcMainEvent): BrowserWindow | null {
  if (!isTrustedIpcSender(event)) {
    return null
  }

  return BrowserWindow.fromWebContents(event.sender)
}

async function selectExistingProjectPath(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: '打开本地作品文件夹',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

function handle<T, TArgs extends unknown[]>(channel: string, handler: IpcHandler<T, TArgs>): void {
  ipcMain.handle(channel, async (event, ...args: TArgs): Promise<IpcResult<T>> => {
    try {
      if (!isTrustedIpcSender(event)) {
        throw new Error('IPC request did not come from the trusted Chaos renderer')
      }

      return {
        ok: true,
        data: await handler(...args)
      }
    } catch (error) {
      return {
        ok: false,
        error: toAppError(error)
      }
    }
  })
}

function validateOptionalProjectPath(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Project path must be a non-empty string')
  }

  return value
}

function validateProjectDetails(value: unknown): ProjectDetails {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('作品信息格式无效')
  }

  const candidate = value as Record<string, unknown>

  return {
    name: validateProjectText(candidate.name, '作品名称', 120, true),
    author: validateProjectText(candidate.author, '作者名称', 80, false),
    genre: validateProjectText(candidate.genre, '作品题材', 60, false),
    description: validateProjectText(candidate.description, '作品简介', 2000, false, true)
  }
}

function validateProjectText(
  value: unknown,
  label: string,
  maxLength: number,
  required: boolean,
  multiline = false
): string {
  if (typeof value !== 'string') {
    throw new Error(`${label}格式无效`)
  }

  const normalized = value.trim()

  if (required && normalized.length === 0) {
    throw new Error(`请输入${label}`)
  }

  if (normalized.length > maxLength) {
    throw new Error(`${label}不能超过 ${maxLength} 个字符`)
  }

  if (!multiline && /[\r\n]/u.test(normalized)) {
    throw new Error(`${label}不能包含换行`)
  }

  if (normalized.includes('\0')) {
    throw new Error(`${label}包含无效字符`)
  }

  return normalized
}

function requireProjectPath(projectPath: string | undefined): string {
  if (!projectPath) {
    throw new Error('新作品缺少本地路径')
  }

  return projectPath
}

function mergeKnownProjects(
  managedProjects: ReturnType<ProjectService['listProjectsIn']>,
  recentProjects: ReturnType<RecentProjectsService['list']>
): ReturnType<RecentProjectsService['list']> {
  const projectsByPath = new Map<string, (typeof recentProjects)[number]>()

  for (const project of recentProjects) {
    projectsByPath.set(toProjectPathKey(project.path), project)
  }

  for (const project of managedProjects) {
    projectsByPath.set(toProjectPathKey(project.path), project)
  }

  return [...projectsByPath.values()].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  )
}

function toProjectPathKey(projectPath: string): string {
  const normalized = resolve(projectPath)
  return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized
}

export type { AppInfo }
