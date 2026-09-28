import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { askQuestion, createConversation, getConversation } from '../api.js';
import DocumentPicker from './DocumentPicker.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';

export default function ChatWindow({
  conversationId,
  newChatDocumentIds,
  onNewChatDocumentIdsChange,
  documents,
  onConversationCreated,
  onAnswered,
}) {
  const [messages, setMessages] = useState([]);
  const [conversationDocIds, setConversationDocIds] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const bottomRef = useRef(null);
  // The chat currently on screen, so a stream from a chat we left doesn't write here
  const visibleIdRef = useRef(conversationId);
  // A chat we just created ourselves: its messages are already in state, don't reload
  const createdIdRef = useRef(null);

  // Load the chat's messages whenever a different chat is opened
  useEffect(() => {
    visibleIdRef.current = conversationId;
    setLoadError('');
    if (!conversationId) {
      setMessages([]);
      setConversationDocIds([]);
      return;
    }
    if (conversationId === createdIdRef.current) return;

    let cancelled = false;
    setMessages([]);
    getConversation(conversationId)
      .then((c) => {
        if (cancelled) return;
        setMessages(c.messages);
        setConversationDocIds(c.documentIds);
      })
      .catch((err) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const chatDocIds = conversationId ? conversationDocIds : newChatDocumentIds;
  const chatDocs = documents.filter((d) => chatDocIds.includes(d._id));

  function handleSubmit(e) {
    e.preventDefault();
    send(input.trim());
  }

  // Used by both the input box and the suggested-question chips
  async function send(question) {
    if (!question || loading || chatDocIds.length === 0) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '', sources: [] },
    ]);
    setInput('');
    setLoading(true);

    let id = conversationId;
    // Only touch the screen if the user is still looking at this chat
    const updateLast = (fn) => {
      if (visibleIdRef.current !== id) return;
      setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);
    };

    try {
      // New chat: create it on the server with the first question
      if (!id) {
        const conversation = await createConversation(newChatDocumentIds);
        id = conversation._id;
        createdIdRef.current = id;
        visibleIdRef.current = id;
        setConversationDocIds(conversation.documentIds);
        onConversationCreated(id);
      }
      await askQuestion({
        conversationId: id,
        question,
        onSources: (sources) => updateLast((m) => ({ ...m, sources })),
        onToken: (token) => updateLast((m) => ({ ...m, content: m.content + token })),
      });
    } catch (err) {
      updateLast((m) => ({ ...m, content: `⚠️ ${err.message}` }));
    } finally {
      setLoading(false);
      onAnswered();
    }
  }

  const isNewChat = !conversationId;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-slate-200 px-4 py-3">
        {isNewChat ? (
          <DocumentPicker documents={documents} selectedIds={newChatDocumentIds} onChange={onNewChatDocumentIdsChange} />
        ) : (
          // An existing chat's PDFs are fixed; show them as chips
          <ul className="flex flex-wrap gap-2">
            {chatDocs.length === 0 && <li className="text-sm text-slate-400">The PDFs in this chat were deleted</li>}
            {chatDocs.map((d) => (
              <li key={d._id} className="max-w-[16rem] truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {d.name}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {messages.length === 0 && !loadError && (
          <>
            <p className="text-sm text-slate-400">
              {chatDocIds.length === 0
                ? 'Select one or more PDFs above, then ask a question.'
                : 'Ask your own question, or try one of these:'}
            </p>
            <SuggestedQuestions documents={chatDocs} onAsk={send} disabled={loading} />
          </>
        )}

        {messages.map((m, i) => (
          <div key={m._id || i} className={m.role === 'user' ? 'flex justify-end' : ''}>
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
                        <span className="font-medium">
                          {s.documentName ? `${s.documentName}, ` : ''}page {s.page}
                        </span>{' '}
                        · score {s.score}
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
          placeholder="Ask anything about your PDFs…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          disabled={loading || !input.trim() || chatDocIds.length === 0}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </section>
  );
}
