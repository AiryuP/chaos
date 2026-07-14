import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS, type ChaosApi, type IpcResult } from '../shared/ipc'

const chaosApi: ChaosApi = {
  getAppInfo: () => invoke(IPC_CHANNELS.getAppInfo),
  getProjectLibrarySettings: () => invoke(IPC_CHANNELS.getProjectLibrarySettings),
  chooseProjectLibrary: () => invoke(IPC_CHANNELS.chooseProjectLibrary),
  resetProjectLibrary: () => invoke(IPC_CHANNELS.resetProjectLibrary),
  revealProjectLibrary: () => invoke(IPC_CHANNELS.revealProjectLibrary),
  createProject: (input) => invoke(IPC_CHANNELS.createProject, input),
  openProject: (path?: string) => invoke(IPC_CHANNELS.openProject, path),
  getRecentProjects: () => invoke(IPC_CHANNELS.getRecentProjects),
  saveChapter: (input) => invoke(IPC_CHANNELS.saveChapter, input),
  exportProject: (input) => invoke(IPC_CHANNELS.exportProject, input),
  onCloseRequested: (callback) => {
    const listener = (): void => callback()

    ipcRenderer.on(IPC_CHANNELS.requestClose, listener)

    return () => ipcRenderer.removeListener(IPC_CHANNELS.requestClose, listener)
  },
  enableCloseGuard: () => ipcRenderer.send(IPC_CHANNELS.enableCloseGuard),
  disableCloseGuard: () => ipcRenderer.send(IPC_CHANNELS.disableCloseGuard),
  confirmClose: () => ipcRenderer.send(IPC_CHANNELS.confirmClose)
}

function invoke<T>(channel: string, ...args: unknown[]): Promise<IpcResult<T>> {
  return ipcRenderer.invoke(channel, ...args) as Promise<IpcResult<T>>
}

contextBridge.exposeInMainWorld('chaos', chaosApi)
