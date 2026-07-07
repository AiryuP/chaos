import { app, ipcMain } from 'electron'

import { toAppError } from '../shared/errors'
import { IPC_CHANNELS, type AppInfo, type IpcResult } from '../shared/ipc'

type IpcHandler<T> = () => Promise<T> | T

export function registerIpcHandlers(): void {
  handle(IPC_CHANNELS.getAppInfo, () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  }))
}

function handle<T>(channel: string, handler: IpcHandler<T>): void {
  ipcMain.handle(channel, async (): Promise<IpcResult<T>> => {
    try {
      return {
        ok: true,
        data: await handler()
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
