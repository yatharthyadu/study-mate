import { useEffect, useRef, useState } from 'react';
import { askQuestion, createConversation, getConversation } from '../api.js';
import DocumentPicker from './DocumentPicker.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';
import MessageBubble from './MessageBubble.jsx';

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
    if (conversationId && conversationId === createdIdRef.current) return;
    createdIdRef.current = null; // Reopening it later should load it from the server

    if (!conversationId) {
      setMessages([]);
      setConversationDocIds([]);
      return;
    }

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

  const isNewChat = !conversationId;
  const chatDocIds = isNewChat ? newChatDocumentIds : conversationDocIds;
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

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          {isNewChat ? (
            <DocumentPicker documents={documents} selectedIds={newChatDocumentIds} onChange={onNewChatDocumentIdsChange} />
          ) : (
            // An existing chat's PDFs are fixed; show them as chips
            <ul className="flex flex-wrap gap-2">
              {chatDocs.length === 0 && <li className="text-sm text-slate-400">The PDFs in this chat were deleted</li>}
              {chatDocs.map((d) => (
                <li key={d._id} className="max-w-[16rem] truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  📄 {d.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50/60">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}

          {messages.length === 0 && !loadError && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {chatDocIds.length === 0 ? 'What are we studying today?' : 'Ready when you are'}
                </h2>
                <p className="text-sm text-slate-500">
                  {chatDocIds.length === 0
                    ? documents.length === 0
                      ? 'Upload your notes or a textbook to get started.'
                      : 'Pick one or more PDFs above, then ask a question.'
                    : 'Ask your own question, or start with one of these:'}
                </p>
              </div>
              <SuggestedQuestions documents={chatDocs} onAsk={send} disabled={loading} />
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={m._id || i} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={chatDocIds.length ? 'Ask about your notes…' : 'Select a PDF first…'}
            className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            disabled={loading || !input.trim() || chatDocIds.length === 0}
            className="shrink-0 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
}
