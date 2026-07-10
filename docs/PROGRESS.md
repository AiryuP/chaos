# Chaos Progress

最后更新：2026-07-10

## Current Milestone

`v0.1 Alpha - 基础本地写作闭环`

## Done

- 确定新技术栈：Electron + Vue 3 + TypeScript + Vite。
- 确定编辑器：Tiptap / ProseMirror。
- 确定状态管理：Pinia。
- 确定本地存储：SQLite + better-sqlite3。
- 确定数据访问层优先使用 Drizzle。
- 确定测试方向：Vitest + Playwright。
- 从旧 Moqi 项目迁移产品约定、协作规则、路线图、完成定义和数据契约文档。
- 初始化 Electron + Vue 3 + TypeScript + Vite + pnpm 工程骨架。
- 配置 ESLint、TypeScript、Vitest、Playwright 基础入口。
- 建立 `src/main`、`src/preload`、`src/renderer`、`src/shared` 目录结构。
- 建立 Electron main/preload/renderer 最小安全边界，preload 暴露 `window.chaos` 白名单 API。
- 建立五个一等工作区的最小 Vue/Pinia UI 壳，并接入 Tiptap 写作编辑面。
- 建立 ProseMirror JSON 到纯文本 / Markdown 的最小转换工具和单元测试。
- 隐藏 Electron 默认应用菜单栏，移除 `File / Edit / View / Window / Help` 默认项。
- 调整 renderer 初始壳层，弱化临时项目卡和检查器占位，使写作页更接近 manuscript/binder 工作台。
- 根据产品讨论，临时移除默认写作层、章节列表、检查器和未定工作区导航，启动界面先回到“书架 / 作品管理”第一层骨架。
- 试作第一层轻量布局：移除应用内品牌横幅，保留左侧轻导航与右侧模块标题 / 操作栏。
- 迭代书架层低保真布局：左侧导航收窄为 96px，顶部模块栏收紧，空状态改为“最近打开 / 全部作品表格”的信息结构占位。
- 将 Ulysses 的可借鉴点写入产品约束：安静现代、低噪音、写作页三栏节奏、少常驻面板、控件克制。
- 在 renderer 中拆分 `AppShell` 与 `ProjectShell`：书架层只管理作品，书内层管理写作、大纲、故事线、记忆、导出和设置。
- 建立书内写作页低噪音三栏骨架：书内工作区导航、章节 / Binder 栏、Tiptap 编辑器，检查器默认不常驻。
- 建立 SQLite schema 初版：`project_meta`、`chapters`、`chapters_fts`。
- 实现 `ProjectService`：创建项目文件夹、初始化 `.moqi/project.sqlite`、创建 `chapters/` 与 `exports/`、写入默认章节、打开已有项目。
- 实现最近项目记录服务，并将书架层 `新建作品`、`打开本地项目`、最近项目入口接入受控 IPC。
- 增加项目服务测试，覆盖项目创建、SQLite 文件、默认章节 Markdown 镜像和重新打开恢复。
- 增强 renderer 对 Electron preload 缺失的防护：本地能力 API 未加载时显示明确错误，不再抛出未捕获异常。
- 修复 Electron preload 在 `type: module` 项目中输出为 ESM 导致开发运行时无法注入 `window.chaos` 的问题；preload 现在构建为 `out/preload/index.cjs`。
- 实现 `ChapterService.saveChapter`：将 Tiptap / ProseMirror JSON 写回 SQLite，更新字数、更新时间和版本号，并同步章节 Markdown 镜像。
- 接入 `chapter:save` IPC、preload `window.chaos.saveChapter`、renderer 写作页手动保存按钮和保存状态。
- 增加章节保存服务测试，覆盖保存后重新打开恢复、版本/字数更新和 Markdown 镜像同步。
- 建立两地开发交接规则：新增 handoff 文档，并要求跨设备切换前更新进度、验证状态和下一步任务。
- 建立编辑器草稿和 dirty 状态：编辑后显示未保存，支持 `Ctrl+S`。
- 返回书架和关闭窗口时提供“保存并继续 / 放弃更改 / 取消”三条路径。
- 建立项目文件安全工具：限制相对路径必须位于项目目录内，并使用临时文件原子替换。
- 修正章节保存语义：SQLite 成功但 Markdown 镜像失败时返回成功和镜像警告。
- 项目创建中断时清理 Chaos 本次创建的保留文件，同时保留用户已有文件。
- 实现 `ExportService`，从 SQLite 快照导出 TXT / Markdown 到 `exports/`。
- 接入 `project:export` IPC、preload API、Renderer 导出工作区和保存后导出流程。
- 使用 SQLite `PRAGMA user_version` 建立 schema v1 迁移和高版本拒绝策略。
- SQLite 连接启用 WAL、外键和 5 秒 `busy_timeout`。
- 暂停写入未完成映射设计的 `chapters_fts`，等待 v0.2 搜索实现时重建索引契约。
- 建立 Electron 单实例、可信 Renderer IPC、外部导航/新窗口/权限拒绝和 CSP。
- 最近项目记录改为原子写入，并按规范化路径去重。
- 优化书架和写作工作区：中性视觉系统、真实最近作品列表、统一图标工具栏、保存状态和紧凑通知。
- 增加 Windows GitHub Actions，覆盖 lint、typecheck、unit test 和 build。
- 增加 Electron E2E 主闭环规格：打开、编辑、保存、导出、关闭重开恢复。
- 将“新建作品”改为作品信息流程：填写名称、作者、题材和简介，创建成功后直接进入写作空间。
- 新作品默认写入 Electron `userData/projects/<project-id>` 软件私有作品库，不再在创建时要求用户选择目录。
- 启用应用级设置页，支持查看、打开、更改和恢复默认作品存放位置；更改位置不自动移动已有作品。
- 作品名称与目录名解耦，作者、题材和简介写入 `project_meta`；旧项目缺少这些字段时按空值兼容打开。
- 扩展 Electron E2E 主闭环，从 UI 表单实际创建私有项目并验证目录结构、保存、导出和关闭重开恢复。
- 书架会扫描当前托管作品库并合并完整的已知作品索引，不再把较早作品截断在 12 条最近记录之外。
- 建立固定 `develop` 跨设备开发分支，并把“我下班了 / 我要休息了”与“我到家了 / 我来公司了”映射为 `handoff-out`、`handoff-in` 两个动作。
- 增加 PowerShell 交接脚本：离场时检查分支、敏感文件、handoff 和验证；进入时拒绝脏工作区、以 `ff-only` 拉取、恢复锁定依赖并检查 Electron ABI。
- GitHub Actions 扩展到 `develop`，拆分基础验证与 Electron E2E，并保留失败诊断产物。

## In Progress

- v0.1 本地写作代码闭环已完成，等待用户在常驻 dev 环境中做最终视觉和日常交互验收。

## Next

v0.1 收尾任务：

- 用户在常驻 Electron dev 环境中验证新建作品对话框、存放设置、书架、写作、未保存确认和导出视觉/交互。
- 家里电脑首次拉取 `develop` 并执行 `pnpm handoff:in`，确认跨设备恢复流程。
- v0.1 视觉验收通过后，通过 PR 将 `develop` 合并到 `main`，再进入 v0.2 章节 CRUD 与自动保存。

## Known Issues

- 数据访问层暂定 Drizzle；如与 Electron 打包或 better-sqlite3 原生模块流程冲突，需要记录决策后调整。
- 当前书架层已接入真实项目创建 / 打开和最近项目记录，但还没有删除、归档、搜索或标签。
- 更改作品存放位置只影响以后创建的作品，v0.1 不自动迁移已有作品。
- 默认作品位于应用私有数据目录；未来接入安装包时，卸载流程必须默认保留作品数据。
- 当前写作层能显示打开项目的章节骨架，并能手动保存当前章节内容；还没有章节新增、删除、重命名或排序。
- 写作层保持 Ulysses 风格的低噪音三栏节奏；检查器、Binder 折叠和自动保存属于 v0.2。
- `chapters_fts` 表仍存在于 schema v1，但 v0.1 不写入；v0.2 必须按章节 ID 重新设计可更新索引。
- `新建作品`、`打开本地项目` 依赖 Electron preload 暴露的 `window.chaos`；普通浏览器打开 Vite 页面时只能显示本地能力不可用提示。
- `.moqi` 继续作为当前项目目录名；如要改名，必须在真实 Alpha 用户数据出现前记录迁移决策。
- Windows 首次为 Electron 重建 `better-sqlite3` 需要 Python 与 Visual Studio C++ Build Tools；绑定就绪后测试和 E2E 不再重复编译。

## Verification Commands

常规代码层检查：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

本次运行时修复验证：

```powershell
pnpm typecheck
pnpm exec electron-vite build
```

本次章节保存闭环验证：

```powershell
pnpm exec vitest run src/main/chapter/ChapterService.test.ts
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

本次 v0.1 可靠性与导出批次验证：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node_modules\.bin\playwright.CMD test --list
```

最终结果（2026-07-10，新建作品与私有作品库批次）：

- `pnpm handoff:out`：通过，包含分支、安全文件、handoff、diff、lint、typecheck、test 和 build 门禁。
- `pnpm lint`：通过。
- `pnpm typecheck`：通过。
- `pnpm test`：8 个测试文件、21 个测试通过。
- `pnpm build`：main、preload、renderer 构建通过。
- `pnpm test:e2e`：1 个 Electron 私有项目创建与本地写作闭环测试通过。
- PowerShell `handoff-in` / `handoff-out`：语法解析通过；`handoff-in` 将在推送后用干净工作区做首次远端恢复验证。
- 新 UI 的最终视觉验收未由 Codex 执行，按项目规则交由用户确认。

端到端检查按需运行：

```powershell
pnpm test:e2e
```

若只改文档，可不运行代码检查，但最终回复必须说明“仅文档改动，未运行代码检查”。
