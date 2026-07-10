import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { CURRENT_SCHEMA_VERSION, initializeProjectDatabase } from './schema'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('project database migrations', () => {
  it('migrates a new database and applies connection safety pragmas', () => {
    const db = openTempDatabase()

    try {
      initializeProjectDatabase(db)

      expect(db.pragma('user_version', { simple: true })).toBe(CURRENT_SCHEMA_VERSION)
      expect(db.pragma('busy_timeout', { simple: true })).toBe(5000)
      expect(
        db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'chapters'").get()
      ).toBeDefined()
    } finally {
      db.close()
    }
  })

  it('rejects databases created by a newer unsupported schema version', () => {
    const db = openTempDatabase()

    try {
      db.pragma(`user_version = ${CURRENT_SCHEMA_VERSION + 1}`)
      expect(() => initializeProjectDatabase(db)).toThrow('newer than this Chaos version supports')
    } finally {
      db.close()
    }
  })
})

function openTempDatabase(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), 'chaos-schema-'))
  tempRoots.push(root)
  return new Database(join(root, 'project.sqlite'))
}
