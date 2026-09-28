// All functions that talk to the backend, in one place

export async function listDocuments() {
  const res = await fetch('/api/documents');
  if (!res.ok) throw new Error('Failed to load PDFs');
  return res.json();
}

export async function uploadPdf(file) {
  const form = new FormData();
  form.append('pdf', file);
  const res = await fetch('/api/documents', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export async function deleteDocument(id) {
  await fetch(`/api/documents/${id}`, { method: 'DELETE' });
}

// The answer is streamed: each new piece is passed to onToken
export async function askQuestion({ documentId, question, history, onSources, onToken }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, question, history }),
  });

  if (!res.ok) {
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
