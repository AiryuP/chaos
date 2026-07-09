# Chaos Decision Log

本文件记录重要产品和技术决策。以后如果想推翻某个方向，先在这里追加新的决策记录，不要在代码中隐式改变方向。

## 2026-07-07 - 新项目使用 Electron + Vue 技术栈

Decision: 新项目 Chaos 使用 Electron + Vue 3 + TypeScript + Vite，而不是继续使用旧项目的 Tauri 2 + React + Rust。

Reason:

- 用户更熟悉 Vue，对 React 只有少量了解，对 Svelte 没有经验。
- 新项目需要用户能长期参与判断、验收和维护。
- Electron 与 Node.js 文件系统、SQLite、导出和桌面能力集成直接，适合快速建立本地写作闭环。
- 放弃旧栈是为了降低 Rust/Tauri/React 组合带来的协作和实现成本。

Consequence:

- 包体和资源占用会高于 Tauri，但开发路径更直接。
- 本地能力必须收敛在 Electron main process，通过 preload 暴露安全 API。
- 不迁移旧 React/Tauri/Rust 代码，只迁移产品规则和数据契约。

## 2026-07-07 - 正文继续使用 Tiptap / ProseMirror

Decision: 章节正文以 Tiptap / ProseMirror JSON 为权威内容，继续提供 Markdown 镜像和 TXT / Markdown 导出。

Reason:

- Moqi/Chaos 需要富文本、人物高亮、结构锚点、批注、后续 AI 证据定位。
- 纯 Markdown 难以稳定维护复杂行内结构。
- 用户选择 Vue 技术栈时，Tiptap 的 Vue 3 集成比 Lexical 更自然。
- 旧项目已经围绕 ProseMirror JSON 建立了产品和数据判断。

Consequence:

- 数据库保存 `content_json`，格式标记为 `prosemirror-json-v1`。
- Markdown 是镜像，不是事实来源。
- 导入、导出、AI 证据定位都必须围绕 ProseMirror JSON 做转换和映射。

## 2026-07-07 - 使用文件夹 + SQLite 的本地优先项目结构

Decision: 每个小说项目是一个文件夹，`.moqi/project.sqlite` 保存结构化数据，`chapters/` 保存 Markdown 镜像，`exports/` 保存导出结果。

Reason:

- SQLite 适合人物、事件、伏笔、记忆、图谱等结构化查询。
- Markdown 镜像保证正文可读、可迁移。
- 纯 TXT / Markdown 不足以承载人物高亮、锚点、MemoryPatch、图谱关系。

Consequence:

- SQLite 是事实来源。
- Markdown 是镜像，不是唯一源格式。
- 导出流程必须清楚区分保存格式和导出格式。

## 2026-07-07 - 优先使用 Drizzle 管理 SQLite 访问

Decision: SQLite 访问使用 `better-sqlite3`，数据访问和 schema 管理优先使用 Drizzle。

Reason:

- Drizzle 提供类型友好的 schema 定义和查询能力。
- Chaos 的数据模型会持续增长，需要清晰的迁移和类型边界。
- Drizzle 与 TypeScript 项目配合自然。

Consequence:

- 新字段必须同步更新 TypeScript domain type、Drizzle schema、读写映射和测试。
- 如果 Drizzle 与 Electron 原生模块打包流程冲突，再记录决策并评估 Kysely 或轻量 SQL 层。

## 2026-07-07 - AI 默认只生成可审核建议

Decision: AI 不默认自动覆写人物、伏笔、事件和世界观，而是生成 `MemoryPatch`。

Reason:

- 小说世界观和人物状态是作者资产，自动覆写风险高。
- 长篇项目需要证据链和可追溯变更。
- 建立信任比自动化更重要。

Consequence:

- MemoryPatch 是 AI 写入结构化记忆的默认入口。
- Patch 必须有 before/after、证据、目标对象、置信度和状态。
- 低风险自动写入和全自动写入只作为高级配置预留。

## 2026-07-09 - v0.1 Bootstrap 使用显式 SQL 初始化项目库

Decision: v0.1 的项目创建 / 打开服务先使用 `better-sqlite3` 执行显式 SQL 初始化 `project_meta`、`chapters` 和 `chapters_fts`。

Reason:

- 当前目标是先打通本地项目文件夹、SQLite 文件、默认章节和 Markdown 镜像这条最小闭环。
- `chapters_fts` 是 SQLite FTS5 虚拟表，显式 SQL 比过早封装迁移工具更直接。
- Electron + native SQLite 的运行和打包路径需要先稳定下来，再扩大数据访问抽象。

Consequence:

- Drizzle 仍是后续结构化数据访问的优先方向，不引入 Kysely 或其它数据层。
- 新增业务表或复杂查询前，应补 Drizzle schema / typed query 层，避免 SQL 分散在 UI 或 IPC 中。
- renderer 仍不得直接访问 SQLite；所有本地数据能力继续收敛在 main process。

## 2026-07-09 - 使用 GitHub 和 Handoff 文档支撑两地开发

Decision: Chaos 长期采用 GitHub 远端仓库 + `docs/HANDOFF.md` + `docs/PROGRESS.md` 作为跨设备开发的事实来源。

Reason:

- 用户会长期在不同地点、不同机器之间切换开发，需要无缝衔接当前进度。
- 聊天上下文、dev server 状态、Electron 本地数据和构建产物都不能可靠同步。
- 每次切换机器时，下一位开发会话必须能从仓库文档判断当前分支、最后验证、下一步任务和已知风险。

Consequence:

- 每次收工或准备换机器前，必须更新 `docs/HANDOFF.md` 和 `docs/PROGRESS.md`。
- 未推送到 GitHub 的本地改动不视为已经同步，另一台机器不能假设这些改动存在。
- 如果必须提交未完成状态，提交信息和 handoff 必须明确标记 WIP，并写清楚阻塞点。
