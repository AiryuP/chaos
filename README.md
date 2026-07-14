# Chaos

Chaos is a local-first desktop editor for long-form fiction. It focuses on reliable writing, structured story memory, visual story planning, export pipelines, and carefully controlled AI assistance.

## Stack

- Electron desktop shell
- Vue 3 + TypeScript + Vite renderer
- Tiptap / ProseMirror editor
- Pinia for application state
- SQLite project store with `better-sqlite3`
- Drizzle as the preferred database access and migration layer
- Vitest for unit tests
- Playwright for end-to-end tests

## First Slice

The first slice is not an AI dashboard. It is a real local writing loop:

- Create a local novel project folder
- Open an existing project folder
- Write chapters in a Tiptap editor
- Save chapter content to SQLite as ProseMirror JSON
- Mirror readable Markdown files into `chapters/`
- Export TXT / Markdown into `exports/`
- Reopen the project and recover the last saved state

## Development

```powershell
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm handoff:in
pnpm handoff:out
```

`better-sqlite3` 使用 Electron 原生 ABI。`pnpm dev`、`pnpm test` 和 `pnpm test:e2e` 会自动检查绑定，只有首次安装或 Electron 版本变化时才重建；Windows 首次重建需要 Python 和 Visual Studio C++ Build Tools。

Use `AGENTS.md` and `docs/` as the project source of truth before starting implementation work.

Cross-device development uses `develop`: `handoff:out` verifies a session before commit/push, while `handoff:in` safely fast-forwards a clean machine, restores frozen dependencies and checks the Electron native binding.
