<script setup lang="ts">
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, watch } from 'vue'

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
  content: appStore.activeChapter?.content ?? '<p></p>',
  editorProps: {
    attributes: {
      class: 'writing-editor',
      spellcheck: 'true'
    }
  }
})

const wordCount = computed(() => {
  const text = editor.value?.getText().trim() ?? ''
  return text.length === 0 ? 0 : text.length
})

watch(
  () => appStore.activeChapter?.id,
  () => {
    const chapter = appStore.activeChapter

    if (chapter && editor.value) {
      editor.value.commands.setContent(chapter.content)
    }
  },
  { immediate: true }
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

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <section class="writing-shell">
    <aside class="binder-pane">
      <header class="pane-header">
        <h2>手稿</h2>
      </header>

      <div class="volume-row">
        正文
      </div>

      <button
        v-for="chapter in appStore.activeProject?.chapters ?? []"
        :key="chapter.id"
        type="button"
        class="chapter-row active"
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
          <button
            type="button"
            :class="{ active: editor?.isActive('bold') }"
            :disabled="!editor"
            title="加粗"
            @click="runCommand('bold')"
          >
            B
          </button>
          <button
            type="button"
            :class="{ active: editor?.isActive('italic') }"
            :disabled="!editor"
            title="斜体"
            @click="runCommand('italic')"
          >
            I
          </button>
          <button
            type="button"
            :class="{ active: editor?.isActive('underline') }"
            :disabled="!editor"
            title="下划线"
            @click="runCommand('underline')"
          >
            U
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
