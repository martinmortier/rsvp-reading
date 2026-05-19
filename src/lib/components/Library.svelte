<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { listBooks, deleteBook, isEnabled } from '../sync-client.js';

  const dispatch = createEventDispatcher();

  let books = [];
  let loading = true;
  let error = null;

  async function refresh() {
    loading = true;
    error = null;
    try {
      books = await listBooks();
    } catch (e) {
      error = e.message || String(e);
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this book from the backend?')) return;
    try {
      await deleteBook(id);
      books = books.filter(b => b.id !== id);
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  }

  function handleOpen(book) {
    dispatch('open', { book });
  }

  function handleClose() {
    dispatch('close');
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString();
  }

  function fmtSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onMount(() => {
    if (isEnabled()) refresh();
    else {
      loading = false;
      error = 'Cloud sync is disabled. Enable it in Cloud Sync settings.';
    }
  });
</script>

<div class="library">
  <div class="header">
    <h3>Library</h3>
    <div class="header-actions">
      <button class="secondary small" on:click={refresh} disabled={loading}>↻ Refresh</button>
      <button class="close" on:click={handleClose} aria-label="Close">×</button>
    </div>
  </div>

  {#if loading}
    <p class="state">Loading…</p>
  {:else if error}
    <p class="state error">{error}</p>
  {:else if books.length === 0}
    <p class="state">No books uploaded yet. Drop an EPUB or PDF to add one.</p>
  {:else}
    <ul class="book-list">
      {#each books as book (book.id)}
        <li class="book">
          <button class="book-open" on:click={() => handleOpen(book)}>
            <div class="book-main">
              <div class="title">{book.title}</div>
              <div class="meta">
                <span>{fmtSize(book.size)}</span>
                {#if book.last_read_at}
                  <span>· Last read {fmtDate(book.last_read_at)}</span>
                {/if}
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: {Math.round((book.progress || 0) * 100)}%"></div>
              </div>
              <div class="progress-label">
                {Math.round((book.progress || 0) * 100)}%
                {#if book.position_total}
                  · word {book.position_word || 0} / {book.position_total}
                {/if}
              </div>
            </div>
          </button>
          <button class="delete" title="Delete" on:click={() => handleDelete(book.id)}>×</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .library {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 520px;
    width: 100%;
    color: #fff;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  h3 { margin: 0; font-size: 1.1rem; }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .close {
    background: transparent;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0 0.25rem;
  }
  .close:hover { color: #fff; }

  .secondary {
    background: #333;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.4rem 0.7rem;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .secondary:hover { background: #444; }
  .secondary:disabled { opacity: 0.5; cursor: not-allowed; }
  .secondary.small { padding: 0.3rem 0.6rem; font-size: 0.8rem; }

  .state {
    color: #888;
    font-size: 0.9rem;
    margin: 1rem 0;
    text-align: center;
  }

  .state.error { color: #ff8a8a; }

  .book-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .book {
    display: flex;
    align-items: stretch;
    background: #111;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    overflow: hidden;
  }

  .book-open {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    text-align: left;
    padding: 0.75rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .book-open:hover { background: #1a1a1a; }

  .book-main { display: flex; flex-direction: column; gap: 0.3rem; }

  .title {
    font-weight: 500;
    font-size: 0.95rem;
  }

  .meta {
    color: #888;
    font-size: 0.75rem;
    display: flex;
    gap: 0.5rem;
  }

  .progress-bar {
    height: 4px;
    background: #2a2a2a;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.3rem;
  }

  .progress-fill {
    height: 100%;
    background: #ff4444;
    transition: width 0.3s ease;
  }

  .progress-label {
    color: #aaa;
    font-size: 0.75rem;
  }

  .delete {
    background: transparent;
    border: none;
    border-left: 1px solid #2a2a2a;
    color: #555;
    font-size: 1.5rem;
    width: 2.5rem;
    cursor: pointer;
    transition: color 0.15s;
  }

  .delete:hover { color: #ff4444; }
</style>
