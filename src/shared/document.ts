import type { ProseMirrorDoc, ProseMirrorMark, ProseMirrorNode } from './domain'

export const EMPTY_DOCUMENT: ProseMirrorDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph'
    }
  ]
}

export function createEmptyDocument(): ProseMirrorDoc {
  return structuredClone(EMPTY_DOCUMENT)
}

export function prosemirrorToPlainText(doc: ProseMirrorDoc): string {
  return renderPlainChildren(doc.content).replace(/\n{3,}/g, '\n\n').trimEnd()
}

export function prosemirrorToMarkdown(doc: ProseMirrorDoc): string {
  return renderMarkdownChildren(doc.content).replace(/\n{3,}/g, '\n\n').trimEnd()
}

function renderPlainChildren(content: ProseMirrorNode[] | undefined): string {
  return content?.map(renderPlainNode).join('') ?? ''
}

function renderPlainNode(node: ProseMirrorNode): string {
  if (node.type === 'text') {
    return node.text ?? ''
  }

  if (node.type === 'hardBreak') {
    return '\n'
  }

  const children = renderPlainChildren(node.content)

  if (node.type === 'paragraph' || node.type === 'heading') {
    return `${children}\n\n`
  }

  if (node.type === 'listItem') {
    return `${children.trimEnd()}\n`
  }

  return children
}

function renderMarkdownChildren(content: ProseMirrorNode[] | undefined): string {
  return content?.map(renderMarkdownNode).join('') ?? ''
}

function renderMarkdownNode(node: ProseMirrorNode): string {
  if (node.type === 'text') {
    return applyMarkdownMarks(node.text ?? '', node.marks)
  }

  if (node.type === 'hardBreak') {
    return '  \n'
  }

  const children = renderMarkdownChildren(node.content)

  if (node.type === 'heading') {
    const level = clampHeadingLevel(node.attrs?.level)
    return `${'#'.repeat(level)} ${children.trim()}\n\n`
  }

  if (node.type === 'paragraph') {
    return `${children.trim()}\n\n`
  }

  if (node.type === 'bulletList') {
    return `${renderBulletList(node.content)}\n`
  }

  if (node.type === 'orderedList') {
    return `${renderOrderedList(node.content)}\n`
  }

  if (node.type === 'blockquote') {
    return `${children
      .trim()
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')}\n\n`
  }

  return children
}

function renderBulletList(content: ProseMirrorNode[] | undefined): string {
  return (
    content
      ?.filter((node) => node.type === 'listItem')
      .map((node) => `- ${renderMarkdownChildren(node.content).trim().replace(/\n/g, '\n  ')}`)
      .join('\n') ?? ''
  )
}

function renderOrderedList(content: ProseMirrorNode[] | undefined): string {
  return (
    content
      ?.filter((node) => node.type === 'listItem')
      .map((node, index) => `${index + 1}. ${renderMarkdownChildren(node.content).trim().replace(/\n/g, '\n   ')}`)
      .join('\n') ?? ''
  )
}

function applyMarkdownMarks(text: string, marks: ProseMirrorMark[] | undefined): string {
  return (
    marks?.reduce((current, mark) => {
      if (mark.type === 'bold') {
        return `**${current}**`
      }

      if (mark.type === 'italic') {
        return `*${current}*`
      }

      if (mark.type === 'code') {
        return `\`${current.replace(/`/g, '\\`')}\``
      }

      if (mark.type === 'underline') {
        return `<u>${current}</u>`
      }

      return current
    }, text) ?? text
  )
}

function clampHeadingLevel(level: unknown): number {
  if (typeof level !== 'number' || !Number.isInteger(level)) {
    return 1
  }

  return Math.min(Math.max(level, 1), 6)
}
