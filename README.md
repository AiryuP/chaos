# Chaos

Chaos 是一款本地优先的长篇小说桌面编辑器，关注可靠写作、结构化故事资料、视觉规划、导出流程和可控的 AI 辅助。

## 当前能力

- 在软件私有作品库中创建作品，也可以打开已有本地项目。
- 使用 Tiptap / ProseMirror 编辑章节。
- 将正文以 ProseMirror JSON 保存到 SQLite。
- 同步可读的 Markdown 镜像。
- 导出 TXT 和 Markdown。
- 关闭并重新打开后恢复已保存内容。
- 在离开项目或关闭应用时保护未保存草稿。

## 当前技术栈

- Electron
- Vue 3 + TypeScript + Vite
- Tiptap / ProseMirror
- Pinia
- SQLite + `better-sqlite3`
- 显式 SQL 查询和 `PRAGMA user_version` 迁移
- Vitest 与 Playwright
- pnpm

Drizzle 当前没有安装，也不是现阶段既定方案。未来数据关系明显变复杂时，再评估是否增加类型化查询层。

## 本地开发

```powershell
pnpm install
pnpm dev
```

仓库还提供 `lint`、`typecheck`、`test`、`build`、`test:e2e` 和跨设备交接命令。这些命令是可用工具，不在文档中作为每项工作的固定完成门槛。

`better-sqlite3` 使用 Electron 原生 ABI。`pnpm dev`、`pnpm test` 和 `pnpm test:e2e` 会自动检查绑定，仅在绑定不可用时重建。

项目协作原则见 `AGENTS.md`。当前实现见 `docs/PROGRESS.md`，长期方向见 `docs/PRODUCT.md` 和 `docs/ROADMAP.md`。

## 文档入口

- `docs/PRODUCT.md`：产品愿景和长期体验方向。
- `docs/ROADMAP.md`：版本路线与进度参考。
- `docs/PROGRESS.md`：当前已经实现和尚未实现的能力。
- `docs/UX_FLOWS.md`：当前用户流程、系统反馈和失败路径。
- `docs/ARCHITECTURE.md`：当前架构、工作区状态和目标架构。
- `docs/DATA_MODEL.md`：已落库模型和未来领域草案。
- `docs/EDITOR_MODEL.md`：正文与编辑器契约。
- `docs/DECISIONS.md`：重要产品和技术决定。
- `docs/HANDOFF.md`：当前跨设备交接状态。
- `READIT.md`：跨设备操作方法。
