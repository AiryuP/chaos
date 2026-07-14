# Chaos 数据模型

本文档区分“已落库模型”和“未来领域草案”。只有已落库模型描述当前持久化契约；未来草案用于产品和架构讨论，不能被当作当前数据库已实现字段。

## 当前项目目录

```text
<应用用户数据目录>/projects/
  <project-id>/
    .moqi/
      project.sqlite
    chapters/
      001.md
    exports/
      Novel Project.txt
      Novel Project.md
```

默认作品库位于软件私有数据目录。用户可以修改以后新作品的存放位置。作品名称保存在 SQLite 元数据中，不依赖文件夹名称。SQLite 是事实来源，Markdown 是可读镜像。

## 已落库模型

### 项目元数据

当前 `project_meta` 使用键值结构保存：

- `id`
- `name`
- `author`
- `genre`
- `description`
- `updatedAt`
- `activeChapterId`
- `schemaVersion`

旧项目缺少作者、题材或简介时按空字符串兼容。

```sql
CREATE TABLE project_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 章节

```ts
type ChapterStatus = 'draft' | 'revising' | 'locked'

interface Chapter {
  id: string
  title: string
  order: number
  status: ChapterStatus
  wordCount: number
  povEntityId?: string
  summary: string
  markdownPath: string
  contentFormat: 'prosemirror-json-v1'
  content: ProseMirrorDoc
  updatedAt: string
  version: number
}
```

```sql
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  chapter_order INTEGER NOT NULL,
  status TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  pov_entity_id TEXT,
  summary TEXT NOT NULL DEFAULT '',
  markdown_path TEXT NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'prosemirror-json-v1',
  content_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);
```

### 当前项目返回对象

当前 TypeScript `NovelProject` 为未来扩展保留了一些数组和设置字段，但 SQLite 实际只持久化项目元数据与章节。未落库字段在打开项目时返回空数组或默认值，不能被描述为已经持久化。

## schema v1 中遗留但未启用的表

`chapters_fts` 已存在于 schema v1，但当前保存流程不写入，也没有搜索功能：

```sql
CREATE VIRTUAL TABLE chapters_fts USING fts5(
  title,
  summary,
  plain_text,
  content='',
  tokenize='unicode61'
);
```

它不是当前必需能力。实现全文搜索前，需要重新设计稳定的章节 ID 映射和可重建索引，并通过新的 schema 迁移处理现有项目。

## 当前持久化规则

- 章节正文以 `content_json` 中的 ProseMirror JSON 为权威内容。
- 日期保存为 ISO 字符串。
- `chapter_order` 保持稳定且可排序。
- Markdown 镜像不能作为事实来源，除非未来显式实现导入或恢复流程。
- SQLite 使用 `PRAGMA user_version` 管理顺序迁移；当前版本为 1。
- 高于当前支持版本的数据库会被拒绝打开。
- 项目相对路径在访问前必须确认实际目标仍位于项目目录内。

## 未来领域草案

以下对象已在 TypeScript 中有部分占位类型，或已在产品路线中规划，但当前没有对应 SQLite 表和完整业务流程：

- `Entity`：人物、地点、组织和物品。
- `StoryEvent`：故事时间、叙事顺序和关联章节。
- `Foreshadow`：伏笔状态、埋设和回收关系。
- `MemoryRecord`：全局或项目记忆。
- `MemoryPatch`：带证据和差异的 AI 建议。
- `StoryGraphNode` / `StoryGraphEdge`：故事图谱。
- `AiProviderConfig`：AI Provider 配置。
- `ProjectSettings`：项目级上下文、记忆和导出选项。

这些类型只是未来领域草案。实际实现某一领域时，需要重新确认字段、关系、状态和迁移方案，并同步更新本文档；不要求当前代码提前满足全部草案。

Auto Dream 的触发方式尚未决定。现有 `AutoDreamTrigger` 类型中的枚举值只是早期占位，不代表产品已经确认手动、保存后或定时策略。

## 数据访问研判

当前继续使用 `better-sqlite3 + 显式 SQL`：

- 当前只有项目元数据、章节和一个未启用的 FTS 表，查询数量有限。
- 现有 `PRAGMA user_version` 迁移已经清晰、可测试，并与 Electron 原生模块运行方式稳定配合。
- 此时增加 Drizzle 会引入另一套 schema 表达和依赖管理，但暂时没有足够复杂的关系查询来抵消成本。

当人物、事件、伏笔、记忆和图谱开始真实落库，出现大量关联查询、重复行映射或迁移维护成本时，再评估 Drizzle 或其它类型化查询层。该选择属于技术决策，不作为长期协作规则。
