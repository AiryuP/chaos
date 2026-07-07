import type { AppError } from './errors'

export const IPC_CHANNELS = {
  getAppInfo: 'app:get-info'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: string
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
}
