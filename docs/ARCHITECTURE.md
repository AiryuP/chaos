# Chaos 架构

本文档明确区分“当前实现”和“目标架构”。当前实现描述仓库中已经存在的能力；目标架构只表达未来方向，不能被当作已经完成的服务或接口。

## 技术基础

Chaos 使用 Electron + Vue 3 + TypeScript + Vite。正文编辑器使用 Tiptap / ProseMirror，状态管理使用 Pinia，本地结构化存储使用 SQLite 和 `better-sqlite3`。

当前数据库查询和迁移使用显式 SQL。Drizzle 当前未安装，也不是既定规则。等关系型数据和查询明显增多时，再根据实际复杂度评估是否增加类型化查询层。

## 当前实现

### 进程边界

```text
Electron main process
  - 应用窗口生命周期和单实例控制
  - 项目文件夹创建与打开
  - 软件私有作品库和全局存放位置设置
  - SQLite 连接和 schema v1 迁移
  - 当前章节保存与 Markdown 镜像
  - TXT / Markdown 导出
  - 最近项目和托管作品库扫描
  - 文件真实路径边界与原子写入

Preload
  - 暴露 window.chaos 白名单 API
  - 传递有类型的 IPC 参数和返回值
  - 传递窗口关闭请求和关闭保护握手
  - 不暴露任意 Node.js 能力

Renderer
  - AppShell / ProjectShell
  - Tiptap 编辑器和 Pinia 状态
  - 当前章节草稿、保存状态和未保存保护
  - 书架、全局存储设置、写作和导出界面
  - 通过 window.chaos 调用本地能力
```

### 当前服务

`ProjectService`：

- 在指定作品库中创建项目目录。
- 初始化 `.moqi/project.sqlite`、`chapters/` 和 `exports/`。
- 创建默认章节。
- 打开项目并读取项目元数据和章节。
- 扫描托管作品库中的项目摘要。

`ProjectLibraryService`：

- 默认使用 Electron `userData/projects` 作为软件私有作品库。
- 读取、修改和恢复以后新作品的存放位置。
- 原子保存设置，并明确报告不可访问或损坏状态。

`ChapterService`：

- 当前只负责保存已有章节正文。
- 更新字数、时间和版本号。
- 同步 Markdown 镜像，并区分正文保存成功与镜像失败。

章节新增、删除、重命名和排序尚未实现。

`ExportService`：

- 从 SQLite 的有序章节快照导出 TXT 和 Markdown。
- 不依赖 Markdown 镜像作为导出数据源。
- 使用受限项目路径和原子文件替换写入 `exports/`。

项目文件工具：

- 校验项目相对路径和真实路径都没有逃出项目目录。
- 提供同目录临时文件写入和原子替换。

### 当前工作区状态

| 层级 | 工作区 | 状态 | 当前内容 |
| --- | --- | --- | --- |
| 应用层 | 书架 | 已可用 | 创建作品、打开已有项目、显示托管作品和最近项目 |
| 应用层 | 归档 | 占位 | 导航入口禁用，尚无归档行为 |
| 应用层 | 设置 | 已可用 | 查看、打开、更改和恢复新作品存放位置 |
| 作品层 | 写作 | 已可用 | 章节列表骨架、Tiptap 编辑、手动保存和未保存保护 |
| 作品层 | 大纲 | 占位 | 导航入口存在但禁用 |
| 作品层 | 故事线 | 占位 | 导航入口存在但禁用 |
| 作品层 | 记忆 | 占位 | 导航入口存在但禁用 |
| 作品层 | 导出 | 已可用 | TXT / Markdown 导出 |
| 作品层 | 项目设置 | 占位 | 导航入口存在但禁用 |

## 目标架构

以下内容属于产品目标，不代表当前已有实现：

- 大纲工作区维护章节、分卷、摘要和状态。
- 故事线工作区维护事件、时间线、图谱和伏笔。
- 记忆工作区维护 `MemoryPatch` 审核和双域记忆。
- 项目设置维护项目级导出、上下文和记忆策略。
- AI Provider 适配器与系统 keychain 集成。
- DOCX / EPUB 导出扩展。

未来增加服务时，应继续保持业务语义清晰的边界，例如事件、记忆和 AI 能力各自位于 main process 服务中，通过 preload 暴露窄接口。服务名称和拆分在实际实现时确认，不因为这里的目标描述而预先锁定。

## IPC 原则

- API 使用业务语义命名，例如 `createProject`、`openProject`、`saveChapter` 和 `exportProject`。
- 每个 IPC 方法都有明确输入和输出类型。
- main process 返回领域对象，不把数据库行直接暴露给 Renderer。
- Renderer 不需要知道 SQLite 路径和 SQL 细节。
- 错误转换为可展示信息，不向 Renderer 暴露内部堆栈。
- SQLite 正文保存成功但 Markdown 镜像失败时，返回成功结果和可展示警告。

## 安全边界

- Renderer 保持 `sandbox` 和 `contextIsolation`，不启用 Node integration。
- Renderer 不直接导入 `fs`、`path` 或 `better-sqlite3`。
- preload API 必须白名单化。
- 项目路径输入在 main process 校验。
- IPC 只接受可信顶层 Renderer 来源。
- Renderer 禁止外部导航、新窗口和权限请求。
- 应用默认单实例运行，降低同一作品并发写入风险。
- 未来 API Key 不进入 Renderer 明文状态。

## 原生模块运行方式

- `better-sqlite3` 使用当前 Electron 版本的原生 ABI。
- `scripts/ensure-electron-native.mjs` 通过实际创建内存数据库检查绑定，只在失败时运行 `@electron/rebuild`。
- Vitest 和 E2E 夹具通过 `ELECTRON_RUN_AS_NODE=1` 使用 Electron 的 Node 模式。
- 不在普通 Node ABI 与 Electron ABI 之间反复覆盖原生模块。
