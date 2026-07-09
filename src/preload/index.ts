import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS, type ChaosApi, type IpcResult } from '../shared/ipc'

const chaosApi: ChaosApi = {
  getAppInfo: () => invoke(IPC_CHANNELS.getAppInfo),
  createProject: () => invoke(IPC_CHANNELS.createProject),
  openProject: (path?: string) => invoke(IPC_CHANNELS.openProject, path),
  getRecentProjects: () => invoke(IPC_CHANNELS.getRecentProjects)
}

function invoke<T>(channel: string, ...args: unknown[]): Promise<IpcResult<T>> {
  return ipcRenderer.invoke(channel, ...args) as Promise<IpcResult<T>>
}

contextBridge.exposeInMainWorld('chaos', chaosApi)
