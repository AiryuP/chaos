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
```

Use `AGENTS.md` and `docs/` as the project source of truth before starting implementation work.
