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

Avoid:

- Gradient-heavy landing-page layouts.
- Oversized AI assistant panels.
- Decorative cards that reduce writing density.
- Forcing outline, timeline, memory, and prose into the same cramped screen.

## Workspace Model

The app has five first-class workspaces:

- Writing: manuscript focus with a light inspector.
- Outline: full-screen chapter and volume structure.
- Storyline: full-screen timeline, graph canvas, and foreshadowing ledger.
- Memory: patch review queue and double-domain memory map.
- Settings: provider, context, memory write policy, and export choices.

Outline and storyline are not side widgets. They can occupy the full UI because authors often need to restructure the book without the editor stealing horizontal space.

## Local-First Storage

Each project is a folder:

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

SQLite is the source of truth for structured story data. Markdown mirrors keep chapters readable and portable.

## 永久优先级

1. 稳定写作。
2. 本地保存。
3. 结构清晰。
4. AI 辅助。
5. 自动化。
