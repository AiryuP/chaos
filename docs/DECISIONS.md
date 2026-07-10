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

## 2026-07-10 - SQLite 保存成功与 Markdown 镜像同步分开表达

Decision: 章节保存以 SQLite 提交结果为准；Markdown 镜像使用受限路径和原子文件替换。SQLite 已成功但镜像失败时，保存操作返回成功并附带镜像警告。

Reason:

- SQLite 是正文事实来源，镜像失败不能被错误描述为正文保存失败。
- 数据库事务和文件系统写入无法组成同一个跨资源原子事务。
- 明确的部分成功状态可以避免重复保存、版本号误增和作者对持久化结果的误判。

Consequence:

- Renderer 显示“正文已保存，但 Markdown 镜像同步失败”，并允许后续保存重试镜像。
- Markdown 与导出文件均先写同目录临时文件，再原子替换目标文件。
- 来自数据库的相对路径必须验证不能逃出项目目录。

## 2026-07-10 - 使用 PRAGMA user_version 管理项目数据库迁移

Decision: Chaos 项目数据库使用 SQLite `PRAGMA user_version` 作为 schema 迁移版本，按顺序执行显式 SQL 迁移，并拒绝打开由更高版本 Chaos 创建的数据库。

Reason:

- `CREATE TABLE IF NOT EXISTS` 无法处理新增列、数据变换和版本不兼容。
- 本地小说项目需要长期可打开，迁移规则必须在真实用户数据出现前建立。
- v0.1 的 schema 仍较小，显式 SQL 比提前引入完整迁移框架更容易验证。

Consequence:

- 当前 schema 版本为 1，连接同时启用 WAL、外键和 5 秒 `busy_timeout`。
- `chapters_fts` 在 v0.2 搜索设计完成前不再写入，避免重复和无法映射的旧索引。
- 后续每个 schema 变更必须新增迁移和旧版本升级测试。

## 2026-07-10 - v0.1 建立单实例与可信 Renderer 边界

Decision: Chaos 默认只运行一个应用实例，只接受顶层可信 Renderer 发起的 IPC，并拒绝 Renderer 外部导航、新窗口和权限请求。

Reason:

- 多实例同时编辑同一项目会产生最后写入覆盖和镜像竞争。
- preload 能访问本地项目能力，不能在导航到外部页面后继续暴露给不可信内容。
- 小说正文属于用户本地资产，应在联网 AI 功能出现前建立安全默认值。

Consequence:

- Electron 保持 `sandbox`、`contextIsolation` 和禁用 Node integration。
- Renderer 使用 CSP，脚本只允许同源资源；开发环境只额外允许 localhost HMR 连接。
- 关闭窗口通过 main/renderer 握手处理未保存草稿，错误堆栈不再返回 Renderer。

## 2026-07-10 - better-sqlite3 统一使用 Electron ABI

Decision: `better-sqlite3` 始终构建为当前 Electron 版本的原生 ABI；Vitest 和 E2E 夹具脚本通过 `ELECTRON_RUN_AS_NODE=1` 在 Electron 的 Node 模式中执行。

Reason:

- 普通 Node 24 和 Electron 35 使用不同的 `NODE_MODULE_VERSION`，同一个原生二进制不能同时兼容两者。
- 在 Node ABI 和 Electron ABI 之间反复覆盖会与用户常驻运行的 dev server 冲突，也容易让工作区停留在错误状态。
- 单一 Electron ABI 可以让开发运行、单元测试和 E2E 使用同一原生绑定。

Consequence:

- `pnpm dev`、`pnpm test` 和 `pnpm test:e2e` 都会先运行轻量探针，只有绑定不可用时才调用 `@electron/rebuild`。
- `pnpm test` 使用 Electron Node 模式启动 Vitest，不再运行普通 Node ABI 的 SQLite 测试。
- Windows 首次重建需要 Python 和 Visual Studio C++ Build Tools；后续探针通过时不会重复编译。

## 2026-07-10 - 新作品默认存入软件私有作品库

Decision: “新建作品”只收集作品名称、作者、题材和简介，由 main process 自动在 Electron `userData/projects` 下创建独立项目目录。用户可以在应用设置中修改以后新作品的存放位置，但新建流程不再弹出目录选择器。

Reason:

- 新建作品是创作业务动作，目录选择不应打断作者填写作品信息和进入写作空间。
- 默认私有目录可以避免在用户公共文档目录中散落应用管理文件。
- 作品名称与文件夹名称解耦后，可以安全支持任意作品标题和后续改名。
- 高级用户仍需要明确、可控的自定义存放位置。

Consequence:

- 每部作品目录使用内部项目 ID，内部继续包含 `.moqi/`、`chapters/` 和 `exports/`。
- 书架扫描当前托管目录，并保留不截断的已知作品索引，不能只依赖有限条数的“最近项目”。
- 更改全局存放位置只影响以后创建的作品，不能静默移动已有作品。
- 自定义设置损坏或目录不可访问时必须明确报错，不能悄悄回退并把作品分散到不同位置。
- “打开已有作品”继续作为独立入口，用于打开私有作品库之外的项目。

## 2026-07-10 - 跨设备开发使用 develop 与两动作交接

Decision: `main` 保持稳定，`develop` 作为公司和家里两台电脑之间唯一默认的持续开发分支。跨设备切换只定义 `handoff-out` 和 `handoff-in` 两个动作，并通过仓库脚本、交接文档和 GitHub CI 验证。

Reason:

- 两台电脑之间真正需要同步的是源码、测试、文档、依赖锁定和开发上下文，不需要同步运行中的 dev server、构建缓存或 Electron 用户数据。
- 固定 `develop` 可以让新环境无需猜测当前功能分支，降低交接复杂度。
- Git commit 只保存在本机，必须 push 并确认远端一致后，另一台电脑才能可靠继续。
- 聊天记录不能作为必要上下文，重要进度和实现原因必须进入仓库文档、测试或决策记录。

Consequence:

- “我下班了”“我要休息了”映射到 `handoff-out`，授权 Codex检查、更新 handoff、验证、提交和推送 `develop`。
- “我到家了”“我来公司了”映射到 `handoff-in`，先拒绝脏工作区，再以 `ff-only` 获取 `develop`、恢复依赖并阅读交接文档。
- 无法安全推送、拉取、恢复依赖或确认远端 commit 时必须停止，不得静默 merge、stash、reset 或覆盖。
- GitHub Actions 同时验证 `develop` 和 `main`；阶段完成后再通过 PR 将 `develop` 合并到 `main`。
