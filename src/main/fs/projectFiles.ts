import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
  type WriteFileOptions
} from 'node:fs'
import { randomUUID } from 'node:crypto'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'

export type WriteTextFile = (targetPath: string, content: string) => void

export function resolveProjectFile(rootPath: string, projectRelativePath: string): string {
  if (projectRelativePath.trim().length === 0 || isAbsolute(projectRelativePath)) {
    throw new Error('Project file path must be a non-empty relative path')
  }

  const resolvedRoot = resolve(rootPath)
  const targetPath = resolve(resolvedRoot, projectRelativePath)
  const pathFromRoot = relative(resolvedRoot, targetPath)

  if (
    pathFromRoot === '..' ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  ) {
    throw new Error('Project file path points outside the project folder')
  }

  return targetPath
}

export const atomicWriteTextFile: WriteTextFile = (targetPath, content) => {
  const parentPath = dirname(targetPath)
  const temporaryPath = resolve(
    parentPath,
    `.${basename(targetPath)}.${randomUUID()}.tmp`
  )
  const options: WriteFileOptions = {
    encoding: 'utf8',
    flag: 'wx',
    flush: true
  }

  mkdirSync(parentPath, { recursive: true })

  try {
    writeFileSync(temporaryPath, content, options)
    renameSync(temporaryPath, targetPath)
  } finally {
    if (existsSync(temporaryPath)) {
      rmSync(temporaryPath, { force: true })
    }
  }
}
