import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import type { RecentProject } from '../../shared/ipc'

const RECENT_PROJECTS_FILE = 'recent-projects.json'
const MAX_RECENT_PROJECTS = 12

export class RecentProjectsService {
  private readonly filePath: string

  constructor(userDataPath: string) {
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

    return parsed.filter(isRecentProject)
  }

  remember(project: RecentProject): void {
    const projects = [project, ...this.list().filter((item) => item.path !== project.path)].slice(
      0,
      MAX_RECENT_PROJECTS
    )

    mkdirSync(dirname(this.filePath), { recursive: true })
    writeFileSync(this.filePath, `${JSON.stringify(projects, null, 2)}\n`, 'utf8')
  }
}

function isRecentProject(value: unknown): value is RecentProject {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.name === 'string' &&
    typeof candidate.path === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}
