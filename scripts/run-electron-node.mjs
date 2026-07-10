import electronPath from 'electron'
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)

if (args.length === 0) {
  throw new Error('A script path is required')
}

const child = spawn(electronPath, args, {
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1'
  },
  stdio: 'inherit'
})

child.on('error', (error) => {
  console.error(error)
  process.exitCode = 1
})

child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
