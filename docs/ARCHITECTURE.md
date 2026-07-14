# Architecture

Chaos 使用 Electron + Vue 3 + TypeScript + Vite 构建。架构目标是：renderer 保持干净，所有本地能力收敛在 main process，并通过 preload 暴露稳定的窄 API。

## 进程划分

```text
Electron main process
  - 应用窗口生命周期
  - 软件私有作品库与全局存放位置设置
  - 项目文件夹创建/打开
  - SQLite 连接和按版本迁移
  - 章节保存与 Markdown 镜像
  - TXT / Markdown 导出
  - 最近项目列表
  - 系统 keychain
  - AI provider adapter

Preload
  - 暴露 window.chaos API
  - 做 IPC 参数和返回类型边界
  - 不暴露任意 Node.js 能力
  - 传递关闭请求，但不直接决定是否放弃未保存内容

Renderer: Vue 3
  - AppShell / ProjectShell UI
  - Tiptap 编辑器
  - Pinia 状态
  - 错误/保存状态展示
  - 当前章节草稿与未保存状态
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
- SQLite 正文保存成功但 Markdown 镜像失败时，返回成功结果和可展示警告。

## 本地服务边界

### ProjectService

负责：

- 根据作品信息在 main process 指定的作品库中创建独立项目目录。
- 读取托管作品库中的项目摘要，让书架能恢复完整作品列表。
- 初始化 `.moqi/project.sqlite`。
- 创建 `chapters/` 和 `exports/`。
- 打开已有项目。
- 保存当前项目元数据。

### ProjectLibraryService

负责：

- 默认使用 Electron `userData/projects` 作为软件私有作品库。
- 原子保存用户自定义的以后新作品存放位置。
- 显式报告损坏或不可访问的设置，不静默切换到其它目录。
- 恢复默认私有目录和打开当前目录。

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
- 直接读取 SQLite 有序章节快照，不依赖 Markdown 镜像。
- 使用受限项目路径和原子文件替换写入 `exports/`。

### Project File Utilities

负责：

- 将项目相对路径解析并限制在项目根目录内。
- 同目录临时文件写入和原子替换。
- 为章节镜像、最近项目记录和导出提供一致的文件写入语义。

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
- IPC 只接受顶层可信 Renderer 来源。
- Renderer 禁止外部导航、新窗口和权限请求。
- 应用默认单实例运行，避免同一用户会话并发编辑。

## Native Module Runtime

- `better-sqlite3` 统一使用当前 Electron 版本的原生 ABI。
- `scripts/ensure-electron-native.mjs` 会实际创建内存数据库验证绑定，只有失败时才运行 `@electron/rebuild`。
- Vitest 和 E2E 夹具脚本通过 `scripts/run-electron-node.mjs` 在 `ELECTRON_RUN_AS_NODE=1` 模式中运行。
- 不在 Node ABI 与 Electron ABI 之间来回覆盖原生模块，避免破坏常驻 dev server。
