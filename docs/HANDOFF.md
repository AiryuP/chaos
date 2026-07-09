# Chaos Handoff

本文件用于两地、两台机器之间无缝接续开发。它记录当前仓库状态、最后验证、下一步任务和交接规则。

## Current Snapshot

- Last updated: 2026-07-09
- Current milestone: `v0.1 Alpha - 基础本地写作闭环`
- Primary branch: `main`
- Remote: `origin` -> `git@github.com:AiryuP/chaos.git`
- Last known local commit before today's uncommitted work: `cf78cfb`
- Last code verification in this workspace: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` passed on 2026-07-09.
- Visual verification: not done by Codex; user verifies UI manually.

## Current Product / Architecture State

- App shell and project shell are split.
- App shell is the first layer: book/library management only.
- Project shell is the second layer: writing, outline, storyline, memory, export, settings.
- UI direction is Ulysses-inspired: quiet, modern, low-noise, fewer persistent panels, fewer decorative cards and large radii.
- v0.1 remains limited to local writing loop: project create/open, chapter save/load, Markdown mirror, TXT/Markdown export.
- AI, Auto Dream, complex graph, DOCX/EPUB, plugins, cloud sync and accounts remain out of scope for v0.1.

## Current Implementation State

- Electron + Vue 3 + TypeScript + Vite skeleton exists.
- Preload exposes `window.chaos` with app/project APIs.
- Renderer guards against missing `window.chaos`; ordinary browser Vite pages cannot use local project APIs.
- SQLite schema bootstrap exists for `project_meta`, `chapters`, and `chapters_fts`.
- `ProjectService` can create and open local project folders with `.moqi/project.sqlite`, `chapters/`, `exports/`, and default `chapters/001.md`.
- Recent project storage exists in Electron `userData`.
- Writing workspace currently shows opened project chapters but does not yet save editor changes back to SQLite.

## Next Work

1. Implement `ChapterService` in the Electron main process.
2. Add IPC and preload API for loading and saving chapters.
3. Save Tiptap / ProseMirror JSON to SQLite.
4. Update chapter word count, `updated_at`, and `version` on save.
5. Sync Markdown mirror to `chapters/001.md` after save.
6. Add focused tests for chapter save/load and Markdown mirror sync.
7. Then implement TXT / Markdown export service and tests.

## Known Runtime Notes

- `新建作品` and `打开本地项目` require the Electron renderer with preload loaded.
- Opening `http://localhost:5173/` in a normal browser is useful only for visual preview; local project APIs will be unavailable.
- After main/preload changes, restart the Electron app window. The renderer hot reload alone may not pick up preload changes.
- User normally keeps dev server running; do not restart it unless necessary or explicitly requested.
- Codex should not run browser visual QA unless the user asks for it.

## Start Work Checklist

Run this before continuing work on either machine:

```powershell
git status --short
git branch --show-current
git pull --ff-only
pnpm install
```

Then read:

- `AGENTS.md`
- `docs/HANDOFF.md`
- `docs/PROGRESS.md`
- `docs/MILESTONES.md`
- Any issue or task description for the current work

If `git pull --ff-only` fails, stop and resolve the branch divergence intentionally. Do not overwrite local work.

## End Work Checklist

Before switching machines or ending the day:

1. Run the checks relevant to the change.
2. Update `docs/PROGRESS.md`.
3. Update this `docs/HANDOFF.md` snapshot and next work section.
4. Confirm generated/build artifacts are not staged.
5. Commit the intended changes.
6. Push the current branch to GitHub.
7. On the other machine, start from `git pull --ff-only`.

## Git Commands For Handoff

Typical end-of-day sequence:

```powershell
git status --short
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git add AGENTS.md docs src package.json pnpm-lock.yaml electron.vite.config.ts tsconfig*.json *.config.*
git status --short
git commit -m "chore: update v0.1 project handoff"
git push origin main
```

Adjust staged paths to the actual work. Do not blindly stage local novel project folders, secrets, `node_modules/`, `out/`, `dist/`, or `.pnpm-store/`.
