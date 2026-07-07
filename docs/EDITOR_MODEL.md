# Editor Model

Chaos uses Tiptap / ProseMirror for chapter writing.

## Decision

章节正文以 ProseMirror JSON 为权威内容：

```ts
interface ProseMirrorDoc {
  type: 'doc'
  content?: Array<Record<string, unknown>>
}
```

The saved format is identified as:

```text
prosemirror-json-v1
```

Markdown is a readable mirror and export format, not the source of truth.

## Why Not Plain Markdown

Chaos needs more than plain prose:

- Rich text.
- Character highlights.
- Foreshadow anchors.
- Structure anchors.
- Comments and review ranges.
- AI evidence locations.
- Future graph-to-prose bidirectional references.

Plain Markdown is excellent for portability, but fragile as the only storage format for structured inline semantics.

## v0.1 Editor Scope

Required:

- Paragraph writing.
- Basic bold / italic / underline if cheap to include.
- Placeholder text.
- Word count.
- Save JSON to SQLite.
- Convert JSON to plain text.
- Convert JSON to Markdown mirror.
- Load JSON back into editor.

Out of scope:

- AI inline suggestions.
- Comments.
- Character highlighter.
- Track changes.
- Complex Markdown round-trip fidelity.
- Collaborative editing.

## Future Extension Marks

Future marks should prefer explicit attrs:

```ts
characterRef: {
  entityId: string
  label?: string
}

foreshadowRef: {
  foreshadowId: string
}

aiEvidence: {
  patchId: string
  confidence?: number
}

commentRef: {
  commentId: string
}
```

## Future Extension Nodes

Potential custom nodes:

```ts
sceneBreak
chapterHeading
noteBlock
```

Do not add custom nodes in v0.1 unless required for the local writing loop.

## Conversion Rules

### JSON to Plain Text

- Text nodes append their `text`.
- Paragraph and heading nodes end with blank line.
- Unknown nodes recursively render children when possible.

### JSON to Markdown

- Heading nodes render as `#` through `######`.
- Paragraphs render as text blocks.
- Bold, italic, code marks render to Markdown syntax.
- Unknown marks should not destroy text.

### Markdown to JSON

For v0.1, Markdown import/source mode can be minimal:

- Blank-line separated blocks become paragraphs.
- Leading `#` blocks become headings.
- Rich mark round-trip can be improved later.

## AI Evidence Rule

AI features must preserve enough evidence to let authors verify suggestions. A MemoryPatch should store readable evidence text and later may store structured document ranges.

v0.1 does not need structured ranges, but the editor model must not block them.
