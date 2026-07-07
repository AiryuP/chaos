# Chaos Milestones

## 当前 Milestone

### v0.1 Alpha - 基础本地写作闭环

目标：让 Chaos 能作为一个真实的本地小说写作工具启动、创建项目、保存章节、重新打开、导出文本。

## Scope

- 项目创建和打开。
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
- 新建项目后磁盘出现 `.moqi/project.sqlite`、`chapters/`、`exports/`。
- 写入一章后关闭项目，再打开仍能恢复内容。
- Markdown 镜像与章节标题/正文基本一致。
- TXT / Markdown 导出文件可打开。
- 保存失败、打开失败、导出失败时有明确错误提示。
- `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 通过。

## Next Milestones

### v0.2 Writing UX - 写作体验打磨

重点：

- 章节树 CRUD。
- 大纲页可编辑。
- 自动保存状态。
- 今日字数和章节字数。
- 手动版本快照。
- 全文搜索。

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
