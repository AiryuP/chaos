import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
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

    expect(saved.content).toEqual(content)
    expect(saved.wordCount).toBe(prosemirrorToPlainText(content).trim().length)
    expect(saved.version).toBe(chapter.version + 1)

    const reopened = projectService.openProjectAt(projectPath)
    const reopenedChapter = reopened.chapters[0]

    expect(reopened.updatedAt).toBe(saved.updatedAt)
    expect(reopenedChapter.content).toEqual(content)
    expect(reopenedChapter.wordCount).toBe(saved.wordCount)
    expect(reopenedChapter.version).toBe(saved.version)

    const markdown = readFileSync(join(projectPath, saved.markdownPath), 'utf8')

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
