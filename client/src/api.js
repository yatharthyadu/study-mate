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

// ---------- Conversations ----------

export const listConversations = () => request('/api/conversations', {}, 'Failed to load chats');
export const createConversation = (documentIds) =>
  postJson('/api/conversations', { documentIds }, 'Failed to start a chat');
export const getConversation = (id) => request(`/api/conversations/${id}`, {}, 'Failed to load chat');
export const deleteConversation = (id) =>
  request(`/api/conversations/${id}`, { method: 'DELETE' }, 'Failed to delete chat');

// ---------- Chat ----------

// The answer is streamed: each new piece is passed to onToken.
// History comes from the database, so only the new question is sent.
export async function askQuestion({ conversationId, question, onSources, onToken }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, question }),
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
