<script setup lang="ts">
import LibraryWorkspace from '../workspaces/LibraryWorkspace.vue'
</script>

<template>
  <main class="app-shell">
    <aside class="app-rail">
      <nav
        class="rail-nav"
        aria-label="一级导航"
      >
        <button
          type="button"
          class="rail-item active"
        >
          书架
        </button>
        <button
          type="button"
          class="rail-item"
          disabled
        >
          归档
        </button>
        <button
          type="button"
          class="rail-item"
          disabled
        >
          设置
        </button>
      </nav>
    </aside>

    <LibraryWorkspace />
  </main>
</template>
