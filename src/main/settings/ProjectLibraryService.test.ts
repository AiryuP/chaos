import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ProjectLibraryService } from './ProjectLibraryService'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('ProjectLibraryService', () => {
  it('uses an application-private project library by default', () => {
    const userDataPath = createTempRoot()
    const service = new ProjectLibraryService(userDataPath)

    expect(service.getSettings()).toEqual({
      path: join(userDataPath, 'projects'),
      isDefault: true
    })
    expect(service.ensureProjectLibrary()).toBe(join(userDataPath, 'projects'))
  })

  it('persists a custom project library and can restore the private default', () => {
    const userDataPath = createTempRoot()
    const customPath = join(createTempRoot(), 'novels')
    const service = new ProjectLibraryService(userDataPath)

    expect(service.setProjectLibraryPath(customPath)).toEqual({
      path: customPath,
      isDefault: false
    })
    expect(new ProjectLibraryService(userDataPath).getSettings()).toEqual({
      path: customPath,
      isDefault: false
    })

    expect(service.resetProjectLibraryPath()).toEqual({
      path: join(userDataPath, 'projects'),
      isDefault: true
    })
    expect(JSON.parse(readFileSync(join(userDataPath, 'app-settings.json'), 'utf8'))).toEqual({})
  })

  it('reports corrupted storage settings instead of silently changing libraries', () => {
    const userDataPath = createTempRoot()
    writeFileSync(join(userDataPath, 'app-settings.json'), '{broken', 'utf8')

    expect(() => new ProjectLibraryService(userDataPath).getSettings()).toThrow(
      '作品存放设置已损坏'
    )
  })
})

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chaos-project-library-'))
  tempRoots.push(root)
  return root
}
