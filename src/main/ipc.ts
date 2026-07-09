import { app, dialog, ipcMain } from 'electron'

import { toAppError } from '../shared/errors'
import { IPC_CHANNELS, type AppInfo, type IpcResult } from '../shared/ipc'
import { ProjectService } from './project/ProjectService'
import { RecentProjectsService } from './recent/RecentProjectsService'

type IpcHandler<T, TArgs extends unknown[]> = (...args: TArgs) => Promise<T> | T

export function registerIpcHandlers(): void {
  const projectService = new ProjectService()
  const recentProjectsService = new RecentProjectsService(app.getPath('userData'))

  handle(IPC_CHANNELS.getAppInfo, () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  }))

  handle(IPC_CHANNELS.getRecentProjects, () => recentProjectsService.list())

  handle(IPC_CHANNELS.createProject, async () => {
    const result = await dialog.showOpenDialog({
      title: '选择新作品文件夹',
      properties: ['openDirectory', 'createDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const project = projectService.createProjectAt(result.filePaths[0])
    recentProjectsService.remember({
      name: project.name,
      path: project.path ?? result.filePaths[0],
      updatedAt: project.updatedAt
    })

    return project
  })

  handle(IPC_CHANNELS.openProject, async (projectPath?: string) => {
    const path = projectPath ?? (await selectExistingProjectPath())

    if (!path) {
      return null
    }

    const project = projectService.openProjectAt(path)
    recentProjectsService.remember({
      name: project.name,
      path: project.path ?? path,
      updatedAt: project.updatedAt
    })

    return project
  })
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
  ipcMain.handle(channel, async (_event, ...args: TArgs): Promise<IpcResult<T>> => {
    try {
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

export type { AppInfo }
