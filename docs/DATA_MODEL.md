# Data Model

本文档定义 Chaos 的核心领域模型和 SQLite 数据契约。代码实现时，TypeScript domain type、Drizzle schema、读写映射和测试必须保持一致。

## Project Folder

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

SQLite 是事实来源。Markdown 是可读镜像。

## Core Types

### NovelProject

```ts
interface NovelProject {
  id: string
  name: string
  path?: string
  updatedAt: string
  activeChapterId: string
  chapters: Chapter[]
  entities: Entity[]
  events: StoryEvent[]
  foreshadows: Foreshadow[]
  memories: MemoryRecord[]
  memoryPatches: MemoryPatch[]
  graphNodes: StoryGraphNode[]
  graphEdges: StoryGraphEdge[]
  aiProviders: AiProviderConfig[]
  settings: ProjectSettings
}
```

### Chapter

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

### Entity

```ts
type EntityKind = 'character' | 'place' | 'organization' | 'item'

interface Entity {
  id: string
  kind: EntityKind
  name: string
  aliases: string[]
  card: string
  currentState: string
  firstChapterId?: string
  lastSeenChapterId?: string
  color: string
}
```

### StoryEvent

```ts
interface StoryEvent {
  id: string
  title: string
  storyTime: string
  narrativeOrder: number
  chapterId: string
  entityIds: string[]
  summary: string
}
```

### Foreshadow

```ts
type ForeshadowStatus = 'open' | 'developing' | 'ready_to_payoff' | 'closed' | 'abandoned'

interface Foreshadow {
  id: string
  title: string
  status: ForeshadowStatus
  plantedChapterId: string
  payoffChapterId?: string
  relatedEntityIds: string[]
  evidence: string
  note: string
}
```

### MemoryRecord

```ts
type MemoryDomain = 'global' | 'project'
type MemoryLayer = 'evidence' | 'structured' | 'canon'

interface MemoryRecord {
  id: string
  domain: MemoryDomain
  layer: MemoryLayer
  title: string
  content: string
  sourceChapterIds: string[]
  updatedAt: string
}
```

### MemoryPatch

```ts
type MemoryPatchStatus = 'pending' | 'accepted' | 'rejected'

type MemoryPatchTarget = 'entity' | 'foreshadow' | 'event' | 'summary' | 'preference'

interface MemoryPatch {
  id: string
  targetType: MemoryPatchTarget
  targetId?: string
  status: MemoryPatchStatus
  title: string
  before: string
  after: string
  evidence: string
  confidence: number
  createdAt: string
}
```

### Graph

```ts
interface StoryGraphNode {
  id: string
  type: 'chapter' | 'entity' | 'event' | 'foreshadow' | 'aiTask'
  label: string
  refId?: string
  x: number
  y: number
  width?: number
  height?: number
  metadata?: Record<string, string>
}

interface StoryGraphEdge {
  id: string
  source: string
  target: string
  label: string
  relation: 'appears' | 'causes' | 'plants' | 'resolves' | 'feeds'
}
```

### Settings

```ts
type AiProviderKind = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible'
type ContextScope = 'minimal' | 'chapter' | 'project-summary'
type MemoryWritePolicy = 'review-first' | 'low-risk-auto' | 'fully-auto'
type AutoDreamTrigger = 'manual' | 'after-save' | 'scheduled'
type ExportFormat = 'txt' | 'markdown' | 'docx' | 'epub'

interface AiProviderConfig {
  id: string
  kind: AiProviderKind
  name: string
  model: string
  baseUrl?: string
  enabled: boolean
}

interface ProjectSettings {
  contextScope: ContextScope
  memoryWritePolicy: MemoryWritePolicy
  autoDreamTrigger: AutoDreamTrigger
  autoExportFormats: ExportFormat[]
}
```

## SQLite Schema Draft

Tables required for v0.1 and near-future milestones:

- `project_meta`
- `chapters`
- `entities`
- `story_events`
- `foreshadows`
- `memories`
- `memory_patches`
- `graph_nodes`
- `graph_edges`
- `ai_providers`
- `chapters_fts`

## v0.1 Required Tables

### project_meta

```sql
CREATE TABLE project_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### chapters

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

### chapters_fts

```sql
CREATE VIRTUAL TABLE chapters_fts USING fts5(
  title,
  summary,
  plain_text,
  content='',
  tokenize='unicode61'
);
```

## Rules

- Store arrays as JSON text where relational querying is not required yet.
- Preserve explicit status enums in TypeScript.
- Keep `chapter_order` stable and sortable.
- Store dates as ISO strings.
- Store ProseMirror JSON as JSON text in `content_json`.
- Do not treat Markdown mirror files as source of truth unless implementing explicit import/recovery flow.
