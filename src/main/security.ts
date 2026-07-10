import { app, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

type IpcEvent = IpcMainEvent | IpcMainInvokeEvent

export function isTrustedIpcSender(event: IpcEvent): boolean {
  const frame = event.senderFrame
  return Boolean(frame && frame === frame.top && isTrustedRendererUrl(frame.url))
}

export function isTrustedRendererUrl(value: string): boolean {
  try {
    const target = new URL(value)
    const developmentUrl = process.env.ELECTRON_RENDERER_URL

    if (!app.isPackaged && developmentUrl) {
      return target.origin === new URL(developmentUrl).origin
    }

    target.hash = ''
    target.search = ''

    return target.href === pathToFileURL(join(__dirname, '../renderer/index.html')).href
  } catch {
    return false
  }
}
