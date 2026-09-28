import { useRef, useState } from 'react';
import { uploadPdf, deleteDocument, deleteConversation } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Brand from './Brand.jsx';
import ConversationList from './ConversationList.jsx';
import { HOVER_REVEAL } from './styles.js';

export default function Sidebar({
  documents,
  conversations,
  activeConversationId,
  selectedDocIds,
  onSelectDocument,
  onOpenConversation,
  onNewChat,
  onDocumentsChange,
  onConversationsChange,
  onClose,
}) {
  const { user, logout } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const doc = await uploadPdf(file);
      await onDocumentsChange();
      onSelectDocument(doc._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      inputRef.current.value = '';
    }
  }

  async function handleDeleteDocument(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this PDF?')) return;
    await deleteDocument(id);
    onDocumentsChange();
  }

  async function handleDeleteConversation(id) {
    if (!confirm('Delete this chat?')) return;
    await deleteConversation(id);
    if (id === activeConversationId) onNewChat();
    onConversationsChange();
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <Brand subtitle="Your AI study assistant" />
        {/* Close button only shows in the mobile drawer */}
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 md:hidden" aria-label="Close menu">
          ✕
        </button>
      </div>

      <div className="space-y-2 px-4">
        <button
          onClick={onNewChat}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + New chat
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <button
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
        >
          {uploading ? 'Processing… (this can take a minute)' : '⤒ Upload PDF'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="mt-4 flex-1 space-y-5 overflow-y-auto px-2 pb-4">
        <section>
          <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">My PDFs</h2>
          <ul className="space-y-0.5">
            {documents.length === 0 && <li className="px-2 text-sm text-slate-400">No PDFs yet</li>}
            {documents.map((doc) => (
              <li key={doc._id}>
                <div
                  onClick={() => onSelectDocument(doc._id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    !activeConversationId && selectedDocIds.includes(doc._id)
                      ? 'bg-indigo-50 text-indigo-900'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">📄 {doc.name}</p>
                    <p className="text-xs text-slate-500">
                      {doc.pages} pages · {doc.chunkCount} chunks
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDocument(e, doc._id)}
                    className={`ml-2 text-slate-400 hover:text-red-600 ${HOVER_REVEAL}`}
                    title="Delete PDF"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Chats</h2>
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onOpen={onOpenConversation}
            onDelete={handleDeleteConversation}
          />
        </section>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold uppercase text-slate-600">
            {user.email[0]}
          </div>
          <p className="truncate text-xs text-slate-600" title={user.email}>
            {user.email}
          </p>
        </div>
        <button onClick={logout} className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-600">
          Log out
        </button>
      </div>
    </aside>
  );
}
