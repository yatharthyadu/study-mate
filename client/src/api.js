// All functions that talk to the backend, in one place.
// The login cookie is httpOnly, so the browser sends it automatically; we never touch the token.

// AuthContext registers this so any 401 (expired/missing login) logs the user out in the UI
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// fetch wrapper: parses JSON and turns error responses into thrown Errors
async function request(url, options = {}, fallbackError = 'Request failed') {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.startsWith('/api/auth/')) onUnauthorized();
  if (!res.ok) throw new Error(data.error || fallbackError);
  return data;
}

function postJson(url, body, fallbackError) {
  return request(
    url,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    fallbackError
  );
}

// ---------- Auth ----------

export const getMe = () => request('/api/auth/me', {}, 'Not logged in');
export const login = (email, password) => postJson('/api/auth/login', { email, password }, 'Login failed');
export const signup = (email, password) => postJson('/api/auth/signup', { email, password }, 'Signup failed');
export const logout = () => postJson('/api/auth/logout', {}, 'Logout failed');

// ---------- Documents ----------

export const listDocuments = () => request('/api/documents', {}, 'Failed to load PDFs');

export function uploadPdf(file) {
  const form = new FormData();
  form.append('pdf', file);
  return request('/api/documents', { method: 'POST', body: form }, 'Upload failed');
}

export const deleteDocument = (id) => request(`/api/documents/${id}`, { method: 'DELETE' }, 'Delete failed');

// ---------- Chat ----------

// The answer is streamed: each new piece is passed to onToken
export async function askQuestion({ documentId, question, history, onSources, onToken }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, question, history }),
  });

  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to get an answer');
  }

  const sources = res.headers.get('X-Sources');
  if (sources) onSources(JSON.parse(decodeURIComponent(sources)));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value, { stream: true }));
  }
}
