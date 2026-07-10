export type ChapterStatus = 'draft' | 'revising' | 'locked'
export type EntityKind = 'character' | 'place' | 'organization' | 'item'
export type ForeshadowStatus =
  | 'open'
  | 'developing'
  | 'ready_to_payoff'
  | 'closed'
  | 'abandoned'
export type MemoryDomain = 'global' | 'project'
export type MemoryLayer = 'evidence' | 'structured' | 'canon'
export type MemoryPatchStatus = 'pending' | 'accepted' | 'rejected'
export type MemoryPatchTarget = 'entity' | 'foreshadow' | 'event' | 'summary' | 'preference'
export type AiProviderKind = 'openai' | 'anthropic' | 'gemini' | 'openai-compatible'
export type ContextScope = 'minimal' | 'chapter' | 'project-summary'
export type MemoryWritePolicy = 'review-first' | 'low-risk-auto' | 'fully-auto'
export type AutoDreamTrigger = 'manual' | 'after-save' | 'scheduled'
export type ExportFormat = 'txt' | 'markdown' | 'docx' | 'epub'

export interface ProseMirrorMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface ProseMirrorNode {
  type: string
  attrs?: Record<string, unknown>
  content?: ProseMirrorNode[]
  text?: string
  marks?: ProseMirrorMark[]
}

export interface ProseMirrorDoc {
  type: 'doc'
  content?: ProseMirrorNode[]
}

export interface Chapter {
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

export interface Entity {
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

export interface StoryEvent {
  id: string
  title: string
  storyTime: string
  narrativeOrder: number
  chapterId: string
  entityIds: string[]
  summary: string
}

export interface Foreshadow {
  id: string
  title: string
  status: ForeshadowStatus
  plantedChapterId: string
  payoffChapterId?: string
  relatedEntityIds: string[]
  evidence: string
  note: string
}

export interface MemoryRecord {
  id: string
  domain: MemoryDomain
  layer: MemoryLayer
  title: string
  content: string
  sourceChapterIds: string[]
  updatedAt: string
}

export interface MemoryPatch {
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

export interface StoryGraphNode {
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

export interface StoryGraphEdge {
  id: string
  source: string
  target: string
  label: string
  relation: 'appears' | 'causes' | 'plants' | 'resolves' | 'feeds'
}

export interface AiProviderConfig {
  id: string
  kind: AiProviderKind
  name: string
  model: string
  baseUrl?: string
  enabled: boolean
}

export interface ProjectSettings {
  contextScope: ContextScope
  memoryWritePolicy: MemoryWritePolicy
  autoDreamTrigger: AutoDreamTrigger
  autoExportFormats: ExportFormat[]
}

export interface ProjectDetails {
  name: string
  author: string
  genre: string
  description: string
}

export interface ProjectSummary {
  name: string
  author: string
  genre: string
  path: string
  updatedAt: string
}

export interface NovelProject {
  id: string
  name: string
  author: string
  genre: string
  description: string
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
