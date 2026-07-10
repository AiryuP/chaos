import { rebuild } from '@electron/rebuild'
import electronPath from 'electron'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const electronVersion = require('electron/package.json').version

if (canLoadBetterSqlite()) {
  console.log('better-sqlite3 Electron binding is ready')
  process.exit(0)
}

console.log(`Rebuilding better-sqlite3 for Electron ${electronVersion}`)
await rebuild({
  buildPath: process.cwd(),
  electronVersion,
  onlyModules: ['better-sqlite3'],
  force: true
})

if (!canLoadBetterSqlite()) {
  throw new Error('better-sqlite3 still cannot load in the Electron runtime after rebuilding')
}

function canLoadBetterSqlite() {
  const result = spawnSync(
    electronPath,
    ['-e', "const Database=require('better-sqlite3'); new Database(':memory:').close()"],
    {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1'
      },
      stdio: 'ignore'
    }
  )

  return result.status === 0
}
