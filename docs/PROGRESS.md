# Chaos Progress

最后更新：2026-07-07

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

## In Progress

- 尚未建立 SQLite schema 和迁移脚本。
- 尚未建立项目创建 / 打开服务。
- 尚未实现章节保存、Markdown 镜像和 TXT / Markdown 导出。

## Next

v0.1 的下一批任务：

- 建立 SQLite schema 初版。
- 建立项目创建/打开服务。
- 实现章节保存、Markdown 镜像、TXT/Markdown 导出。
- 建立最近项目入口的最小可用版本。
- 补充项目创建、章节保存和导出的主进程服务测试。

## Known Issues

- 数据访问层暂定 Drizzle；如与 Electron 打包或 better-sqlite3 原生模块流程冲突，需要记录决策后调整。
- 当前 UI 只保留书架层骨架，项目创建、打开、保存和导出还未接入真实本地服务。
- 写作层与书内工作区的信息架构仍在讨论中，暂不继续堆叠半成品界面。

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
