import {
  existsSync,
  mkdirSync,
  realpathSync,
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

export function resolveProjectFileForAccess(
  rootPath: string,
  projectRelativePath: string
): string {
  const resolvedRoot = resolve(rootPath)
  const targetPath = resolveProjectFile(resolvedRoot, projectRelativePath)

  if (!existsSync(resolvedRoot)) {
    throw new Error('Project folder does not exist')
  }

  const realRoot = realpathSync.native(resolvedRoot)
  const existingPath = findClosestExistingPath(targetPath, resolvedRoot)
  const realExistingPath = realpathSync.native(existingPath)

  if (!isPathWithin(realRoot, realExistingPath)) {
    throw new Error('Project file path resolves outside the project folder')
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

function findClosestExistingPath(targetPath: string, rootPath: string): string {
  let currentPath = targetPath

  while (!existsSync(currentPath)) {
    if (pathsEqual(currentPath, rootPath)) {
      return rootPath
    }

    const parentPath = dirname(currentPath)

    if (parentPath === currentPath) {
      throw new Error('Project file path has no existing parent folder')
    }

    currentPath = parentPath
  }

  return currentPath
}

function isPathWithin(rootPath: string, targetPath: string): boolean {
  const pathFromRoot = relative(rootPath, targetPath)

  return !(
    pathFromRoot === '..' ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot)
  )
}

function pathsEqual(left: string, right: string): boolean {
  const normalizedLeft = resolve(left)
  const normalizedRight = resolve(right)

  if (process.platform === 'win32') {
    return normalizedLeft.toLocaleLowerCase('en-US') === normalizedRight.toLocaleLowerCase('en-US')
  }

  return normalizedLeft === normalizedRight
}
