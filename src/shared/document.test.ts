import { describe, expect, it } from 'vitest'

import type { ProseMirrorDoc } from './domain'
import { createEmptyDocument, prosemirrorToMarkdown, prosemirrorToPlainText } from './document'

describe('document conversion', () => {
  it('creates an empty ProseMirror document', () => {
    expect(createEmptyDocument()).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph'
        }
      ]
    })
  })

  it('renders plain text from basic prose nodes', () => {
    const doc: ProseMirrorDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '第一章' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '雨声' },
            { type: 'text', text: '落在旧屋檐上。' }
          ]
        }
      ]
    }

    expect(prosemirrorToPlainText(doc)).toBe('第一章\n\n雨声落在旧屋檐上。')
  })

  it('renders markdown mirrors without losing common marks', () => {
    const doc: ProseMirrorDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '第一章' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '她' },
            { type: 'text', text: '必须', marks: [{ type: 'bold' }] },
            { type: 'text', text: '保持安静。', marks: [{ type: 'italic' }] }
          ]
        }
      ]
    }

    expect(prosemirrorToMarkdown(doc)).toBe('# 第一章\n\n她**必须***保持安静。*')
  })
})
