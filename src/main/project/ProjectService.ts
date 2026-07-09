import Database from 'better-sqlite3'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { randomUUID } from 'node:crypto'

import type { Chapter, NovelProject, ProseMirrorDoc, ProjectSettings } from '../../shared/domain'
import { createEmptyDocument, prosemirrorToMarkdown, prosemirrorToPlainText } from '../../shared/document'
import { initializeProjectDatabase } from '../db/schema'

const PROJECT_DIR = '.moqi'
const DATABASE_FILE = 'project.sqlite'
const CONTENT_FORMAT = 'prosemirror-json-v1'

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

export class ProjectService {
  createProjectAt(projectPath: string, projectName = basename(projectPath)): NovelProject {
    if (projectPath.trim().length === 0) {
      throw new Error('Project path is required')
    }

    const paths = getProjectPaths(projectPath)

    if (existsSync(paths.databasePath)) {
      throw new Error('This folder already contains a Chaos project')
    }

    mkdirSync(paths.rootPath, { recursive: true })
    mkdirSync(paths.metaPath, { recursive: true })
    mkdirSync(paths.chaptersPath, { recursive: true })
    mkdirSync(paths.exportsPath, { recursive: true })

    const db = openDatabase(paths.databasePath)

    try {
      initializeProjectDatabase(db)

      const now = new Date().toISOString()
      const projectId = randomUUID()
      const chapter = createDefaultChapter(now)

      db.transaction(() => {
        setProjectMeta(db, 'id', projectId)
        setProjectMeta(db, 'name', projectName)
        setProjectMeta(db, 'updatedAt', now)
        setProjectMeta(db, 'activeChapterId', chapter.id)
        setProjectMeta(db, 'schemaVersion', '1')
        insertChapter(db, chapter)
        indexChapter(db, chapter)
      })()

      writeChapterMarkdown(paths.rootPath, chapter)

      return this.openProjectAt(projectPath)
    } finally {
      db.close()
    }
  }

  openProjectAt(projectPath: string): NovelProject {
    const paths = getProjectPaths(projectPath)

    if (!existsSync(paths.databasePath)) {
      throw new Error('This folder does not contain .moqi/project.sqlite')
    }

    const db = openDatabase(paths.databasePath)

    try {
      initializeProjectDatabase(db)

      const meta = readProjectMeta(db)
      const chapters = readChapters(db)

      return {
        id: requireMeta(meta, 'id'),
        name: requireMeta(meta, 'name'),
        path: projectPath,
        updatedAt: requireMeta(meta, 'updatedAt'),
        activeChapterId: requireMeta(meta, 'activeChapterId'),
        chapters,
        entities: [],
        events: [],
        foreshadows: [],
        memories: [],
        memoryPatches: [],
        graphNodes: [],
        graphEdges: [],
        aiProviders: [],
        settings: createDefaultSettings()
      }
    } finally {
      db.close()
    }
  }
}

function getProjectPaths(rootPath: string): {
  rootPath: string
  metaPath: string
  databasePath: string
  chaptersPath: string
  exportsPath: string
} {
  const metaPath = join(rootPath, PROJECT_DIR)

  return {
    rootPath,
    metaPath,
    databasePath: join(metaPath, DATABASE_FILE),
    chaptersPath: join(rootPath, 'chapters'),
    exportsPath: join(rootPath, 'exports')
  }
}

function openDatabase(databasePath: string): Database.Database {
  return new Database(databasePath)
}

function createDefaultChapter(now: string): Chapter {
  return {
    id: randomUUID(),
    title: '未命名章节',
    order: 1,
    status: 'draft',
    wordCount: 0,
    summary: '',
    markdownPath: 'chapters/001.md',
    contentFormat: CONTENT_FORMAT,
    content: createEmptyDocument(),
    updatedAt: now,
    version: 1
  }
}

function createDefaultSettings(): ProjectSettings {
  return {
    contextScope: 'minimal',
    memoryWritePolicy: 'review-first',
    autoDreamTrigger: 'manual',
    autoExportFormats: ['txt', 'markdown']
  }
}

function setProjectMeta(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO project_meta (key, value)
     VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run({ key, value })
}

function readProjectMeta(db: Database.Database): Map<string, string> {
  const rows = db.prepare('SELECT key, value FROM project_meta').all() as Array<{
    key: string
    value: string
  }>

  return new Map(rows.map((row) => [row.key, row.value]))
}

function requireMeta(meta: Map<string, string>, key: string): string {
  const value = meta.get(key)

  if (!value) {
    throw new Error(`Project metadata is missing: ${key}`)
  }

  return value
}

function insertChapter(db: Database.Database, chapter: Chapter): void {
  db.prepare(
    `INSERT INTO chapters (
      id,
      title,
      chapter_order,
      status,
      word_count,
      pov_entity_id,
      summary,
      markdown_path,
      content_format,
      content_json,
      updated_at,
      version
    ) VALUES (
      @id,
      @title,
      @order,
      @status,
      @wordCount,
      @povEntityId,
      @summary,
      @markdownPath,
      @contentFormat,
      @contentJson,
      @updatedAt,
      @version
    )`
  ).run({
    ...chapter,
    povEntityId: chapter.povEntityId ?? null,
    contentJson: JSON.stringify(chapter.content)
  })
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

function readChapters(db: Database.Database): Chapter[] {
  const rows = db
    .prepare('SELECT * FROM chapters ORDER BY chapter_order ASC')
    .all() as ChapterRow[]

  return rows.map((row) => ({
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
  }))
}

function parseDocument(contentJson: string): ProseMirrorDoc {
  const parsed = JSON.parse(contentJson) as ProseMirrorDoc

  if (parsed.type !== 'doc') {
    throw new Error('Invalid chapter content format')
  }

  return parsed
}

function writeChapterMarkdown(rootPath: string, chapter: Chapter): void {
  const body = prosemirrorToMarkdown(chapter.content)
  const markdown = body.length > 0 ? `# ${chapter.title}\n\n${body}\n` : `# ${chapter.title}\n`

  writeFileSync(join(rootPath, chapter.markdownPath), markdown, 'utf8')
}
