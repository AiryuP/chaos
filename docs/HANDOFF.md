# Chaos Handoff

本文件用于两地、两台机器之间继续开发。GitHub 远端仓库、`docs/PROGRESS.md` 和本文件是交接事实来源，聊天记录不作为唯一上下文。

## Current Snapshot

- Last updated: 2026-07-14
- Current milestone: none; v0.1 is accepted and closing at repository level, while v0.2 has not started.
- Stable branch: `main`
- Active development branch: `develop`
- Remote: `origin` -> `git@github.com:AiryuP/chaos.git`
- Remote source of truth: latest `origin/develop` after `handoff-out`.
- Working tree expectation after handoff-out: clean, with local `HEAD` equal to `origin/develop`.
- v0.1 status: product, visual and interaction acceptance completed on 2026-07-14.

## Completed In This Batch

- Added active chapter draft and dirty-state tracking.
- Added `Ctrl+S`, explicit save states and save/mirror warning states.
- Added save/discard/cancel protection when returning to the library or closing the window.
- Added project-relative path validation and atomic text file replacement.
- Changed save semantics so SQLite success remains success when Markdown mirror sync fails.
- Added cleanup for interrupted project creation without recursively deleting user folders.
- Implemented TXT and Markdown export from SQLite snapshots into `exports/`.
- Added export IPC, preload API, Renderer workspace and save-before-export behavior.
- Added SQLite schema version 1 migration with `PRAGMA user_version`.
- Enabled WAL, foreign keys and a 5 second SQLite busy timeout.
- Stopped writing the incomplete contentless FTS index until v0.2 redesigns it around chapter IDs.
- Added Electron single-instance behavior, trusted Renderer IPC checks, CSP, navigation/new-window blocking and permission denial.
- Removed stack traces from Renderer-facing errors.
- Changed recent project storage to atomic writes with normalized path de-duplication.
- Refined the library and writing UI with neutral surfaces, Lucide icons, a real recent-project list, compact notifications and editor toolbar states.
- Added Windows GitHub Actions for lint, typecheck, unit tests and build.
- Added an Electron E2E loop covering open, edit, save, export, close, reopen and recovery.
- Standardized `better-sqlite3` on Electron ABI and run Vitest/fixture scripts through `ELECTRON_RUN_AS_NODE=1`.
- Replaced the native folder picker in “新建作品” with a focused metadata dialog for name, author, genre and description.
- Added an application-private project library at `userData/projects/<project-id>` and decoupled project titles from folder names.
- Added application settings for viewing, opening, changing and restoring the default project storage location.
- Persisted project details in `project_meta` while keeping older projects compatible through empty optional values.
- Updated the Electron E2E loop to create the project through the UI and verify the private directory layout before save/export/reopen checks.
- Made the shelf scan the active managed library and retain the complete known-project index instead of truncating discovery to 12 recent records.
- Added fixed `develop` branch handoff rules, safe `handoff-out` / `handoff-in` PowerShell scripts and natural-language triggers in `AGENTS.md`.
- Expanded GitHub Actions to verify `develop`, run Electron E2E separately and retain failed Playwright diagnostics.
- Replaced native Chromium scrollbars with a restrained global scrollbar style and preserved system styling in forced-colors mode.
- Completed user-led visual and interaction acceptance and formally closed the v0.1 product scope.
- Preserved edits made during an in-flight chapter save and prevented stale saves from continuing close or export actions.
- Added real-path containment checks for project databases, Markdown mirrors and exports, including directory-link regression tests.
- Made the Renderer explicitly enable the close guard only after registering its listener, with reload/crash fallback to native close behavior.
- Made Electron E2E cleanup wait for normal application shutdown before deleting fixtures; two consecutive runs passed without Windows `EPERM`.
- Removed the unused vulnerable `drizzle-orm` production dependency; v0.2 must select and install a current safe data-layer version if Drizzle is adopted.

## Verification

Passed on 2026-07-10:

```powershell
pnpm handoff:out
pnpm test:e2e
```

Results:

- Unit tests: 8 files, 21 tests passed.
- E2E tests: 1 Electron local writing loop passed.
- Production build: Electron main, preload and renderer passed.
- PowerShell handoff scripts: parser check passed; `handoff-out` completed its branch, safety, lint, typecheck, unit test and build gates.
- GitHub Actions: the first `develop` run for implementation commit `6be1d23` passed `verify` and Electron E2E: `https://github.com/AiryuP/chaos/actions/runs/29078975878`.
- Scrollbar refinement checks on 2026-07-14: lint, typecheck and production build passed.
- Final v0.1 visual and interaction acceptance: passed by user on 2026-07-14.
- v0.1 closing fixes on 2026-07-14: lint, typecheck, 10 unit-test files / 31 tests, production build, two consecutive Electron E2E runs and production dependency audit passed.
- Final `pnpm handoff:out:full` passed after the closing fixes, including diff checks, lint, typecheck, unit tests, build and Electron E2E.

## Native Module Notes

- `better-sqlite3` must use the Electron ABI, not the host Node ABI.
- `pnpm dev`, `pnpm test` and `pnpm test:e2e` run `scripts/ensure-electron-native.mjs` automatically.
- The probe creates an in-memory database under Electron Node mode. It rebuilds only when the binding is actually incompatible.
- Vitest and E2E fixture preparation run through `scripts/run-electron-node.mjs`.
- On Windows, the first rebuild may require Python and Visual Studio C++ Build Tools.
- Do not manually run `pnpm rebuild better-sqlite3` for the host Node runtime; that would replace the Electron binding.

## Next Work

1. Complete the v0.1 repository gate, push `develop`, and merge it into `main` through a verified PR.
2. Keep v0.2 unstarted until the user explicitly opens the next milestone.
3. When v0.2 is approved later, resolve the Drizzle direction and schema v2 contract before adding database writes.

## Known Remaining Issues

- Chapter add/delete/rename/reorder is not implemented; it belongs to v0.2.
- Autosave, daily word count, snapshots and search belong to v0.2.
- `chapters_fts` exists in schema version 1 but is intentionally not updated in v0.1.
- Archive remains a disabled placeholder; application settings now contains the v0.1 project storage controls.
- Changing the default storage location affects future projects only; automatic migration of existing projects is intentionally not implemented in v0.1.
- A future installer/uninstaller must preserve the default private project library unless the user explicitly chooses to remove it.
- `.moqi` remains the project metadata directory name; changing it later requires an explicit migration decision.
- Drizzle is not installed in v0.1 because the services use explicit `better-sqlite3` statements; v0.2 must resolve this direction and install a current safe version before expanding persistence code.
- There is no formal project backup/restore workflow. Manual snapshots and Markdown mirrors must not be presented as full backups.
- Installer, code signing and automatic updates are not implemented. Any future uninstaller must preserve project data by default.
- Windows is the only authoritative CI platform. macOS and Linux are not supported claims yet.

## Start Work Checklist

```powershell
pnpm handoff:in
```

Then read:

- `AGENTS.md`
- `docs/HANDOFF.md`
- `docs/PROGRESS.md`
- `docs/MILESTONES.md`
- The current Issue or user request

`handoff:in` refuses a dirty worktree, fetches and updates `develop` with `ff-only`, installs the frozen lockfile and verifies the Electron native binding. If it fails, stop and resolve the reported condition intentionally.

## End Work Checklist

1. Update this file; update `docs/PROGRESS.md` when milestone progress changed.
2. Run `pnpm handoff:out` or `pnpm handoff:out:full` for Electron main-loop changes.
3. Review and stage only intended files.
4. Commit and push `develop`.
5. Confirm the worktree is clean and local `HEAD` equals `origin/develop` before declaring handoff complete.
