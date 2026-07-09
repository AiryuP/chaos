import type Database from 'better-sqlite3'

export function initializeProjectDatabase(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS project_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chapters (
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

    CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
      title,
      summary,
      plain_text,
      content='',
      tokenize='unicode61'
    );
  `)
}
