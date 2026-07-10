import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = mkdtempSync(join(tmpdir(), 'chaos-e2e-'))
const projectPath = join(root, 'E2E Novel')
const userDataPath = join(root, 'user-data')
const metaPath = join(projectPath, '.moqi')
const chaptersPath = join(projectPath, 'chapters')
const exportsPath = join(projectPath, 'exports')
const now = new Date().toISOString()
const chapterId = randomUUID()
const projectId = randomUUID()
const emptyDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }]
}

mkdirSync(metaPath, { recursive: true })
mkdirSync(chaptersPath, { recursive: true })
mkdirSync(exportsPath, { recursive: true })
mkdirSync(userDataPath, { recursive: true })

const db = new Database(join(metaPath, 'project.sqlite'))

try {
  db.exec(`
    CREATE TABLE project_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE chapters (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      chapter_order INTEGER NOT NULL,
      status TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      pov_entity_id TEXT,
      summary TEXT NOT NULL DEFAULT '',
      markdown_path TEXT NOT NULL,
      content_format TEXT NOT NULL DEFAULT 'prosemirror-json-v1',
      content_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE VIRTUAL TABLE chapters_fts USING fts5(
      title,
      summary,
      plain_text,
      content='',
      tokenize='unicode61'
    );
  `)
  db.pragma('user_version = 1')

  const setMeta = db.prepare('INSERT INTO project_meta (key, value) VALUES (?, ?)')
  const insertChapter = db.prepare(`
    INSERT INTO chapters (
      id, title, chapter_order, status, word_count, summary, markdown_path,
      content_format, content_json, updated_at, version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    setMeta.run('id', projectId)
    setMeta.run('name', 'E2E Novel')
    setMeta.run('updatedAt', now)
    setMeta.run('activeChapterId', chapterId)
    setMeta.run('schemaVersion', '1')
    insertChapter.run(
      chapterId,
      '未命名章节',
      1,
      'draft',
      0,
      '',
      'chapters/001.md',
      'prosemirror-json-v1',
      JSON.stringify(emptyDocument),
      now,
      1
    )
  })()
} finally {
  db.close()
}

writeFileSync(join(chaptersPath, '001.md'), '# 未命名章节\n', 'utf8')
writeFileSync(
  join(userDataPath, 'recent-projects.json'),
  `${JSON.stringify([{ name: 'E2E Novel', path: projectPath, updatedAt: now }], null, 2)}\n`,
  'utf8'
)

const fixtureDir = resolve('out/e2e-fixture')
mkdirSync(fixtureDir, { recursive: true })
writeFileSync(
  join(fixtureDir, 'manifest.json'),
  `${JSON.stringify({ root, projectPath, userDataPath }, null, 2)}\n`,
  'utf8'
)
