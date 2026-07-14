# Chaos 项目协作与开发规则

本文件是 Chaos 仓库的项目宪法。任何 Codex 会话、人工开发、Issue 实现、PR 审查，都必须先遵守这里的规则，再参考 `docs/` 下的路线图、架构和进度文档。

## 开工前必须阅读

每次开始改代码前，先阅读：

- `docs/PRODUCT.md`
- `docs/ROADMAP.md`
- `docs/MILESTONES.md`
- `docs/PROGRESS.md`
- `docs/HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/EDITOR_MODEL.md`

如果任务来自 GitHub Issue，还必须先复述：

- 本次目标
- 明确不做什么
- 会改哪些模块
- 验收命令

## 当前最高优先级

当前只允许优先推进 `v0.1 Alpha - 基础本地写作闭环`。

v0.1 的核心闭环是：

- 新建本地小说项目
- 打开已有本地项目
- 写章节
- 保存到 SQLite
- 同步 Markdown 镜像
- 关闭后重新打开仍能恢复
- 导出 TXT / Markdown

AI、Auto Dream、复杂图谱、DOCX/EPUB、插件系统都不能抢 v0.1 主线。

## 产品边界

Chaos 是本地优先的长篇小说桌面编辑器，不是营销页、SaaS 仪表盘、通用后台模板或 AI 聊天壳。

必须坚持：

- 稳定写作优先于功能炫技。
- 本地保存优先于云端能力。
- 结构清晰优先于自动化。
- AI 只能辅助作者，不替作者接管世界观。
- 任何功能如果不能服务当前 milestone，先进入 Backlog，不进代码。

## UI 与信息架构规则

- UI 应接近成熟写作工具，而不是 AI dashboard。
- 参考方向：Scrivener 的 Binder/Outliner、Ulysses 的安静写作流、Obsidian Canvas / Scapple 的视觉结构工作台。
- 禁止使用营销式 hero、大面积渐变、大圆角卡片堆叠、装饰性视觉元素来填充界面。
- 写作、大纲、故事线、记忆、设置是同级工作区。
- 大纲和故事线必须可以独占主 UI，不允许退回编辑页小边栏方案。
- 编辑页右侧只保留轻量检查器；需要深度梳理时跳转到完整工作台。
- 页面视觉效果默认由用户验证；除非用户明确要求，不主动打开浏览器截图或做 UI 视觉验收。

## AI 与记忆规则

- AI 默认只生成建议，不自动覆写人物、伏笔、事件、世界观、作者偏好。
- AI 生成的结构化变更必须进入 `MemoryPatch` 待确认队列。
- 每条 AI 建议必须保留证据来源、目标对象、置信度和 before/after。
- 默认上下文范围是 `minimal`：选中文本、相关摘要、相关人物/伏笔卡。
- `low-risk-auto` 和 `fully-auto` 只能作为设置项预留，不作为默认行为。
- Auto Dream 第一版只能手动触发或保存后提示触发，不做持续后台读取。

## 本地优先存储规则

每个小说项目是一个文件夹：

```text
Novel Project/
  .moqi/
    project.sqlite
  chapters/
    001.md
  exports/
    Novel Project.txt
    Novel Project.md
```

- SQLite 是结构化数据的事实来源。
- 章节正文的权威内容是 ProseMirror/Tiptap JSON。
- Markdown 是可读镜像，不是唯一源格式。
- TXT / Markdown 是 v0.1 导出目标。
- DOCX / EPUB 只保留 exporter 扩展点，不能影响 v0.1。

## 技术栈约束

- 桌面壳：Electron。
- 前端：Vue 3 + TypeScript + Vite。
- 编辑器：Tiptap / ProseMirror。
- 状态管理：Pinia。
- 本地结构化存储：SQLite。
- SQLite 访问：`better-sqlite3`。
- 数据访问层：优先使用 Drizzle；如遇到桌面打包或迁移管理问题，再评估 Kysely。
- 测试：Vitest + Playwright。
- 包管理器：pnpm。
- 不引入新的 UI 框架，除非当前 milestone 无法用现有结构完成。

## Electron 边界规则

- 文件系统、SQLite、系统 keychain、导出、最近项目列表等能力只允许在 Electron main process 中实现。
- Renderer 只能通过 preload 暴露的受控 API 调用本地能力。
- 不在 renderer 中直接使用 Node.js 文件系统或数据库能力。
- preload 暴露的 API 必须稳定、窄口、可测试。
- IPC 错误必须转换为可展示的明确错误，不允许静默吞掉。

## 代码实现习惯

- 优先复用现有组件、CSS 变量、domain 类型和本地模式。
- 不做无关重构。
- 不为了“顺手”重排目录、重命名大量文件或更换技术栈。
- 新增结构化数据字段时，同步考虑 TypeScript 类型、SQLite schema、读写映射、测试。
- 手写编辑优先使用 `apply_patch`。
- 可能存在用户改动时，不得回滚未确认的更改。

## 验证规则

每次改完代码，只做与改动相关的必要代码层面检查，例如：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

注意：

- 用户通常会自己保持 dev server 常驻运行；不要默认重启或重新启动开发服务。
- 如果必须做运行态验证，优先复用已有服务和端口。
- 只有现有服务不可用或用户明确要求时，才启动新服务。

## 两地开发与交接规则

用户会长期在不同地点、不同机器之间切换开发。GitHub 远端仓库和仓库内文档是跨设备同步的事实来源，聊天记录不能作为唯一上下文。

每次开工前必须：

- 先阅读 `docs/HANDOFF.md` 和 `docs/PROGRESS.md`，确认当前分支、最近验证结果、下一步任务和已知问题。
- 先检查 `git status --short`、当前分支和远端状态；如果用户准备在本机继续开发，应先从 GitHub 拉取最新进度。
- 如果发现本地工作区和远端状态冲突，先停下来说明风险，不要盲目覆盖或回滚。

每次收工或准备换机器前必须：

- 更新 `docs/PROGRESS.md` 和 `docs/HANDOFF.md`，写清楚完成了什么、没完成什么、最后跑过哪些验证命令、下一步从哪里接。
- 确认所有需要同步到另一台机器的源码和文档都已准备提交；不要把 `node_modules/`、`out/`、`dist/`、`.pnpm-store/`、真实小说项目文件夹或密钥提交到 GitHub。
- 如果代码还不能完全通过检查，可以提交明确标记的 WIP，但必须在 `docs/HANDOFF.md` 写明失败命令和阻塞点。

### 固定交接分支

- `main` 是稳定分支。
- `develop` 是公司和家里两台电脑之间持续开发与交接的固定分支。
- 除非用户明确改变策略，跨设备继续开发统一从 `develop` 拉取和推送，不自动猜测其它活动分支。

### 一句话交接触发

当用户说“我下班了”“我要休息了”或 `handoff-out` 时，视为明确授权 Codex 执行本次开发离场交接：

1. 确认当前分支是 `develop`，检查 diff、未跟踪文件和敏感/生成文件。
2. 更新 `docs/HANDOFF.md`；阶段进度变化时同时更新 `docs/PROGRESS.md`。
3. 运行 `pnpm handoff:out`；涉及 Electron 主闭环时运行 `pnpm handoff:out:full`。
4. 只暂存本次确认属于项目的源码、测试、配置和文档。
5. 创建正常提交；若验证无法通过但必须换机器，允许创建明确标记的 WIP 提交，并在 handoff 写明失败命令和阻塞点。
6. 推送 `develop` 到 `origin`，确认本地 `HEAD` 与 `origin/develop` 一致，并确认工作区干净。
7. 推送或远端确认失败时，不得宣布交接完成。

当用户说“我到家了”“我来公司了”或 `handoff-in` 时：

1. 运行 `pnpm handoff:in`。脚本会拒绝覆盖脏工作区，只允许 `ff-only` 更新 `develop`，恢复锁定依赖并检查 Electron 原生模块。
2. 阅读 `AGENTS.md`、`docs/HANDOFF.md`、`docs/PROGRESS.md`、当前 milestone 和相关决策。
3. 在继续编辑前复述当前目标、已完成内容、明确不做的内容、最近验证结果、已知风险和下一步。
4. 本地修改、分支分叉、拉取失败或依赖恢复失败时，停止并说明，不自动 stash、merge、reset 或覆盖。

交接只同步开发事实：源码、测试、文档、迁移、锁文件和 CI 状态。不要同步 `node_modules/`、`out/`、dev server 状态、Electron `userData`、真实小说项目或机器私有路径。

## Git 与进度规则

- 不直接把 `node_modules/`、`dist/`、`out/`、`.pnpm-store/`、Electron 打包产物提交到 GitHub。
- 每个阶段结束必须更新 `docs/PROGRESS.md`。
- 每次跨设备切换前必须更新 `docs/HANDOFF.md`。
- 重要技术选择必须记录到 `docs/DECISIONS.md`。
- 任务范围变化先更新 Issue / milestone / docs，再改代码。
