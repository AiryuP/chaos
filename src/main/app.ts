import { app, BrowserWindow, Menu, session } from 'electron'
import { join, resolve } from 'node:path'

import { IPC_CHANNELS } from '../shared/ipc'
import { consumeApprovedWindowClose, registerIpcHandlers } from './ipc'
import { isTrustedRendererUrl } from './security'

const isDevelopment = !app.isPackaged
let mainWindow: BrowserWindow | null = null

if (process.env.CHAOS_USER_DATA_PATH) {
  app.setPath('userData', resolve(process.env.CHAOS_USER_DATA_PATH))
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    mainWindow.show()
    mainWindow.focus()
  })

  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    denyRendererPermissions()
    registerIpcHandlers()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

function createMainWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 680,
    title: 'Chaos',
    backgroundColor: '#f4f4f1',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(__dirname, '../preload/index.cjs')
    }
  })
  let rendererReady = false

  mainWindow = window
  window.setMenu(null)
  window.removeMenu()
  window.setMenuBarVisibility(false)

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-attach-webview', (event) => event.preventDefault())
  window.webContents.on('will-navigate', (event, targetUrl) => {
    if (!isTrustedRendererUrl(targetUrl)) {
      event.preventDefault()
    }
  })
  window.webContents.once('did-finish-load', () => {
    rendererReady = true
  })

  window.once('ready-to-show', () => window.show())
  window.on('close', (event) => {
    if (
      consumeApprovedWindowClose(window) ||
      window.webContents.isDestroyed() ||
      !rendererReady
    ) {
      return
    }

    event.preventDefault()
    window.webContents.send(IPC_CHANNELS.requestClose)
  })
  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null
    }
  })

  if (isDevelopment && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)

    if (process.env.CHAOS_OPEN_DEVTOOLS === '1') {
      window.webContents.openDevTools({ mode: 'detach' })
    }

    return
  }

  void window.loadFile(join(__dirname, '../renderer/index.html'))
}

function denyRendererPermissions(): void {
  session.defaultSession.setPermissionCheckHandler(() => false)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
}
