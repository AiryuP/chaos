<template>
  <main class="library-shell">
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

    <section class="library-main">
      <header class="module-header">
        <div>
          <h1>书架</h1>
          <p>管理本地小说项目，打开作品后进入书内工作台。</p>
        </div>

        <div class="module-actions">
          <button
            type="button"
            class="button secondary"
            disabled
          >
            打开本地项目
          </button>
          <button
            type="button"
            class="button primary"
            disabled
          >
            新建作品
          </button>
        </div>
      </header>

      <section class="library-section">
        <div class="section-heading">
          <h2>最近打开</h2>
        </div>

        <div class="recent-empty">
          暂无最近作品
        </div>
      </section>

      <section class="library-section">
        <div class="section-heading">
          <h2>全部作品</h2>
        </div>

        <div class="project-table">
          <div class="project-row table-head">
            <span>作品名</span>
            <span>最近章节</span>
            <span>字数</span>
            <span>更新时间</span>
            <span>路径</span>
          </div>

          <div class="project-empty-row">
            还没有本地作品
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
