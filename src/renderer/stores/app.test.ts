import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Chapter, NovelProject, ProseMirrorDoc } from '@shared/domain'
import type {
  ChaosApi,
  IpcResult,
  SaveChapterOutput
} from '@shared/ipc'

import { useAppStore } from './app'

describe('app store chapter saving', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('marks the current draft as saved when it did not change during the request', async () => {
    const initial = createDocument('initial')
    const requested = createDocument('save this')
    const saveChapter = vi.fn<ChaosApi['saveChapter']>()
    const store = createStoreWithProject(
      initial,
      createChaosApi({ saveChapter })
    )
    saveChapter.mockResolvedValue(successfulSave(store.activeChapter!, requested))

    store.updateActiveChapterDraft(requested)

    await expect(store.saveActiveChapter()).resolves.toBe('saved')
    expect(store.activeDraft).toEqual(requested)
    expect(store.activeChapter?.content).toEqual(requested)
    expect(store.hasUnsavedChanges).toBe(false)
  })

  it('preserves edits made while an older draft is being saved', async () => {
    const initial = createDocument('initial')
    const requested = createDocument('save this')
    const newer = createDocument('keep this newer draft')
    const pendingSave = createDeferred<IpcResult<SaveChapterOutput>>()
    const saveChapter = vi.fn(() => pendingSave.promise)
    const store = createStoreWithProject(initial, createChaosApi({ saveChapter }))

    store.updateActiveChapterDraft(requested)
    const saving = store.saveActiveChapter()
    store.updateActiveChapterDraft(newer)
    pendingSave.resolve(successfulSave(store.activeChapter!, requested))

    await expect(saving).resolves.toBe('stale-draft')
    expect(saveChapter).toHaveBeenCalledWith(
      expect.objectContaining({ content: requested })
    )
    expect(store.activeDraft).toEqual(newer)
    expect(store.activeChapter?.content).toEqual(requested)
    expect(store.hasUnsavedChanges).toBe(true)
    expect(store.saveNotice?.message).toContain('修改仍未保存')
  })

  it('does not continue a pending exit when newer edits remain unsaved', async () => {
    const initial = createDocument('initial')
    const requested = createDocument('save this')
    const newer = createDocument('newer exit draft')
    const pendingSave = createDeferred<IpcResult<SaveChapterOutput>>()
    const confirmClose = vi.fn()
    const store = createStoreWithProject(
      initial,
      createChaosApi({ saveChapter: () => pendingSave.promise, confirmClose })
    )

    store.updateActiveChapterDraft(requested)
    store.pendingExitAction = 'close-window'
    const exiting = store.saveAndContinueExit()
    store.updateActiveChapterDraft(newer)
    pendingSave.resolve(successfulSave(store.activeChapter!, requested))
    await exiting

    expect(confirmClose).not.toHaveBeenCalled()
    expect(store.pendingExitAction).toBe('close-window')
    expect(store.activeDraft).toEqual(newer)
    expect(store.hasUnsavedChanges).toBe(true)
  })

  it('does not export when the preceding save only persisted an older draft', async () => {
    const initial = createDocument('initial')
    const requested = createDocument('save this')
    const newer = createDocument('newer export draft')
    const pendingSave = createDeferred<IpcResult<SaveChapterOutput>>()
    const exportProject = vi.fn<ChaosApi['exportProject']>()
    const store = createStoreWithProject(
      initial,
      createChaosApi({ saveChapter: () => pendingSave.promise, exportProject })
    )

    store.updateActiveChapterDraft(requested)
    const exporting = store.exportActiveProject('markdown')
    store.updateActiveChapterDraft(newer)
    pendingSave.resolve(successfulSave(store.activeChapter!, requested))

    await expect(exporting).resolves.toBe(false)
    expect(exportProject).not.toHaveBeenCalled()
    expect(store.activeDraft).toEqual(newer)
    expect(store.hasUnsavedChanges).toBe(true)
  })
})

function createStoreWithProject(content: ProseMirrorDoc, api: ChaosApi) {
  vi.stubGlobal('window', { chaos: api })
  const store = useAppStore()
  store.activeProject = createProject(content)
  store.activeDraft = cloneDocument(content)
  return store
}

function createChaosApi(overrides: Partial<ChaosApi>): ChaosApi {
  return {
    confirmClose: vi.fn(),
    ...overrides
  } as ChaosApi
}

function createProject(content: ProseMirrorDoc): NovelProject {
  const chapter = createChapter(content)

  return {
    id: 'project-1',
    name: 'Test project',
    author: '',
    genre: '',
    description: '',
    path: 'C:\\projects\\test-project',
    updatedAt: chapter.updatedAt,
    activeChapterId: chapter.id,
    chapters: [chapter],
    entities: [],
    events: [],
    foreshadows: [],
    memories: [],
    memoryPatches: [],
    graphNodes: [],
    graphEdges: [],
    aiProviders: [],
    settings: {
      contextScope: 'minimal',
      memoryWritePolicy: 'review-first',
      autoDreamTrigger: 'manual',
      autoExportFormats: []
    }
  }
}

function createChapter(content: ProseMirrorDoc): Chapter {
  return {
    id: 'chapter-1',
    title: 'Chapter one',
    order: 1,
    status: 'draft',
    wordCount: 0,
    summary: '',
    markdownPath: 'chapters/001.md',
    contentFormat: 'prosemirror-json-v1',
    content: cloneDocument(content),
    updatedAt: '2026-07-14T00:00:00.000Z',
    version: 1
  }
}

function successfulSave(
  chapter: Chapter,
  content: ProseMirrorDoc
): IpcResult<SaveChapterOutput> {
  return {
    ok: true,
    data: {
      chapter: {
        ...chapter,
        content: cloneDocument(content),
        updatedAt: '2026-07-14T00:01:00.000Z',
        version: chapter.version + 1
      },
      mirrorSynced: true
    }
  }
}

function createDocument(text: string): ProseMirrorDoc {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
  }
}

function cloneDocument(document: ProseMirrorDoc): ProseMirrorDoc {
  return JSON.parse(JSON.stringify(document)) as ProseMirrorDoc
}

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}
