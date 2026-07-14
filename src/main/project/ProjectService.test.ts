import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

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
    const service = new ProjectService()

    const project = service.createProjectIn(root, {
      name: 'Night Book',
      author: 'Lin',
      genre: 'Mystery',
      description: 'A story about a quiet harbor.'
    })
    const projectPath = project.path ?? ''

    expect(project.name).toBe('Night Book')
    expect(project.author).toBe('Lin')
    expect(project.genre).toBe('Mystery')
    expect(project.description).toBe('A story about a quiet harbor.')
    expect(dirname(projectPath)).toBe(root)
    expect(project.chapters).toHaveLength(1)
    expect(project.activeChapterId).toBe(project.chapters[0].id)
    expect(existsSync(join(projectPath, '.moqi', 'project.sqlite'))).toBe(true)
    expect(existsSync(join(projectPath, 'chapters'))).toBe(true)
    expect(existsSync(join(projectPath, 'exports'))).toBe(true)
    expect(readFileSync(join(projectPath, 'chapters', '001.md'), 'utf8')).toContain('# 未命名章节')
    expect(service.listProjectsIn(root)).toEqual([
      {
        name: 'Night Book',
        author: 'Lin',
        genre: 'Mystery',
        path: projectPath,
        updatedAt: project.updatedAt
      }
    ])
  })

  it('opens an existing project and restores metadata and chapters', () => {
    const root = createTempProjectRoot()
    const projectPath = join(root, 'ExistingBook')
    const service = new ProjectService()

    const created = service.createProjectAt(projectPath, {
      name: 'Existing Book',
      author: '',
      genre: '',
      description: ''
    })
    const opened = service.openProjectAt(projectPath)

    expect(opened.id).toBe(created.id)
    expect(opened.name).toBe('Existing Book')
    expect(opened.chapters[0].title).toBe('未命名章节')
    expect(opened.chapters[0].contentFormat).toBe('prosemirror-json-v1')
  })

  it('cleans reserved files after project creation fails without deleting user files', () => {
    const root = createTempProjectRoot()
    const projectPath = join(root, 'InterruptedBook')
    const markerPath = join(projectPath, 'keep.txt')

    mkdirSync(projectPath, { recursive: true })
    writeFileSync(markerPath, 'keep', 'utf8')

    const service = new ProjectService(() => {
      throw new Error('mirror write failed')
    })

    expect(() =>
      service.createProjectAt(projectPath, {
        name: 'Interrupted Book',
        author: '',
        genre: '',
        description: ''
      })
    ).toThrow('mirror write failed')
    expect(existsSync(markerPath)).toBe(true)
    expect(existsSync(join(projectPath, '.moqi', 'project.sqlite'))).toBe(false)
    expect(existsSync(join(projectPath, 'chapters', '001.md'))).toBe(false)
  })
})

function createTempProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chaos-project-service-'))
  tempRoots.push(root)
  return root
}
