import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { RecentProject } from '../../shared/ipc'
import { atomicWriteTextFile, type WriteTextFile } from '../fs/projectFiles'

const RECENT_PROJECTS_FILE = 'recent-projects.json'

export class RecentProjectsService {
  private readonly filePath: string

  constructor(
    userDataPath: string,
    private readonly writeTextFile: WriteTextFile = atomicWriteTextFile
  ) {
    this.filePath = join(userDataPath, RECENT_PROJECTS_FILE)
  }

  list(): RecentProject[] {
    if (!existsSync(this.filePath)) {
      return []
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(readFileSync(this.filePath, 'utf8'))
    } catch {
      return []
    }

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.flatMap((value) => {
      const project = parseRecentProject(value)
      return project ? [project] : []
    })
  }

  remember(project: RecentProject): void {
    const normalizedProject = {
      ...project,
      path: resolve(project.path)
    }
    const projectPathKey = toPathKey(normalizedProject.path)
    const projects = [
      normalizedProject,
      ...this.list().filter((item) => toPathKey(item.path) !== projectPathKey)
    ]

    this.writeTextFile(this.filePath, `${JSON.stringify(projects, null, 2)}\n`)
  }
}

function toPathKey(path: string): string {
  const normalized = resolve(path)
  return process.platform === 'win32' ? normalized.toLocaleLowerCase('en-US') : normalized
}

function parseRecentProject(value: unknown): RecentProject | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.name !== 'string' ||
    typeof candidate.path !== 'string' ||
    typeof candidate.updatedAt !== 'string'
  ) {
    return null
  }

  return {
    name: candidate.name,
    author: typeof candidate.author === 'string' ? candidate.author : '',
    genre: typeof candidate.genre === 'string' ? candidate.genre : '',
    path: candidate.path,
    updatedAt: candidate.updatedAt
  }
}
