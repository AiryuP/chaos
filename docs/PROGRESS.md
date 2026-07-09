# Chaos Progress

最后更新：2026-07-09

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
- 建立两地开发交接规则：新增 handoff 文档，并要求跨设备切换前更新进度、验证状态和下一步任务。

## In Progress

- 尚未实现章节保存 / 加载后的编辑写回。
- 尚未实现保存后 Markdown 镜像更新。
- 尚未实现 TXT / Markdown 导出。

## Next

v0.1 的下一批任务：

- 实现章节保存 IPC 和 `ChapterService`，将 Tiptap JSON 写回 SQLite。
- 保存章节时同步更新 `chapters/001.md` Markdown 镜像。
- 实现 TXT / Markdown 导出到 `exports/`。
- 补充章节保存和导出的主进程服务测试。

## Known Issues

- 数据访问层暂定 Drizzle；如与 Electron 打包或 better-sqlite3 原生模块流程冲突，需要记录决策后调整。
- 当前书架层已接入真实项目创建 / 打开和最近项目记录，但还没有删除、归档、搜索或标签。
- 当前写作层能显示打开项目的章节骨架，但还没有保存编辑内容。
- 写作层已确定借鉴 Ulysses 的低噪音三栏节奏，检查器、保存状态和导出流程仍需随 v0.1 本地服务接入继续实现。
- `新建作品`、`打开本地项目` 依赖 Electron preload 暴露的 `window.chaos`；普通浏览器打开 Vite 页面时只能显示本地能力不可用提示。

## Verification Commands

常规代码层检查：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

端到端检查按需运行：

```powershell
pnpm test:e2e
```

若只改文档，可不运行代码检查，但最终回复必须说明“仅文档改动，未运行代码检查”。
