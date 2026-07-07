import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS, type ChaosApi, type IpcResult } from '../shared/ipc'

const chaosApi: ChaosApi = {
  getAppInfo: () => invoke(IPC_CHANNELS.getAppInfo)
}

function invoke<T>(channel: string): Promise<IpcResult<T>> {
  return ipcRenderer.invoke(channel) as Promise<IpcResult<T>>
}

contextBridge.exposeInMainWorld('chaos', chaosApi)
