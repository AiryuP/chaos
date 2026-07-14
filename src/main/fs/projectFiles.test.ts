import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  atomicWriteTextFile,
  resolveProjectFile,
  resolveProjectFileForAccess
} from './projectFiles'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('project file safety', () => {
  it('writes text atomically inside the project folder', () => {
    const root = createTempRoot()
    const targetPath = resolveProjectFile(root, 'chapters/001.md')

    atomicWriteTextFile(targetPath, 'first')
    atomicWriteTextFile(targetPath, 'second')

    expect(readFileSync(targetPath, 'utf8')).toBe('second')
  })

  it('rejects absolute paths and paths outside the project folder', () => {
    const root = createTempRoot()

    expect(() => resolveProjectFile(root, '../outside.md')).toThrow('outside')
    expect(() => resolveProjectFile(root, join(root, 'absolute.md'))).toThrow('relative path')
  })

  it('rejects project paths whose real parent resolves outside through a directory link', () => {
    const root = createTempRoot()
    const outside = createTempRoot()
    const linkedDirectory = join(root, 'chapters')

    symlinkSync(outside, linkedDirectory, process.platform === 'win32' ? 'junction' : 'dir')

    expect(() => resolveProjectFileForAccess(root, 'chapters/escaped.md')).toThrow(
      'resolves outside'
    )
    expect(existsSync(join(outside, 'escaped.md'))).toBe(false)
  })
})

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chaos-project-files-'))
  tempRoots.push(root)
  return root
}
