# Chaos Product Notes

## 产品定位

Chaos 是一款本地优先的长篇小说桌面编辑器，面向需要长期维护章节、大纲、人物、故事线、伏笔、世界观和写作进度的作者。

它要解决的问题：

- 长篇章节越写越多后，结构难以把控。
- 人物状态、关系、伏笔、事件时间线容易遗忘。
- 普通 AI 助手缺乏持久项目记忆，容易给出不连续建议。
- 传统写作软件和知识库之间断裂，正文、设定、图谱、AI 建议不在同一套数据中。

## Interface Direction

Chaos should feel closer to a professional writing desk than an AI dashboard.

References:

- Scrivener: project binder, outliner, manuscript-first workflow.
- Ulysses: quiet three-column writing rhythm and readable editor surface.
- Obsidian Canvas / Scapple: visual thinking space for relationships and story structure.

## Ulysses-Inspired Interface Rules

Chaos borrows Ulysses' writing calm, not its full document model. Ulysses is useful as a UI reference in four ways:

- Visual tone: quiet, modern, low-noise, with text and structure taking priority over decoration.
- Writing layout: organization column + chapter/binder column + editor, with the editor as the visual center.
- Interaction principle: keep persistent panels few; show inspectors, metadata, and auxiliary tools only when needed.
- Control discipline: prefer lists, rows, separators, and compact toolbars over large cards, large radii, and decorative surfaces.

Chaos should not copy Ulysses' library/group/sheet information model directly. Long-form novels need stronger project structure: volumes, chapters, outlines, storylines, memories, exports, and later AI review queues.

Avoid:

- Gradient-heavy landing-page layouts.
- Oversized AI assistant panels.
- Decorative cards that reduce writing density.
- Forcing outline, timeline, memory, and prose into the same cramped screen.

## Workspace Model

Chaos has two shell levels:

- App shell: library, archive, and global settings. This layer manages books, not book content.
- Project shell: the workspace inside one opened book. This layer manages writing, structure, story data, export, and project settings.

The app shell should stay closer to a local project manager. The project shell should stay closer to a professional writing desk.

Inside a project, Chaos has first-class workspaces:

- Writing: manuscript focus with a light inspector.
- Outline: full-screen chapter and volume structure.
- Storyline: full-screen timeline, graph canvas, and foreshadowing ledger.
- Memory: patch review queue and double-domain memory map.
- Export: TXT / Markdown export in v0.1, with DOCX / EPUB reserved for later.
- Settings: provider, context, memory write policy, and export choices.

Outline and storyline are not side widgets. They can occupy the full UI because authors often need to restructure the book without the editor stealing horizontal space.

## Local-First Storage

Chaos 默认在应用私有数据目录中管理作品库，用户新建作品时只填写作品信息，不接触文件系统路径。全局设置允许用户把以后创建的作品改存到自定义目录，但不会静默移动已有作品。

书架必须扫描当前托管作品库，并保留完整的已知作品索引；私有存储不能让较早作品因为“最近项目”数量限制而从 UI 中消失。

每部作品仍是可独立打开和迁移的自包含文件夹：

```text
<application-user-data>/projects/
  <project-id>/
    .moqi/
      project.sqlite
    chapters/
      001.md
    exports/
      Novel Project.txt
      Novel Project.md
```

SQLite is the source of truth for structured story data. Markdown mirrors keep chapters readable and portable.

## 永久优先级

1. 稳定写作。
2. 本地保存。
3. 结构清晰。
4. AI 辅助。
5. 自动化。
