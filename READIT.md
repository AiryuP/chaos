# 在不同电脑上用 Codex 继续开发 Chaos 的操作手册

这份文件用于把项目上传 GitHub 后，在家或另一台电脑继续用 Codex 开发，并尽量保证项目不跑偏。

## 1. 仓库里必须放这些文件

项目根目录应长期维护：

```text
AGENTS.md
docs/PRODUCT.md
docs/ROADMAP.md
docs/MILESTONES.md
docs/PROGRESS.md
docs/DECISIONS.md
docs/DEFINITION_OF_DONE.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/EDITOR_MODEL.md
READIT.md
```

作用：

- `AGENTS.md`：Codex 必须遵守的项目规则。
- `docs/PRODUCT.md`：产品定位和 UI 风格。
- `docs/ROADMAP.md`：长期路线。
- `docs/MILESTONES.md`：当前阶段目标和验收范围。
- `docs/PROGRESS.md`：已完成、正在做、下一步、阻塞项。
- `docs/DECISIONS.md`：架构和产品决策记录。
- `docs/DEFINITION_OF_DONE.md`：什么叫做完。
- `docs/ARCHITECTURE.md`：Electron/Vue/SQLite 架构边界。
- `docs/DATA_MODEL.md`：核心领域模型和数据库契约。
- `docs/EDITOR_MODEL.md`：Tiptap/ProseMirror 正文模型。
- `READIT.md`：跨设备继续开发操作说明。

## 2. 每次开工前的固定提示词

推荐直接对 Codex 说：

```text
我们现在在 Chaos 项目。
请先阅读 AGENTS.md 和 docs/ 下的核心文档。
本次只处理 v0.1 范围内的任务。
在改代码前，请先说明：
1. 本次目标
2. 不做什么
3. 会改哪些模块
4. 验收命令
确认理解后再开始实现。
```

如果任务来自 Issue，把 Issue 编号和内容一起贴上。

## 3. 用 Issue 控制任务

不要说：

```text
继续完善编辑器
```

要说：

```md
## Goal
实现 v0.1 的真实项目创建/打开。

## Scope
- 选择项目目录
- 创建 .moqi/project.sqlite
- 创建 chapters/ 和 exports/
- 通过 Electron IPC 接入 createProject / openProject

## Out of Scope
- 不做 AI
- 不做 DOCX/EPUB
- 不做故事图谱编辑

## Acceptance Criteria
- pnpm dev 能启动
- 新建项目后磁盘结构正确
- 关闭重开后项目能恢复
- pnpm lint/typecheck/test/build 通过
```

## 4. 每个阶段用 Milestone 锁死

建议创建这些 milestone：

```text
v0.1 Alpha - 基础本地写作闭环
v0.2 Writing UX - 章节与写作体验
v0.3 Storyline - 大纲与故事线工作台
v0.4 AI Assist - 可控 AI 建议
v0.5 Auto Dream - 手动潜意识整理
```

当前只允许做 `v0.1 Alpha` 里的 Issue。新想法先进 Backlog，不要插队。

## 5. 分支和 PR 规则

不要直接在 `main` 上开发。

```powershell
git checkout -b feature/project-open-save
```

开发完后按改动范围运行必要检查：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

PR 描述必须写：

```md
## What changed

## What was intentionally not changed

## Verification
```

## 6. 防跑偏检查清单

每次 PR 前检查：

- 是否属于当前 milestone？
- 是否符合本地优先？
- 是否没有把 AI 变成主界面？
- 是否没有把大纲/故事线塞回编辑页边栏？
- 是否没有引入不必要依赖？
- 是否没有做无关重构？
- 是否有验收命令？
- 是否更新 `docs/PROGRESS.md`？
- 重大选择是否更新 `docs/DECISIONS.md`？

## 7. 最实用的沟通方式

每次开始一个新任务时，给 Codex 三样东西：

1. 当前目标。
2. 明确不做什么。
3. 希望跑哪些验收命令。

如果你只想讨论方案，不想改代码，要明确说“先不要改代码”。否则 Codex 会默认推进实现。
