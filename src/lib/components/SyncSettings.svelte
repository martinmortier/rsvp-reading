<script>
  import { createEventDispatcher } from 'svelte';
  import { loadConfig, saveConfig, ping } from '../sync-client.js';

  const dispatch = createEventDispatcher();

  let cfg = loadConfig();
  let testing = false;
  let testResult = null;

  async function handleTest() {
    testing = true;
    testResult = null;
    // Apply current edits before testing
    saveConfig(cfg);
    try {
      const r = await ping();
      testResult = { ok: true, msg: `OK · uptime ${Math.round(r.uptime || 0)}s` };
    } catch (e) {
      testResult = { ok: false, msg: e.message || String(e) };
    } finally {
      testing = false;
    }
  }

  function handleSave() {
    cfg = saveConfig(cfg);
    dispatch('saved', cfg);
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div class="sync-settings">
  <div class="header">
    <h3>Cloud Sync</h3>
    <button class="close" on:click={handleClose} aria-label="Close">×</button>
  </div>

  <p class="hint">
    Sync your library and reading positions across devices via your self-hosted Speeedy backend.
  </p>

  <label class="toggle-row">
    <input type="checkbox" bind:checked={cfg.enabled} />
    <span>Enable cloud sync</span>
  </label>

  <label class="field">
    <span>Backend URL</span>
    <input
      type="url"
      placeholder="http://example.sslip.io"
      bind:value={cfg.url}
      autocomplete="off"
      spellcheck="false"
    />
  </label>

  <label class="field">
    <span>Auth token</span>
    <input
      type="password"
      placeholder="Bearer token from your backend"
      bind:value={cfg.token}
      autocomplete="off"
      spellcheck="false"
    />
  </label>

  <div class="actions">
    <button class="secondary" on:click={handleTest} disabled={testing || !cfg.url}>
      {testing ? 'Testing…' : 'Test connection'}
    </button>
    <button class="primary" on:click={handleSave}>Save</button>
  </div>

  {#if testResult}
    <div class="result" class:ok={testResult.ok} class:err={!testResult.ok}>
      {testResult.ok ? '✓' : '✗'} {testResult.msg}
    </div>
  {/if}
</div>

<style>
  .sync-settings {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 420px;
    width: 100%;
    color: #fff;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
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

  .hint {
    color: #888;
    font-size: 0.85rem;
    margin: 0 0 1rem 0;
  }

  .toggle-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    cursor: pointer;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1rem;
  }

  .field span {
    font-size: 0.85rem;
    color: #aaa;
  }

  .field input {
    background: #111;
    border: 1px solid #333;
    border-radius: 6px;
    color: #fff;
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
    font-family: monospace;
  }

  .field input:focus {
    outline: none;
    border-color: #ff4444;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  button {
    border-radius: 6px;
    border: none;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  button.primary {
    background: #ff4444;
    color: #fff;
  }

  button.primary:hover { background: #ff6666; }

  button.secondary {
    background: #333;
    color: #fff;
  }

  button.secondary:hover { background: #444; }

  button:disabled { opacity: 0.5; cursor: not-allowed; }

  .result {
    margin-top: 1rem;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-family: monospace;
  }

  .result.ok {
    background: rgba(0, 200, 100, 0.15);
    color: #5fdc91;
    border: 1px solid rgba(0, 200, 100, 0.3);
  }

  .result.err {
    background: rgba(255, 68, 68, 0.15);
    color: #ff8a8a;
    border: 1px solid rgba(255, 68, 68, 0.3);
  }
</style>
