import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { askQuestion } from '../api.js';

export default function ChatWindow({ document }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Clear the chat when a new PDF is selected
  useEffect(() => setMessages([]), [document?._id]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  // Helper to update the last (assistant) message
  function updateLast(fn) {
    setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '', sources: [] },
    ]);
    setInput('');
    setLoading(true);

    try {
      await askQuestion({
        documentId: document._id,
        question,
        history,
        onSources: (sources) => updateLast((m) => ({ ...m, sources })),
        onToken: (token) => updateLast((m) => ({ ...m, content: m.content + token })),
      });
    } catch (err) {
      updateLast((m) => ({ ...m, content: `⚠️ ${err.message}` }));
    } finally {
      setLoading(false);
    }
  }

  if (!document) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-400">
        Upload or select a PDF on the left, then ask questions about it.
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-slate-200 px-4 py-3">
        <p className="truncate text-sm font-medium text-slate-900">{document.name}</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">Example: "Summarize this document" or "What is the refund policy?"</p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="answer">
                  {m.content ? <Markdown>{m.content}</Markdown> : <span className="text-slate-400">Thinking…</span>}
                </div>
              ) : (
                m.content
              )}

              {m.sources?.length > 0 && (
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer">Sources ({m.sources.length} chunks)</summary>
                  <ul className="mt-1 space-y-1">
                    {m.sources.map((s, j) => (
                      <li key={j} className="rounded bg-white p-2">
                        <span className="font-medium">Page {s.page}</span> · score {s.score}
                        <p className="mt-1 text-slate-400">{s.preview}…</p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about the PDF…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          disabled={loading || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </section>
  );
}
