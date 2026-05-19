/**
 * Cloud sync client for Speeedy backend.
 *
 * The backend URL is hardcoded; sync is always active.
 */

const CURRENT_BOOK_KEY = 'rsvp-sync-current-book';

// Empty string = same origin (the SPA is served by nginx which proxies
// /api/* to the backend). This avoids CORS and mixed-content issues.
const BACKEND_URL = '';

export function loadConfig() {
  return { enabled: true, url: BACKEND_URL, token: '' };
}

export function saveConfig() {
  // No-op: backend URL is hardcoded.
  return loadConfig();
}

export function isEnabled() {
  return true;
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
  return {};
}

function apiUrl(path) {
  return `${BACKEND_URL}${path}`;
}

export async function ping() {
  const res = await fetch(`${BACKEND_URL}/health-backend`, { method: 'GET' });
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
  const form = new FormData();
  form.append('file', file);
  if (opts.title) form.append('title', opts.title);
  if (opts.metadata) form.append('metadata', JSON.stringify(opts.metadata));

  const res = await fetch(`${BACKEND_URL}/api/books`, {
    method: 'POST',
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
