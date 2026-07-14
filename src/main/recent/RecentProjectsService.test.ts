import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { RecentProjectsService } from './RecentProjectsService'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('RecentProjectsService', () => {
  it('stores the newest project first and de-duplicates normalized paths', () => {
    const root = createTempRoot()
    const service = new RecentProjectsService(root)
    const projectPath = join(root, 'Novel')

    service.remember({
      name: 'First',
      author: '',
      genre: '',
      path: projectPath,
      updatedAt: '2026-01-01T00:00:00.000Z'
    })
    service.remember({
      name: 'Updated',
      author: 'Lin',
      genre: 'Mystery',
      path: join(root, '.', 'Novel'),
      updatedAt: '2026-01-02T00:00:00.000Z'
    })

    expect(service.list()).toEqual([
      {
        name: 'Updated',
        author: 'Lin',
        genre: 'Mystery',
        path: projectPath,
        updatedAt: '2026-01-02T00:00:00.000Z'
      }
    ])
  })

  it('returns an empty list for corrupted recent project data', () => {
    const root = createTempRoot()
    const service = new RecentProjectsService(root, (targetPath) => {
      writeFileSync(targetPath, '{broken', 'utf8')
    })

    service.remember({
      name: 'Broken',
      author: '',
      genre: '',
      path: root,
      updatedAt: 'invalid'
    })

    expect(service.list()).toEqual([])
  })

  it('keeps the complete known project index', () => {
    const root = createTempRoot()
    const service = new RecentProjectsService(root)

    for (let index = 0; index < 15; index += 1) {
      service.remember({
        name: `Novel ${index}`,
        author: '',
        genre: '',
        path: join(root, `Novel-${index}`),
        updatedAt: new Date(2026, 0, index + 1).toISOString()
      })
    }

    expect(service.list()).toHaveLength(15)
  })
})

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chaos-recent-projects-'))
  tempRoots.push(root)
  return root
}
