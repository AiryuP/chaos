import type { ChaosApi } from '../shared/ipc'

declare global {
  interface Window {
    chaos: ChaosApi
  }
}

export {}
