/**
 * Cloud sync client for Speeedy backend.
 *
 * The backend exposes /api/books with bearer auth. This module wraps the HTTP
 * calls and stores the user's backend config in localStorage so the UI can
 * toggle sync on/off without re-entering credentials.
 */

const CONFIG_KEY = 'rsvp-sync-config';
const CURRENT_BOOK_KEY = 'rsvp-sync-current-book';

/**
 * @typedef {Object} SyncConfig
 * @property {boolean} enabled
 * @property {string} url     - Backend base URL (no trailing slash)
 * @property {string} token   - Bearer token
 */

const DEFAULT_CONFIG = { enabled: false, url: '', token: '' };

export function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(cfg) {
  try {
    const clean = {
      enabled: !!cfg.enabled,
      url: (cfg.url || '').replace(/\/+$/, ''),
      token: cfg.token || ''
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(clean));
    return clean;
  } catch (e) {
    console.error('Failed to save sync config:', e);
    return cfg;
  }
}

export function isEnabled() {
  const cfg = loadConfig();
  return cfg.enabled && !!cfg.url;
}

export function getCurrentBookId() {
  try {
    return localStorage.getItem(CURRENT_BOOK_KEY) || null;
  } catch {
    return null;
  }
}

export function setCurrentBookId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_BOOK_KEY, id);
    else localStorage.removeItem(CURRENT_BOOK_KEY);
  } catch {
    /* ignore */
  }
}

function authHeaders() {
  const cfg = loadConfig();
  if (!cfg.token) return {};
  return { Authorization: `Bearer ${cfg.token}` };
}

function apiUrl(path) {
  const cfg = loadConfig();
  return `${cfg.url}${path}`;
}

export async function ping() {
  const cfg = loadConfig();
  if (!cfg.url) throw new Error('Backend URL is empty');
  const res = await fetch(`${cfg.url}/health`, { method: 'GET' });
  if (!res.ok) throw new Error(`Backend not reachable (HTTP ${res.status})`);
  return res.json();
}

export async function listBooks() {
  const res = await fetch(apiUrl('/api/books'), { headers: authHeaders() });
  if (!res.ok) throw new Error(`listBooks failed (HTTP ${res.status})`);
  const data = await res.json();
  return data.books || [];
}

export async function getBook(id) {
  const res = await fetch(apiUrl(`/api/books/${id}`), { headers: authHeaders() });
  if (!res.ok) throw new Error(`getBook failed (HTTP ${res.status})`);
  return res.json();
}

export async function downloadBookFile(id) {
  const res = await fetch(apiUrl(`/api/books/${id}/file`), { headers: authHeaders() });
  if (!res.ok) throw new Error(`downloadBookFile failed (HTTP ${res.status})`);
  return res.blob();
}

/**
 * Upload a file to the backend.
 * @param {File} file
 * @param {Object} [opts]
 * @param {string} [opts.title]
 * @param {Object} [opts.metadata]
 * @returns {Promise<{id:string, existed:boolean}>}
 */
export async function uploadBook(file, opts = {}) {
  const cfg = loadConfig();
  if (!cfg.url) throw new Error('Backend URL is empty');
  const form = new FormData();
  form.append('file', file);
  if (opts.title) form.append('title', opts.title);
  if (opts.metadata) form.append('metadata', JSON.stringify(opts.metadata));

  const headers = cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {};
  const res = await fetch(`${cfg.url}/api/books`, {
    method: 'POST',
    headers,
    body: form
  });
  if (!res.ok) throw new Error(`uploadBook failed (HTTP ${res.status})`);
  return res.json();
}

export async function updateProgress(id, payload) {
  if (!id) return;
  const res = await fetch(apiUrl(`/api/books/${id}`), {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`updateProgress failed (HTTP ${res.status})`);
  return res.json();
}

export async function deleteBook(id) {
  const res = await fetch(apiUrl(`/api/books/${id}`), {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`deleteBook failed (HTTP ${res.status})`);
  return res.json();
}

/**
 * Convert a Blob downloaded from the backend into a File so existing
 * parseFile logic can be re-used unchanged.
 */
export function blobToFile(blob, filename, mimeType) {
  return new File([blob], filename || 'book', { type: mimeType || blob.type || 'application/octet-stream' });
}
