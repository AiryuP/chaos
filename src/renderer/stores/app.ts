import { defineStore } from 'pinia'

import type { AppInfo } from '@shared/ipc'

interface AppState {
  appInfo: AppInfo | null
  errorMessage: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    appInfo: null,
    errorMessage: ''
  }),
  actions: {
    async loadAppInfo(): Promise<void> {
      const result = await window.chaos.getAppInfo()

      if (result.ok) {
        this.appInfo = result.data
        this.errorMessage = ''
        return
      }

      this.errorMessage = result.error.message
    }
  }
})
