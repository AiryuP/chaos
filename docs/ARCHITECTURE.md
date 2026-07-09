# Architecture

Chaos 使用 Electron + Vue 3 + TypeScript + Vite 构建。架构目标是：renderer 保持干净，所有本地能力收敛在 main process，并通过 preload 暴露稳定的窄 API。

## 进程划分

```text
Electron main process
  - 应用窗口生命周期
  - 项目文件夹创建/打开
  - SQLite 连接和迁移
  - 章节保存与 Markdown 镜像
  - TXT / Markdown 导出
  - 最近项目列表
  - 系统 keychain
  - AI provider adapter

Preload
  - 暴露 window.chaos API
  - 做 IPC 参数和返回类型边界
  - 不暴露任意 Node.js 能力

Renderer: Vue 3
  - AppShell / ProjectShell UI
  - Tiptap 编辑器
  - Pinia 状态
  - 错误/保存状态展示
  - 通过 window.chaos 调用本地能力
```

## UI Shell 分层

Chaos renderer 必须区分两层外壳：

```text
AppShell
  - LibraryView: 书架，管理本地作品入口
  - ArchiveView: 归档作品
  - AppSettingsView: 全局设置

ProjectShell
  - WritingView: 写作，组织栏 + 章节栏 + 编辑器
  - OutlineView: 大纲，独立结构工作区
  - StorylineView: 故事线，独立结构工作区
  - MemoryView: 记忆与 AI 建议审核
  - ExportView: TXT / Markdown 导出
  - ProjectSettingsView: 单本书设置
```

AppShell 只管理“书”，不直接编辑章节正文、大纲、人物、伏笔或导出内容。ProjectShell 只管理当前打开的书，不承担全局书架管理职责。

写作页采用 Ulysses 可借鉴的低噪音三栏节奏：组织栏、章节 / Binder 栏、编辑器。检查器、元数据、统计和辅助工具默认不常驻，只在需要时打开。

## 推荐目录结构

```text
src/
  main/
    app.ts
    ipc.ts
    project/
    db/
    export/
    ai/
  preload/
    index.ts
    api.ts
  renderer/
    main.ts
    App.vue
    shells/
    components/
    workspaces/
    stores/
    styles/
  shared/
    domain.ts
    ipc.ts
    errors.ts
    document.ts
```

## IPC 设计原则

- API 名称使用业务语义：`createProject`、`openProject`、`saveChapter`、`exportProject`。
- 每个 IPC 方法都有明确输入/输出类型。
- main process 返回 domain object，不返回数据库 row。
- 错误统一转成 `{ message, code?, detail? }`。
- renderer 不知道 SQLite 路径和 SQL 细节。

## 本地服务边界

### ProjectService

负责：

- 创建项目目录。
- 初始化 `.moqi/project.sqlite`。
- 创建 `chapters/` 和 `exports/`。
- 打开已有项目。
- 保存当前项目元数据。

### ChapterService

负责：

- 创建、读取、更新、删除章节。
- 保存 ProseMirror JSON。
- 更新字数、更新时间、版本号。
- 同步 Markdown 镜像。

### ExportService

负责：

- TXT 导出。
- Markdown 导出。
- 为 DOCX / EPUB 保留扩展点。

### MemoryService

负责：

- 读取 MemoryPatch 队列。
- 接受 / 拒绝 MemoryPatch。
- 维护 memory records。

### AiService

v0.1 不实现真实联网调用，只保留 provider 配置和后续扩展边界。

## 安全规则

- Renderer 不开启任意 Node integration。
- Renderer 不直接 import `fs`、`path`、`better-sqlite3`。
- preload API 必须白名单化。
- API Key 不进入 renderer 明文状态。
- 项目路径输入必须在 main process 里校验。
