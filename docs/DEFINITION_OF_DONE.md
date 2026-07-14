# Definition Of Done

本文件定义 Chaos 中“完成”的最低标准。任何 Issue、milestone、PR 都应对照这里检查。

## 通用完成标准

一项任务完成必须满足：

- 属于当前 milestone 或有明确批准。
- 范围与 Issue / 用户请求一致，没有夹带无关重构。
- 用户可感知行为明确。
- 错误和空状态有基本处理。
- 类型、数据结构、IPC 接口、数据库 schema 保持一致。
- 必要文档已更新。
- 必要验证命令已运行并记录结果。

## v0.1 功能完成标准

### 项目创建

- 用户填写作品名称和可选作品信息，不需要在新建流程中选择目录。
- 默认在软件私有作品库中创建独立项目目录；全局设置可修改以后新作品的存放位置。
- 创建 `.moqi/project.sqlite`。
- 创建 `chapters/`。
- 创建 `exports/`。
- SQLite 初始化 schema。
- UI 进入新项目工作区。
- 失败时显示具体错误。

### 项目打开

- 用户能打开已有项目目录。
- 能读取 `.moqi/project.sqlite`。
- 能恢复章节列表、当前章节、项目设置。
- 数据缺失或损坏时有明确错误。

### 章节保存

- 编辑器内容能保存为 ProseMirror JSON。
- 字数、更新时间、版本号更新。
- Markdown 镜像同步到 `chapters/`。
- 关闭再打开项目后内容仍在。
- 编辑后必须显示未保存状态，保存成功后状态明确更新。
- 返回书架或关闭窗口时，不允许静默丢弃未保存内容。
- SQLite 成功但 Markdown 镜像失败时，必须明确告诉用户正文已经保存。

### 导出

- TXT 导出可打开且包含章节标题和正文。
- Markdown 导出可打开且包含章节标题和正文。
- 导出必须读取 SQLite 正文快照，并原子替换目标文件。
- DOCX / EPUB 不在 v0.1 实现范围内，但 UI 可以显示“预留”状态。

## UI 完成标准

- 符合 `docs/PRODUCT.md` 的产品气质。
- 不出现营销页式 hero、大渐变、AI dashboard 风格。
- 大纲和故事线保持独占工作区能力。
- 常见窗口宽度下文字不溢出。
- 交互控件状态清楚：active、disabled、error、empty、loading。
- 默认不要求 Codex 做浏览器视觉验收，除非用户明确要求。

## Electron 完成标准

- main process 负责文件系统、SQLite、导出、系统能力。
- preload 只暴露受控 API，不暴露任意 Node.js 能力。
- renderer 不直接访问 Node.js 文件系统或数据库。
- IPC 输入输出有 TypeScript 类型。
- IPC 错误可以被 UI 明确展示。

## AI 功能完成标准

AI 相关功能完成必须满足：

- 明确说明发送了哪些上下文。
- 默认只生成建议，不自动覆写结构化数据。
- 输出进入 MemoryPatch。
- MemoryPatch 有证据、置信度、目标类型、before/after。
- 接受和拒绝路径都可用。
- API Key 不暴露给前端明文状态。

## 数据完成标准

- 新字段同步更新：
  - TypeScript domain type。
  - Drizzle schema / SQLite schema。
  - 读写映射。
  - 测试。
- 状态枚举必须明确。
- 删除或重命名要考虑引用关系。
- 重要数据写入失败不能静默吞掉。

## 跨设备交接完成标准

当用户准备从一台机器切换到另一台机器继续开发时，必须满足：

- `docs/PROGRESS.md` 已更新当前阶段状态。
- `docs/HANDOFF.md` 已更新当前分支、最后验证命令、下一步任务和已知风险。
- 需要同步的源码、文档和测试已提交并推送到 `origin/develop`，本地 `HEAD` 与远端一致。
- 没有意外遗留的未跟踪源码文件；如果有，必须判断是要提交、忽略，还是删除。
- handoff-out 完成后工作区必须干净；推送失败不能宣称交接完成。
- 不把本地 dev server 状态、Electron 用户数据、`out/` 构建产物或真实小说项目文件夹当成可同步状态。
- 如果验证未通过，交接说明必须写清楚失败命令、错误摘要和下一步排查入口。
- handoff-in 必须先拒绝脏工作区，再使用 `git pull --ff-only` 获取 `develop`，不得自动 stash、merge 或覆盖。

## 验证命令

按改动范围选择必要命令：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

若只改文档，可不跑代码检查，但最终回复必须说明“仅文档改动，未运行代码检查”。

## PR 完成标准

PR 描述至少包含：

```md
## What changed

## What was intentionally not changed

## Verification
```

每个 PR 合并前确认：

- 不提交 `node_modules/`、`dist/`、`out/`、`.pnpm-store/`、Electron 打包产物。
- `docs/PROGRESS.md` 已更新。
- 重大决策已写入 `docs/DECISIONS.md`。
