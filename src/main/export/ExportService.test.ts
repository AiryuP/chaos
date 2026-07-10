import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import type { ProseMirrorDoc } from '../../shared/domain'
import { ChapterService } from '../chapter/ChapterService'
import { ProjectService } from '../project/ProjectService'
import { ExportService } from './ExportService'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('ExportService', () => {
  it('exports the saved sqlite snapshot as TXT and Markdown', () => {
    const root = createTempRoot()
    const projectPath = join(root, 'ExportBook')
    const projectService = new ProjectService()
    const project = projectService.createProjectAt(projectPath, '雾港来信')
    const chapter = project.chapters[0]

    new ChapterService().saveChapter({
      projectPath,
      chapterId: chapter.id,
      content: createContent()
    })

    const service = new ExportService()
    const txt = service.exportProject({ projectPath, format: 'txt' })
    const markdown = service.exportProject({ projectPath, format: 'markdown' })

    expect(txt.chapterCount).toBe(1)
    expect(markdown.chapterCount).toBe(1)
    expect(readFileSync(txt.path, 'utf8')).toContain('未命名章节\n\n雨落在旧屋檐上。')
    expect(readFileSync(markdown.path, 'utf8')).toContain('# 雾港来信')
    expect(readFileSync(markdown.path, 'utf8')).toContain('## 未命名章节')
    expect(readFileSync(markdown.path, 'utf8')).toContain('**不要开门。**')
  })

  it('sanitizes the project name before using it as an export file name', () => {
    const root = createTempRoot()
    const projectPath = join(root, 'UnsafeNameBook')
    new ProjectService().createProjectAt(projectPath, 'Night:Book')

    const exported = new ExportService().exportProject({ projectPath, format: 'txt' })

    expect(exported.path).toBe(join(projectPath, 'exports', 'Night_Book.txt'))
  })
})

function createContent(): ProseMirrorDoc {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '雨落在旧屋檐上。' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '不要开门。', marks: [{ type: 'bold' }] }]
      }
    ]
  }
}

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'chaos-export-service-'))
  tempRoots.push(root)
  return root
}
