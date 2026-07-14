# Chaos 跨设备交接

本文件只记录从一台电脑切换到另一台电脑时必须知道的状态，不重复产品规划、完整进度、验证历史或决策原因。

## 当前交接状态

- 最后更新：2026-07-14
- 持续开发分支：`develop`
- 稳定分支：`main`
- 远端：`origin` -> `git@github.com:AiryuP/chaos.git`
- 当前同步批次：文档治理与用户流程说明。
- 本批次完成后，`develop` 和 `main` 应指向同一文档提交；实际状态以远端分支 HEAD 为准。

## 本批次内容

- 已完成协作、产品、路线、架构、数据、进度和交接文档的职责收敛。
- 已将版本范围合并进 `ROADMAP.md`，并删除重复的 `MILESTONES.md`。
- 已新增 `UX_FLOWS.md`，并在 `AGENTS.md` 中明确功能变化必须在同一次任务内同步相关文档。
- 本轮只有文档改动，没有业务代码修改。
- handoff 脚本和 CI 尚未修改，是否简化等待用户决定。

## 在另一台电脑继续前

1. 确认远端 `develop` 和 `main` 包含本批次提交。
2. 另一台电脑应保持干净工作区，再运行 `pnpm handoff:in`。
3. 如果本地存在修改、分支分叉或 `ff-only` 更新失败，停止自动处理并向用户确认。
4. 读取 `AGENTS.md`、本文件和 `PROGRESS.md`，再按实际任务读取相关产品、架构或数据文档。

## 机器相关说明

- `better-sqlite3` 必须使用 Electron ABI。
- `pnpm dev`、`pnpm test` 和 `pnpm test:e2e` 会先检查原生绑定，仅在不可用时重建。
- Windows 首次重建可能需要 Python 和 Visual Studio C++ Build Tools。
- 不要为了普通 Node 运行时手动重建 `better-sqlite3`，以免覆盖 Electron 绑定。

## 下次交接需要更新

- 已推送的分支和提交。
- 是否仍有未提交或未同步内容。
- 另一台机器继续工作的直接入口。
- 仅限真实存在的机器差异、依赖问题或同步风险。
