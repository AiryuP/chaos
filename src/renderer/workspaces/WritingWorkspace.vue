<script setup lang="ts">
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Redo2,
  Save,
  Underline as UnderlineIcon,
  Undo2
} from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'

import type { ProseMirrorDoc } from '@shared/domain'

import { useAppStore } from '../stores/app'

const appStore = useAppStore()

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Underline
  ],
  content: appStore.activeDraft ?? appStore.activeChapter?.content ?? '<p></p>',
  editorProps: {
    attributes: {
      class: 'writing-editor',
      spellcheck: 'true'
    }
  },
  onUpdate: ({ editor: currentEditor }) => {
    appStore.updateActiveChapterDraft(currentEditor.getJSON() as ProseMirrorDoc)
  }
})

const wordCount = computed(() => {
  const text = editor.value?.getText().trim() ?? ''
  return text.length === 0 ? 0 : text.length
})

const canSave = computed(() =>
  Boolean(
    editor.value &&
      appStore.activeChapter &&
      appStore.hasUnsavedChanges &&
      !appStore.isSavingChapter
  )
)

watch(
  () => appStore.activeChapter?.id,
  () => {
    const chapter = appStore.activeChapter

    if (chapter && editor.value) {
      editor.value.commands.setContent(appStore.activeDraft ?? chapter.content, false)
    }
  }
)

function runCommand(command: 'bold' | 'italic' | 'underline'): void {
  const chain = editor.value?.chain().focus()

  if (!chain) {
    return
  }

  if (command === 'bold') {
    chain.toggleBold().run()
    return
  }

  if (command === 'italic') {
    chain.toggleItalic().run()
    return
  }

  chain.toggleUnderline().run()
}

function runHistoryCommand(command: 'undo' | 'redo'): void {
  const chain = editor.value?.chain().focus()

  if (!chain) {
    return
  }

  if (command === 'undo') {
    chain.undo().run()
    return
  }

  chain.redo().run()
}

function handleKeydown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
    return
  }

  event.preventDefault()

  if (canSave.value) {
    void appStore.saveActiveChapter()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  editor.value?.destroy()
})
</script>

<template>
  <section class="writing-shell">
    <aside class="binder-pane">
      <header class="pane-header">
        <h2>手稿</h2>
      </header>

      <div class="volume-row">正文</div>

      <button
        v-for="chapter in appStore.activeProject?.chapters ?? []"
        :key="chapter.id"
        type="button"
        class="chapter-row"
        :class="{ active: chapter.id === appStore.activeChapter?.id }"
        :aria-current="chapter.id === appStore.activeChapter?.id ? 'page' : undefined"
      >
        <span>{{ String(chapter.order).padStart(3, '0') }}</span>
        <strong>{{ chapter.title }}</strong>
      </button>
    </aside>

    <section class="editor-pane">
      <header class="editor-header">
        <div>
          <h1>{{ appStore.activeChapter?.title ?? '未命名章节' }}</h1>
          <p>{{ wordCount }} 字</p>
        </div>

        <div class="editor-tools">
          <span
            class="save-status"
            :class="`is-${appStore.saveStatusTone}`"
            :title="appStore.saveNotice?.message"
          >
            <span class="status-dot" />
            {{ appStore.saveStatusLabel }}
          </span>
          <button
            type="button"
            class="save-button"
            :disabled="!canSave"
            title="保存章节 (Ctrl+S)"
            @click="appStore.saveActiveChapter"
          >
            <Save :size="15" />
            <span>保存</span>
          </button>
          <span class="tool-divider" />
          <button
            type="button"
            class="icon-button"
            :disabled="!editor"
            title="撤销"
            aria-label="撤销"
            @click="runHistoryCommand('undo')"
          >
            <Undo2 :size="16" />
          </button>
          <button
            type="button"
            class="icon-button"
            :disabled="!editor"
            title="重做"
            aria-label="重做"
            @click="runHistoryCommand('redo')"
          >
            <Redo2 :size="16" />
          </button>
          <button
            type="button"
            class="icon-button"
            :class="{ active: editor?.isActive('bold') }"
            :disabled="!editor"
            title="粗体"
            aria-label="粗体"
            @click="runCommand('bold')"
          >
            <BoldIcon :size="16" />
          </button>
          <button
            type="button"
            class="icon-button"
            :class="{ active: editor?.isActive('italic') }"
            :disabled="!editor"
            title="斜体"
            aria-label="斜体"
            @click="runCommand('italic')"
          >
            <ItalicIcon :size="16" />
          </button>
          <button
            type="button"
            class="icon-button"
            :class="{ active: editor?.isActive('underline') }"
            :disabled="!editor"
            title="下划线"
            aria-label="下划线"
            @click="runCommand('underline')"
          >
            <UnderlineIcon :size="16" />
          </button>
        </div>
      </header>

      <EditorContent
        class="editor-surface"
        :editor="editor"
      />
    </section>
  </section>
</template>
