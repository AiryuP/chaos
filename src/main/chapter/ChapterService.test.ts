import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import type { ProseMirrorDoc } from '../../shared/domain'
import { prosemirrorToPlainText } from '../../shared/document'
import { ProjectService } from '../project/ProjectService'
import { ChapterService } from './ChapterService'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('ChapterService', () => {
  it('saves ProseMirror JSON to sqlite and updates the markdown mirror', () => {
    const root = createTempProjectRoot()
    const projectPath = join(root, 'DraftBook')
    const projectService = new ProjectService()
    const chapterService = new ChapterService()
    const project = projectService.createProjectAt(projectPath, 'Draft Book')
    const chapter = project.chapters[0]
    const content = createDraftContent()

    const saved = chapterService.saveChapter({
      projectPath,
      chapterId: chapter.id,
      content
    })

    expect(saved.chapter.content).toEqual(content)
    expect(saved.chapter.wordCount).toBe(prosemirrorToPlainText(content).trim().length)
    expect(saved.chapter.version).toBe(chapter.version + 1)
    expect(saved.mirrorSynced).toBe(true)

    const reopened = projectService.openProjectAt(projectPath)
    const reopenedChapter = reopened.chapters[0]

    expect(reopened.updatedAt).toBe(saved.chapter.updatedAt)
    expect(reopenedChapter.content).toEqual(content)
    expect(reopenedChapter.wordCount).toBe(saved.chapter.wordCount)
    expect(reopenedChapter.version).toBe(saved.chapter.version)

    const markdown = readFileSync(join(projectPath, saved.chapter.markdownPath), 'utf8')

    expect(markdown).toContain('The rain falls on the old roof.')
    expect(markdown).toContain('**Stay quiet.**')
  })

  it('fails clearly when the chapter does not exist', () => {
    const root = createTempProjectRoot()
    const projectPath = join(root, 'MissingChapterBook')
    const projectService = new ProjectService()
    const chapterService = new ChapterService()

    projectService.createProjectAt(projectPath, 'Missing Chapter Book')

    expect(() =>
      chapterService.saveChapter({
        projectPath,
        chapterId: 'missing-chapter',
        content: createDraftContent()
      })
    ).toThrow('Chapter not found')
  })

  it('keeps the sqlite save successful when the markdown mirror cannot be written', () => {
    const root = createTempProjectRoot()
    const projectPath = join(root, 'MirrorWarningBook')
    const projectService = new ProjectService()
    const project = projectService.createProjectAt(projectPath, 'Mirror Warning Book')
    const chapter = project.chapters[0]
    const chapterService = new ChapterService(() => {
      throw new Error('disk is read-only')
    })

    const saved = chapterService.saveChapter({
      projectPath,
      chapterId: chapter.id,
      content: createDraftContent()
    })

    expect(saved.mirrorSynced).toBe(false)
    expect(saved.warning).toContain('disk is read-only')
    expect(projectService.openProjectAt(projectPath).chapters[0].content).toEqual(
      createDraftContent()
    )
  })

  it('does not write a database-provided markdown path through a directory link', () => {
    const root = createTempProjectRoot()
    const outside = createTempProjectRoot()
    const projectPath = join(root, 'LinkedMirrorBook')
    const project = new ProjectService().createProjectAt(projectPath, 'Linked Mirror Book')
    const linkedDirectory = join(projectPath, 'linked')
    const database = new Database(join(projectPath, '.moqi', 'project.sqlite'))

    symlinkSync(outside, linkedDirectory, process.platform === 'win32' ? 'junction' : 'dir')
    database
      .prepare('UPDATE chapters SET markdown_path = ? WHERE id = ?')
      .run('linked/escaped.md', project.chapters[0].id)
    database.close()

    const saved = new ChapterService().saveChapter({
      projectPath,
      chapterId: project.chapters[0].id,
      content: createDraftContent()
    })

    expect(saved.mirrorSynced).toBe(false)
    expect(saved.warning).toContain('resolves outside')
    expect(existsSync(join(outside, 'escaped.md'))).toBe(false)
  })
})

function createDraftContent(): ProseMirrorDoc {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'The rain falls on the old roof.' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Stay quiet.', marks: [{ type: 'bold' }] }]
      }
    ]
  }
}

function createTempProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chaos-chapter-service-'))
  tempRoots.push(root)
  return root
}
