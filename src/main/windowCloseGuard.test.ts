import { describe, expect, it } from 'vitest'

import {
  approveWindowClose,
  consumeApprovedWindowClose,
  disableWindowCloseGuard,
  enableWindowCloseGuard,
  isWindowCloseGuardEnabled
} from './windowCloseGuard'

describe('window close guard state', () => {
  it('only enables the guard after an explicit renderer handshake', () => {
    const window = {}

    expect(isWindowCloseGuardEnabled(window)).toBe(false)
    enableWindowCloseGuard(window)
    expect(isWindowCloseGuardEnabled(window)).toBe(true)
  })

  it('consumes a close approval once', () => {
    const window = {}

    approveWindowClose(window)
    expect(consumeApprovedWindowClose(window)).toBe(true)
    expect(consumeApprovedWindowClose(window)).toBe(false)
  })

  it('clears guard and approval state when the renderer is no longer ready', () => {
    const window = {}

    enableWindowCloseGuard(window)
    approveWindowClose(window)
    disableWindowCloseGuard(window)

    expect(isWindowCloseGuardEnabled(window)).toBe(false)
    expect(consumeApprovedWindowClose(window)).toBe(false)
  })
})
