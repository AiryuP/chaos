# Chaos Milestones

## 已完成 Milestone

### v0.1 Alpha - 基础本地写作闭环

状态：已于 2026-07-14 完成产品、视觉和交互验收。

目标：让 Chaos 能作为一个真实的本地小说写作工具启动、创建项目、保存章节、重新打开、导出文本。

## Scope

- 作品信息创建、软件私有作品库和已有项目打开。
- Electron main/preload/renderer 的最小安全通信。
- SQLite schema 作为结构化数据源。
- 章节正文保存、加载、更新。
- Markdown 镜像同步。
- TXT / Markdown 导出。
- 基础错误提示。
- 最近项目入口可以先做最小可用版本。

## Out Of Scope

- AI 真正联网调用。
- Auto Dream 完整后台流程。
- DOCX / EPUB 实际导出。
- 复杂图谱编辑器。
- 插件系统。
- 云同步。
- 用户账户。
- 从旧 Moqi 项目直接迁移代码。

## Acceptance Criteria

- `pnpm dev` 能启动桌面开发环境。
- 新建作品时不要求选择目录，创建后软件私有作品库中出现 `.moqi/project.sqlite`、`chapters/`、`exports/`。
- 写入一章后关闭项目，再打开仍能恢复内容。
- Markdown 镜像与章节标题/正文基本一致。
- TXT / Markdown 导出文件可打开。
- 保存失败、打开失败、导出失败时有明确错误提示。
- `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 通过。

## 下一 Milestone（尚未启动）

### v0.2 Writing UX - 写作体验打磨

状态：等待用户明确启动。

目标：让作者愿意每天打开 Chaos 写作，并能安全维护一部长篇作品的章节结构。

## Scope

- 章节新增、重命名、删除和排序。
- 大纲页摘要编辑和状态切换。
- 自动保存状态、今日字数和章节字数。
- 手动版本快照与明确的恢复路径。
- 基于 SQLite FTS5 的全文搜索。
- 可折叠检查器与小屏写作体验。

## Out Of Scope

- AI 联网调用与 MemoryPatch。
- 故事线、事件和复杂图谱编辑。
- Auto Dream。
- DOCX / EPUB 导出。
- 云同步与协作编辑。
- 安装器、自动更新和跨平台发布。

## Acceptance Criteria

- 章节新增、重命名、删除、排序后关闭并重新打开仍保持一致。
- 章节结构变化同步维护 Markdown 镜像，失败时给出明确、不会误导正文状态的提示。
- 自动保存不会覆盖更新版本或静默丢失草稿，保存状态对作者清晰可见。
- 今日字数和章节字数在保存、切换章节和重新打开后语义一致。
- 手动快照可以创建、识别来源并通过明确确认恢复，不把快照误称为完整项目备份。
- 搜索结果能够稳定映射到章节，并可从现有数据库重建索引。
- 检查器可折叠，较窄桌面窗口下正文和关键操作不发生遮挡。
- `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、相关 Electron E2E 通过。

## Next Milestones

### v0.3 Storyline - 大纲与故事线工作台

重点：

- 事件管理。
- 时间线管理。
- 图谱节点和边管理。
- 伏笔账本状态流转。
- 图谱到正文/人物/伏笔的跳转。

### v0.4 AI Assist - 可控 AI 建议

重点：

- Provider 配置。
- Keychain 存密钥。
- AI 润色、总结、提取。
- MemoryPatch 审核队列。
- 上下文范围选择。

### v0.5 Auto Dream - 手动潜意识整理

重点：

- 语义压缩。
- 实体进化。
- 伏笔对冲。
- 运行记录。
- 失败记录。

## Backlog 规则

任何好想法如果不服务当前 milestone，都先放进 Backlog。进入开发前必须重新判断：

- 是否属于当前 milestone。
- 是否有清晰验收标准。
- 是否会破坏本地优先。
- 是否会把 AI 推到主界面喧宾夺主。
- 是否会引入不必要依赖。
