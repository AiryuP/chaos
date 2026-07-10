import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'

import type { ProjectLibrarySettings } from '../../shared/ipc'
import { atomicWriteTextFile, type WriteTextFile } from '../fs/projectFiles'

const SETTINGS_FILE = 'app-settings.json'
const DEFAULT_PROJECT_LIBRARY_DIR = 'projects'

interface PersistedAppSettings {
  projectLibraryPath?: string
}

export class ProjectLibraryService {
  private readonly settingsPath: string
  private readonly defaultLibraryPath: string

  constructor(
    userDataPath: string,
    private readonly writeTextFile: WriteTextFile = atomicWriteTextFile
  ) {
    const resolvedUserDataPath = resolve(userDataPath)
    this.settingsPath = join(resolvedUserDataPath, SETTINGS_FILE)
    this.defaultLibraryPath = join(resolvedUserDataPath, DEFAULT_PROJECT_LIBRARY_DIR)
  }

  getSettings(): ProjectLibrarySettings {
    const customPath = this.readCustomLibraryPath()

    return {
      path: customPath ?? this.defaultLibraryPath,
      isDefault: customPath === null
    }
  }

  ensureProjectLibrary(): string {
    const { path } = this.getSettings()

    try {
      mkdirSync(path, { recursive: true })
    } catch {
      throw new Error(`无法访问作品存放位置：${path}`)
    }

    return path
  }

  setProjectLibraryPath(projectLibraryPath: string): ProjectLibrarySettings {
    const resolvedPath = validateAbsolutePath(projectLibraryPath)

    try {
      mkdirSync(resolvedPath, { recursive: true })
    } catch {
      throw new Error(`无法使用选择的作品存放位置：${resolvedPath}`)
    }

    if (pathsEqual(resolvedPath, this.defaultLibraryPath)) {
      return this.resetProjectLibraryPath()
    }

    this.writeSettings({ projectLibraryPath: resolvedPath })

    return {
      path: resolvedPath,
      isDefault: false
    }
  }

  resetProjectLibraryPath(): ProjectLibrarySettings {
    try {
      mkdirSync(this.defaultLibraryPath, { recursive: true })
    } catch {
      throw new Error(`无法访问软件私有作品库：${this.defaultLibraryPath}`)
    }

    this.writeSettings({})

    return {
      path: this.defaultLibraryPath,
      isDefault: true
    }
  }

  private readCustomLibraryPath(): string | null {
    if (!existsSync(this.settingsPath)) {
      return null
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(readFileSync(this.settingsPath, 'utf8'))
    } catch {
      throw new Error('作品存放设置已损坏，请在设置中恢复默认位置')
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('作品存放设置格式无效，请在设置中恢复默认位置')
    }

    const projectLibraryPath = (parsed as PersistedAppSettings).projectLibraryPath

    if (projectLibraryPath === undefined) {
      return null
    }

    return validateAbsolutePath(projectLibraryPath)
  }

  private writeSettings(settings: PersistedAppSettings): void {
    this.writeTextFile(this.settingsPath, `${JSON.stringify(settings, null, 2)}\n`)
  }
}

function validateAbsolutePath(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0 || !isAbsolute(value)) {
    throw new Error('作品存放位置必须是有效的绝对路径')
  }

  return resolve(value)
}

function pathsEqual(left: string, right: string): boolean {
  const normalizedLeft = resolve(left)
  const normalizedRight = resolve(right)

  if (process.platform === 'win32') {
    return normalizedLeft.toLocaleLowerCase('en-US') === normalizedRight.toLocaleLowerCase('en-US')
  }

  return normalizedLeft === normalizedRight
}
