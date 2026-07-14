# Chaos 编辑器模型

Chaos 使用 Tiptap / ProseMirror 编辑章节。

## 当前正文契约

章节正文以 ProseMirror JSON 为权威内容：

```ts
interface ProseMirrorDoc {
  type: 'doc'
  content?: ProseMirrorNode[]
}
```

保存格式标识为：

```text
prosemirror-json-v1
```

Markdown 是可读镜像和导出格式，不是事实来源。

## 选择 ProseMirror JSON 的原因

Chaos 长期需要富文本、人物高亮、结构锚点、批注、AI 证据位置以及图谱与正文的双向引用。纯 Markdown 适合可读性和迁移，但难以独立承载这些结构化行内语义。

## 当前已经实现

- 段落编辑。
- 粗体、斜体和下划线。
- 占位文本。
- 字数计算。
- 将 JSON 保存到 SQLite。
- 将 JSON 转换为纯文本和 Markdown。
- 从 SQLite 加载 JSON 回编辑器。
- 跟踪当前章节是否不同于最近一次成功保存。
- 返回书架或关闭应用时保护未保存内容。

## 尚未实现

- Markdown、TXT 或 DOCX 导入。
- AI 行内建议。
- 批注和修订追踪。
- 人物高亮。
- 复杂 Markdown 往返保真。
- 协作编辑。
- 自定义结构节点。

## 转换规则

### JSON 转纯文本

- 文本节点追加其 `text`。
- 段落和标题节点形成文本块。
- 未识别节点尽可能递归渲染子节点。

### JSON 转 Markdown

- 标题节点按一级到六级标题输出。
- 段落输出为文本块。
- 粗体、斜体和代码标记转换为对应 Markdown 语法。
- 未识别标记不能破坏原始文本。

Markdown 转 JSON 尚未形成产品能力。未来实现导入时，应根据实际支持范围重新定义解析和往返规则。

## 未来扩展草案

未来行内标记可以考虑使用明确属性：

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

未来自定义节点可能包括 `sceneBreak`、`chapterHeading` 和 `noteBlock`。这些只是设计草案，在真实需求出现前不预先实现。

AI 建议未来需要保留足以让作者核实的证据。`MemoryPatch` 可以先保存可读证据文本，后续再按需求增加结构化文档范围。
