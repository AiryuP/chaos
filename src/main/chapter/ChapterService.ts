import Database from 'better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { Chapter, ProseMirrorDoc } from '../../shared/domain'
import { prosemirrorToMarkdown, prosemirrorToPlainText } from '../../shared/document'
import type { SaveChapterInput } from '../../shared/ipc'
import { initializeProjectDatabase } from '../db/schema'

const PROJECT_DIR = '.moqi'
const DATABASE_FILE = 'project.sqlite'

interface ChapterRow {
  id: string
  title: string
  chapter_order: number
  status: Chapter['status']
  word_count: number
  pov_entity_id: string | null
  summary: string
  markdown_path: string
  content_format: Chapter['contentFormat']
  content_json: string
  updated_at: string
  version: number
}

export class ChapterService {
  saveChapter(input: SaveChapterInput): Chapter {
    const projectPath = requireText(input?.projectPath, 'Project path is required')
    const chapterId = requireText(input?.chapterId, 'Chapter id is required')
    const content = requireDocument(input?.content)
    const databasePath = join(projectPath, PROJECT_DIR, DATABASE_FILE)

    if (!existsSync(databasePath)) {
      throw new Error('This folder does not contain .moqi/project.sqlite')
    }

    const db = new Database(databasePath)

    try {
      initializeProjectDatabase(db)

      const existing = readChapter(db, chapterId)
      const now = new Date().toISOString()
      const updated: Chapter = {
        ...existing,
        content,
        wordCount: countWords(content),
        updatedAt: now,
        version: existing.version + 1
      }

      db.transaction(() => {
        updateChapter(db, updated)
        setProjectMeta(db, 'updatedAt', now)
        indexChapter(db, updated)
      })()

      writeChapterMarkdown(projectPath, updated)

      return updated
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

function requireDocument(value: unknown): ProseMirrorDoc {
  if (!isDocument(value)) {
    throw new Error('Invalid chapter content format')
  }

  return value
}

function isDocument(value: unknown): value is ProseMirrorDoc {
  return typeof value === 'object' && value !== null && 'type' in value && value.type === 'doc'
}

function readChapter(db: Database.Database, chapterId: string): Chapter {
  const row = db.prepare('SELECT * FROM chapters WHERE id = ?').get(chapterId) as
    | ChapterRow
    | undefined

  if (!row) {
    throw new Error('Chapter not found')
  }

  return rowToChapter(row)
}

function rowToChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    title: row.title,
    order: row.chapter_order,
    status: row.status,
    wordCount: row.word_count,
    povEntityId: row.pov_entity_id ?? undefined,
    summary: row.summary,
    markdownPath: row.markdown_path,
    contentFormat: row.content_format,
    content: parseDocument(row.content_json),
    updatedAt: row.updated_at,
    version: row.version
  }
}

function parseDocument(contentJson: string): ProseMirrorDoc {
  const parsed = JSON.parse(contentJson) as ProseMirrorDoc

  if (!isDocument(parsed)) {
    throw new Error('Invalid chapter content format')
  }

  return parsed
}

function countWords(content: ProseMirrorDoc): number {
  const plainText = prosemirrorToPlainText(content).trim()
  return plainText.length
}

function updateChapter(db: Database.Database, chapter: Chapter): void {
  const result = db
    .prepare(
      `UPDATE chapters
       SET word_count = @wordCount,
           content_json = @contentJson,
           updated_at = @updatedAt,
           version = @version
       WHERE id = @id`
    )
    .run({
      id: chapter.id,
      wordCount: chapter.wordCount,
      contentJson: JSON.stringify(chapter.content),
      updatedAt: chapter.updatedAt,
      version: chapter.version
    })

  if (result.changes !== 1) {
    throw new Error('Chapter not found')
  }
}

function setProjectMeta(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO project_meta (key, value)
     VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run({ key, value })
}

function indexChapter(db: Database.Database, chapter: Chapter): void {
  db.prepare(
    `INSERT INTO chapters_fts (title, summary, plain_text)
     VALUES (@title, @summary, @plainText)`
  ).run({
    title: chapter.title,
    summary: chapter.summary,
    plainText: prosemirrorToPlainText(chapter.content)
  })
}

function writeChapterMarkdown(rootPath: string, chapter: Chapter): void {
  const body = prosemirrorToMarkdown(chapter.content)
  const markdown = body.length > 0 ? `# ${chapter.title}\n\n${body}\n` : `# ${chapter.title}\n`
  const markdownPath = join(rootPath, chapter.markdownPath)

  mkdirSync(dirname(markdownPath), { recursive: true })
  writeFileSync(markdownPath, markdown, 'utf8')
}
