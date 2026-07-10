import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve, sep } from 'node:path'

test.setTimeout(90_000)

test('creates a durable save/reopen/export loop', async () => {
  const fixtureManifestPath = resolve('out/e2e-fixture/manifest.json')
  const { root, userDataPath } = JSON.parse(
    readFileSync(fixtureManifestPath, 'utf8')
  ) as {
    root: string
    userDataPath: string
  }
  let app: ElectronApplication | undefined

  try {
    app = await launchApp(userDataPath)
    let page = await app.firstWindow()
    const projectPath = await createPrivateProject(page, userDataPath)
    const editor = page.locator('.writing-editor')

    await editor.fill('雨落在旧屋檐上。\n\n不要开门。')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await throwIfAppError(page, 'save the chapter')
    await expect(page.locator('.save-status')).toContainText('已保存')

    await page.getByRole('button', { name: '导出', exact: true }).click()
    await page.locator('.format-option').filter({ hasText: 'Markdown' }).click()
    await page.getByRole('button', { name: '导出作品' }).click()
    await throwIfAppError(page, 'export the project')
    await expect(page.locator('.export-result')).toContainText('导出完成')
    expect(readFileSync(join(projectPath, 'exports', 'E2E Private Novel.md'), 'utf8')).toContain(
      '雨落在旧屋檐上。'
    )

    await closeApp(app)
    app = undefined
    app = await launchApp(userDataPath)
    page = await openRecentProject(app)
    await expect(page.locator('.writing-editor')).toContainText('不要开门。')
  } finally {
    if (app) {
      await closeApp(app)
    }
    removeFixtureRoot(root)
    rmSync(fixtureManifestPath, { force: true })
  }
})

async function launchApp(userDataPath: string): Promise<ElectronApplication> {
  return electron.launch({
    args: ['.'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      CHAOS_USER_DATA_PATH: userDataPath,
      ELECTRON_RENDERER_URL: ''
    }
  })
}

async function createPrivateProject(page: Page, userDataPath: string): Promise<string> {
  await page.getByRole('button', { name: '新建作品' }).click()
  const dialog = page.getByRole('dialog', { name: '新建作品' })

  await dialog.getByLabel('作品名称').fill('E2E Private Novel')
  await dialog.getByLabel(/作者名称/).fill('E2E Author')
  await dialog.getByLabel(/作品题材/).fill('Mystery')
  await dialog.getByLabel(/作品简介/).fill('Created inside the application-private library.')
  await dialog.getByRole('button', { name: '创建并开始写作' }).click()
  await throwIfAppError(page, 'create the project')
  await page.locator('.writing-shell').waitFor()
  await expect(page.locator('.project-name')).toContainText('E2E Private Novel')

  const projectLibraryPath = join(userDataPath, 'projects')
  const projectDirectories = readdirSync(projectLibraryPath, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory()
  )

  expect(projectDirectories).toHaveLength(1)
  const projectPath = join(projectLibraryPath, projectDirectories[0].name)
  expect(existsSync(join(projectPath, '.moqi', 'project.sqlite'))).toBe(true)
  expect(existsSync(join(projectPath, 'chapters', '001.md'))).toBe(true)
  expect(existsSync(join(projectPath, 'exports'))).toBe(true)

  return projectPath
}

async function closeApp(app: ElectronApplication): Promise<void> {
  const page = app.windows()[0]

  if (!page || page.isClosed()) {
    await app.close().catch(() => undefined)
    return
  }

  const pageClosed = page.waitForEvent('close')
  const appClosed = app.waitForEvent('close')
  const dialog = page.locator('.confirm-dialog')

  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())

  const outcome = await Promise.race([
    pageClosed.then(() => 'closed' as const),
    dialog.waitFor({ state: 'visible' }).then(() => 'dialog' as const)
  ])

  if (outcome === 'dialog') {
    await page.getByRole('button', { name: '放弃更改' }).click()
    await pageClosed
  }

  await appClosed
}

function removeFixtureRoot(root: string): void {
  const resolvedTempPath = resolve(tmpdir())
  const resolvedRoot = resolve(root)
  const pathFromTemp = relative(resolvedTempPath, resolvedRoot)

  if (
    pathFromTemp === '' ||
    pathFromTemp === '..' ||
    pathFromTemp.startsWith(`..${sep}`) ||
    !pathFromTemp.startsWith('chaos-e2e-')
  ) {
    throw new Error('Refusing to remove an invalid E2E fixture path')
  }

  rmSync(resolvedRoot, { recursive: true, force: true })
}

async function openRecentProject(app: ElectronApplication): Promise<Page> {
  const page = await app.firstWindow()
  await page.locator('.project-data-row').first().click()
  await page.waitForTimeout(500)

  const errorNotice = page.locator('.notice-toast')

  if (await errorNotice.isVisible()) {
    throw new Error(`Chaos failed to open the recent project: ${await errorNotice.innerText()}`)
  }

  await page.locator('.writing-shell').waitFor()
  return page
}

async function throwIfAppError(page: Page, action: string): Promise<void> {
  await page.waitForTimeout(300)
  const errorNotice = page.locator('.notice-toast')

  if (await errorNotice.isVisible()) {
    throw new Error(`Chaos failed to ${action}: ${await errorNotice.innerText()}`)
  }
}
