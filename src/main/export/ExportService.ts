import Database from 'better-sqlite3'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { ProseMirrorDoc } from '../../shared/domain'
import { prosemirrorToMarkdown, prosemirrorToPlainText } from '../../shared/document'
import type {
  ExportProjectInput,
  ExportProjectOutput,
  SupportedExportFormat
} from '../../shared/ipc'
import { initializeProjectDatabase } from '../db/schema'
import {
  atomicWriteTextFile,
  resolveProjectFileForAccess,
  type WriteTextFile
} from '../fs/projectFiles'

interface ExportChapterRow {
  title: string
  content_json: string
}

interface ExportChapter {
  title: string
  content: ProseMirrorDoc
}

export class ExportService {
  constructor(private readonly writeTextFile: WriteTextFile = atomicWriteTextFile) {}

  exportProject(input: ExportProjectInput): ExportProjectOutput {
    const projectPath = resolve(requireText(input?.projectPath, 'Project path is required'))
    const format = requireFormat(input?.format)
    const databasePath = resolveProjectFileForAccess(projectPath, '.moqi/project.sqlite')

    if (!existsSync(databasePath)) {
      throw new Error('This folder does not contain .moqi/project.sqlite')
    }

    const db = new Database(databasePath)

    try {
      initializeProjectDatabase(db)

      const projectName = readProjectName(db)
      const chapters = readChapters(db)
      const extension = format === 'txt' ? 'txt' : 'md'
      const exportFileName = `${sanitizeFileName(projectName)}.${extension}`
      const exportPath = resolveProjectFileForAccess(
        projectPath,
        join('exports', exportFileName)
      )
      const content =
        format === 'txt'
          ? renderPlainTextExport(chapters)
          : renderMarkdownExport(projectName, chapters)

      this.writeTextFile(exportPath, content)

      return {
        format,
        path: exportPath,
        exportedAt: new Date().toISOString(),
        chapterCount: chapters.length
      }
    } finally {
      db.close()
    }
  }
}

function requireText(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(message)
  }

  return value
}

function requireFormat(value: unknown): SupportedExportFormat {
  if (value !== 'txt' && value !== 'markdown') {
    throw new Error('Only TXT and Markdown export are supported')
  }

  return value
}

function readProjectName(db: Database.Database): string {
  const row = db.prepare("SELECT value FROM project_meta WHERE key = 'name'").get() as
    | { value: string }
    | undefined

  if (!row?.value) {
    throw new Error('Project metadata is missing: name')
  }

  return row.value
}

function readChapters(db: Database.Database): ExportChapter[] {
  const rows = db
    .prepare('SELECT title, content_json FROM chapters ORDER BY chapter_order ASC')
    .all() as ExportChapterRow[]

  return rows.map((row) => ({
    title: row.title,
    content: parseDocument(row.content_json)
  }))
}

function parseDocument(contentJson: string): ProseMirrorDoc {
  const parsed = JSON.parse(contentJson) as ProseMirrorDoc

  if (parsed.type !== 'doc') {
    throw new Error('Invalid chapter content format')
  }

  return parsed
}

function renderPlainTextExport(chapters: ExportChapter[]): string {
  const content = chapters
    .map((chapter) => {
      const body = prosemirrorToPlainText(chapter.content)
      return body ? `${chapter.title}\n\n${body}` : chapter.title
    })
    .join('\n\n\n')

  return content ? `${content}\n` : ''
}

function renderMarkdownExport(projectName: string, chapters: ExportChapter[]): string {
  const sections = [`# ${toSingleLine(projectName)}`]

  for (const chapter of chapters) {
    const body = prosemirrorToMarkdown(chapter.content)
    sections.push(body ? `## ${toSingleLine(chapter.title)}\n\n${body}` : `## ${toSingleLine(chapter.title)}`)
  }

  return `${sections.join('\n\n')}\n`
}

function sanitizeFileName(value: string): string {
  const sanitized = [...value]
    .map((character) => (character.charCodeAt(0) < 32 ? '_' : character))
    .join('')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim()
  const baseName = sanitized || 'Novel'

  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(baseName)
    ? `${baseName}_`
    : baseName
}

function toSingleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}
