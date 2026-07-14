const enabledWindows = new WeakSet<object>()
const approvedWindows = new WeakSet<object>()

export function enableWindowCloseGuard(window: object): void {
  enabledWindows.add(window)
}

export function disableWindowCloseGuard(window: object): void {
  enabledWindows.delete(window)
  approvedWindows.delete(window)
}

export function isWindowCloseGuardEnabled(window: object): boolean {
  return enabledWindows.has(window)
}

export function approveWindowClose(window: object): void {
  approvedWindows.add(window)
}

export function consumeApprovedWindowClose(window: object): boolean {
  if (!approvedWindows.has(window)) {
    return false
  }

  approvedWindows.delete(window)
  return true
}
