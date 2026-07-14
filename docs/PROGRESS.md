# Chaos 当前进度

最后更新：2026-07-14

本文件只记录当前真实实现、尚未完成的能力和近期状态。版本范围与长期方向见 `ROADMAP.md`，实现细节见架构和数据文档，跨设备状态见 `HANDOFF.md`。

## 当前状态

- 基础本地写作闭环已经可用，原 v0.1 范围于 2026-07-14 完成产品、视觉和交互验收。
- 版本号和 Milestone 只作为进度参考，不限制后续需求的实现顺序。
- 当前分支为 `develop`；是否以及何时同步到 `main` 由用户决定，不采用固定 PR 流程。
- 本轮已统一项目文档职责和过期表述，没有修改业务代码。
- 已增加用户流程文档，记录当前真实交互、系统反馈和失败路径。

## 已实现

- Electron + Vue 3 + TypeScript + Vite 应用骨架。
- 书架和作品内两层界面外壳。
- 通过作品信息创建项目，默认存入 Electron `userData/projects/<project-id>`。
- 打开已有 Chaos 项目。
- 扫描当前托管作品库并合并完整的已知作品索引。
- 查看、打开、更改和恢复以后新作品的存放位置。
- Tiptap / ProseMirror 章节编辑器。
- 当前项目和章节从 SQLite 恢复。
- 手动保存与 `Ctrl+S`。
- 保存状态、草稿未保存状态和保存期间继续编辑的竞态保护。
- 返回书架或关闭窗口时提供保存、放弃和取消路径。
- SQLite 正文保存成功与 Markdown 镜像失败分别表达。
- Markdown 镜像同步。
- 从 SQLite 有序章节快照导出 TXT 和 Markdown。
- 导出前处理未保存草稿。
- 已建立项目路径、原子写入、可信 IPC、CSP 和未保存关闭保护等本地安全边界。
- `better-sqlite3` 统一使用 Electron ABI。
- 已有 Vitest 单元测试、Electron Playwright 主闭环测试和 Windows GitHub Actions。
- 当前数据库访问使用 `better-sqlite3 + 显式 SQL`；Drizzle 未安装。
- 跨设备开发当前使用 `develop`、GitHub 远端和 handoff 脚本。

工作区的具体可用状态见 `ARCHITECTURE.md`，SQLite 契约见 `DATA_MODEL.md`，正文契约见 `EDITOR_MODEL.md`。

## 尚未实现

- 章节新增、删除、重命名和排序。
- 自动保存、今日字数、手动快照和全文搜索。
- 可折叠检查器和完整的较窄窗口体验。
- 大纲、故事线、记忆和项目设置工作区的真实业务能力。
- 归档、删除、标签和作品搜索。
- 人物、事件、伏笔、记忆和图谱持久化。
- AI 服务商接入、`MemoryPatch` 和 Auto Dream。
- 正式项目备份与恢复。
- TXT、Markdown、DOCX 导入以及 DOCX / EPUB 导出。
- 安装器、代码签名、自动更新和正式跨平台支持。

## 当前注意事项

- `chapters_fts` 是 schema v1 中遗留但未启用的表，详细说明见 `DATA_MODEL.md`。
- 更改作品存放位置只影响以后创建的作品，不会自动移动已有作品。
- 默认作品位于应用私有数据目录；未来卸载流程应默认保留用户作品。
- `.moqi` 仍是当前项目元数据目录名，若要改名需要明确迁移现有项目。
- Windows 是当前唯一有 CI 记录的平台，不能据此宣称 macOS 或 Linux 已受支持。
- handoff 脚本和 CI 仍保留原有自动检查，是否简化等待用户单独决定。

## 接下来

- 本轮文档治理同步到 `develop` 和 `main` 后，与用户讨论下一步开发需求。
- handoff 脚本和 CI 是否简化，在相关问题进入讨论时由用户决定。
- 后续功能按用户实际需求选择；路线图只提供影响提示和进度参考。
