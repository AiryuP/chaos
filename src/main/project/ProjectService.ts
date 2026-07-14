import Database from 'better-sqlite3'
import { existsSync, mkdirSync, readdirSync, rmSync, rmdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

import type {
  Chapter,
  NovelProject,
  ProjectDetails,
  ProjectSummary,
  ProseMirrorDoc,
  ProjectSettings
} from '../../shared/domain'
import { createEmptyDocument, prosemirrorToMarkdown } from '../../shared/document'
import { initializeProjectDatabase } from '../db/schema'
import {
  atomicWriteTextFile,
  resolveProjectFile,
  resolveProjectFileForAccess,
  type WriteTextFile
} from '../fs/projectFiles'

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
  constructor(private readonly writeTextFile: WriteTextFile = atomicWriteTextFile) {}

  createProjectIn(projectLibraryPath: string, details: ProjectDetails): NovelProject {
    if (projectLibraryPath.trim().length === 0) {
      throw new Error('Project library path is required')
    }

    const projectId = randomUUID()
    const projectPath = join(resolve(projectLibraryPath), projectId)

    return this.createProject(projectPath, normalizeProjectDetails(details), projectId)
  }

  createProjectAt(projectPath: string, details: ProjectDetails | string): NovelProject {
    return this.createProject(projectPath, normalizeProjectDetails(details), randomUUID())
  }

  private createProject(
    projectPath: string,
    details: ProjectDetails,
    projectId: string
  ): NovelProject {
    if (projectPath.trim().length === 0) {
      throw new Error('Project path is required')
    }

    const paths = getProjectPaths(projectPath)
    const existingPaths = captureExistingPaths(paths)
    const defaultMarkdownPath = resolveProjectFile(paths.rootPath, 'chapters/001.md')

    if (existsSync(paths.databasePath)) {
      throw new Error('This folder already contains a Chaos project')
    }

    if (existsSync(defaultMarkdownPath)) {
      throw new Error('This folder already contains chapters/001.md')
    }

    try {
      mkdirSync(paths.rootPath, { recursive: true })
      mkdirSync(paths.metaPath, { recursive: true })
      mkdirSync(paths.chaptersPath, { recursive: true })
      mkdirSync(paths.exportsPath, { recursive: true })

      const databasePath = resolveProjectFileForAccess(
        paths.rootPath,
        `${PROJECT_DIR}/${DATABASE_FILE}`
      )
      const db = openDatabase(databasePath)

      try {
        initializeProjectDatabase(db)

        const now = new Date().toISOString()
        const chapter = createDefaultChapter(now)

        db.transaction(() => {
          setProjectMeta(db, 'id', projectId)
          setProjectMeta(db, 'name', details.name)
          setProjectMeta(db, 'author', details.author)
          setProjectMeta(db, 'genre', details.genre)
          setProjectMeta(db, 'description', details.description)
          setProjectMeta(db, 'updatedAt', now)
          setProjectMeta(db, 'activeChapterId', chapter.id)
          setProjectMeta(db, 'schemaVersion', '1')
          insertChapter(db, chapter)
        })()

        writeChapterMarkdown(paths.rootPath, chapter, this.writeTextFile)
      } finally {
        db.close()
      }

      return this.openProjectAt(paths.rootPath)
    } catch (error) {
      cleanupFailedCreation(paths, existingPaths)
      throw error
    }
  }

  openProjectAt(projectPath: string): NovelProject {
    if (typeof projectPath !== 'string' || projectPath.trim().length === 0) {
      throw new Error('Project path is required')
    }

    const paths = getProjectPaths(projectPath)

    if (!existsSync(paths.databasePath)) {
      throw new Error('This folder does not contain .moqi/project.sqlite')
    }

    const databasePath = resolveProjectFileForAccess(
      paths.rootPath,
      `${PROJECT_DIR}/${DATABASE_FILE}`
    )
    const db = openDatabase(databasePath)

    try {
      initializeProjectDatabase(db)

      const meta = readProjectMeta(db)
      const chapters = readChapters(db)
      const activeChapterId = requireMeta(meta, 'activeChapterId')

      if (chapters.length === 0) {
        throw new Error('Project does not contain any chapters')
      }

      if (!chapters.some((chapter) => chapter.id === activeChapterId)) {
        throw new Error('Project active chapter does not exist')
      }

      return {
        id: requireMeta(meta, 'id'),
        name: requireMeta(meta, 'name'),
        author: meta.get('author') ?? '',
        genre: meta.get('genre') ?? '',
        description: meta.get('description') ?? '',
        path: paths.rootPath,
        updatedAt: requireMeta(meta, 'updatedAt'),
        activeChapterId,
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

  listProjectsIn(projectLibraryPath: string): ProjectSummary[] {
    if (typeof projectLibraryPath !== 'string' || projectLibraryPath.trim().length === 0) {
      throw new Error('Project library path is required')
    }

    const resolvedLibraryPath = resolve(projectLibraryPath)

    if (!existsSync(resolvedLibraryPath)) {
      return []
    }

    return readdirSync(resolvedLibraryPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        try {
          return [this.readProjectSummaryAt(join(resolvedLibraryPath, entry.name))]
        } catch {
          return []
        }
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  private readProjectSummaryAt(projectPath: string): ProjectSummary {
    const paths = getProjectPaths(projectPath)

    if (!existsSync(paths.databasePath)) {
      throw new Error('This folder does not contain .moqi/project.sqlite')
    }

    const databasePath = resolveProjectFileForAccess(
      paths.rootPath,
      `${PROJECT_DIR}/${DATABASE_FILE}`
    )
    const db = openDatabase(databasePath)

    try {
      initializeProjectDatabase(db)
      const meta = readProjectMeta(db)

      return {
        name: requireMeta(meta, 'name'),
        author: meta.get('author') ?? '',
        genre: meta.get('genre') ?? '',
        path: paths.rootPath,
        updatedAt: requireMeta(meta, 'updatedAt')
      }
    } finally {
      db.close()
    }
  }
}

function normalizeProjectDetails(details: ProjectDetails | string): ProjectDetails {
  if (typeof details === 'string') {
    return normalizeProjectDetails({
      name: details,
      author: '',
      genre: '',
      description: ''
    })
  }

  const normalized = {
    name: details.name.trim(),
    author: details.author.trim(),
    genre: details.genre.trim(),
    description: details.description.trim()
  }

  if (normalized.name.length === 0) {
    throw new Error('Project name is required')
  }

  return normalized
}

function getProjectPaths(rootPath: string): {
  rootPath: string
  metaPath: string
  databasePath: string
  chaptersPath: string
  exportsPath: string
} {
  const resolvedRootPath = resolve(rootPath)
  const metaPath = join(resolvedRootPath, PROJECT_DIR)

  return {
    rootPath: resolvedRootPath,
    metaPath,
    databasePath: join(metaPath, DATABASE_FILE),
    chaptersPath: join(resolvedRootPath, 'chapters'),
    exportsPath: join(resolvedRootPath, 'exports')
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

function writeChapterMarkdown(
  rootPath: string,
  chapter: Chapter,
  writeTextFile: WriteTextFile
): void {
  const body = prosemirrorToMarkdown(chapter.content)
  const markdown = body.length > 0 ? `# ${chapter.title}\n\n${body}\n` : `# ${chapter.title}\n`

  writeTextFile(resolveProjectFileForAccess(rootPath, chapter.markdownPath), markdown)
}

interface ExistingProjectPaths {
  rootPath: boolean
  metaPath: boolean
  chaptersPath: boolean
  exportsPath: boolean
}

function captureExistingPaths(paths: ReturnType<typeof getProjectPaths>): ExistingProjectPaths {
  return {
    rootPath: existsSync(paths.rootPath),
    metaPath: existsSync(paths.metaPath),
    chaptersPath: existsSync(paths.chaptersPath),
    exportsPath: existsSync(paths.exportsPath)
  }
}

function cleanupFailedCreation(
  paths: ReturnType<typeof getProjectPaths>,
  existingPaths: ExistingProjectPaths
): void {
  for (const projectRelativePath of [
    'chapters/001.md',
    `${PROJECT_DIR}/${DATABASE_FILE}-wal`,
    `${PROJECT_DIR}/${DATABASE_FILE}-shm`,
    `${PROJECT_DIR}/${DATABASE_FILE}`
  ]) {
    try {
      const filePath = resolveProjectFileForAccess(paths.rootPath, projectRelativePath)
      rmSync(filePath, { force: true })
    } catch {
      // Keep the original creation error if cleanup cannot remove a reserved file.
    }
  }

  removeDirectoryIfCreated(paths.exportsPath, existingPaths.exportsPath)
  removeDirectoryIfCreated(paths.chaptersPath, existingPaths.chaptersPath)
  removeDirectoryIfCreated(paths.metaPath, existingPaths.metaPath)
  removeDirectoryIfCreated(paths.rootPath, existingPaths.rootPath)
}

function removeDirectoryIfCreated(path: string, existedBeforeCreation: boolean): void {
  if (existedBeforeCreation || !existsSync(path)) {
    return
  }

  try {
    rmdirSync(path)
  } catch {
    // Preserve non-empty directories in case they contain files not created by Chaos.
  }
}
