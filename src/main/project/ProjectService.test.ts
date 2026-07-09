import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ProjectService } from './ProjectService'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('ProjectService', () => {
  it('creates a local project folder with sqlite and default chapter mirror', () => {
    const root = createTempProjectRoot()
    const projectPath = join(root, 'NightBook')
    const service = new ProjectService()

    const project = service.createProjectAt(projectPath, 'Night Book')

    expect(project.name).toBe('Night Book')
    expect(project.path).toBe(projectPath)
    expect(project.chapters).toHaveLength(1)
    expect(project.activeChapterId).toBe(project.chapters[0].id)
    expect(existsSync(join(projectPath, '.moqi', 'project.sqlite'))).toBe(true)
    expect(existsSync(join(projectPath, 'chapters'))).toBe(true)
    expect(existsSync(join(projectPath, 'exports'))).toBe(true)
    expect(readFileSync(join(projectPath, 'chapters', '001.md'), 'utf8')).toContain('# 未命名章节')
  })

  it('opens an existing project and restores metadata and chapters', () => {
    const root = createTempProjectRoot()
    const projectPath = join(root, 'ExistingBook')
    const service = new ProjectService()

    const created = service.createProjectAt(projectPath, 'Existing Book')
    const opened = service.openProjectAt(projectPath)

    expect(opened.id).toBe(created.id)
    expect(opened.name).toBe('Existing Book')
    expect(opened.chapters[0].title).toBe('未命名章节')
    expect(opened.chapters[0].contentFormat).toBe('prosemirror-json-v1')
  })
})

function createTempProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chaos-project-service-'))
  tempRoots.push(root)
  return root
}
