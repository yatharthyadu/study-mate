import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Brand from '../components/Brand.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import { listDocuments, listConversations } from '../api.js';

// The main app screen (only reachable when logged in).
// activeConversationId === null means "new chat": the user picks PDFs, and the
// conversation is created on the server when the first question is sent.
export default function ChatPage() {
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [error, setError] = useState('');
  // Mobile only: is the sidebar drawer open?
  const [menuOpen, setMenuOpen] = useState(false);

  async function refreshDocuments() {
    try {
      setDocuments(await listDocuments());
      setError('');
    } catch (err) {
      setError(err.message || 'Could not connect to the backend. Is the server (port 5000) running?');
    }
  }

  async function refreshConversations() {
    try {
      setConversations(await listConversations());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refreshDocuments();
    refreshConversations();
  }, []);

  // Clicking a PDF in the sidebar starts a fresh chat about just that PDF
  function selectDocument(id) {
    setSelectedDocIds(id ? [id] : []);
    setActiveConversationId(null);
    setMenuOpen(false);
  }

  function openConversation(id) {
    setActiveConversationId(id);
    setMenuOpen(false);
  }

  function startNewChat() {
    setActiveConversationId(null);
    setMenuOpen(false);
  }

  // Deleting a PDF can change which chats reference it
  async function handleDocumentsChange() {
    await Promise.all([refreshDocuments(), refreshConversations()]);
  }

  // Keep the new-chat selection in sync when a PDF is deleted
  useEffect(() => {
    setSelectedDocIds((ids) => ids.filter((id) => documents.some((d) => d._id === id)));
  }, [documents]);

  return (
    <div className="flex h-dvh bg-white">
      {/* Mobile: dark backdrop behind the open drawer */}
      {menuOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Sidebar: slide-in drawer on mobile, always visible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          documents={documents}
          conversations={conversations}
          activeConversationId={activeConversationId}
          selectedDocIds={selectedDocIds}
          onSelectDocument={selectDocument}
          onOpenConversation={openConversation}
          onNewChat={startNewChat}
          onDocumentsChange={handleDocumentsChange}
          onConversationsChange={refreshConversations}
          onClose={() => setMenuOpen(false)}
        />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with the menu button */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2 md:hidden">
          <button onClick={() => setMenuOpen(true)} className="rounded-lg p-1.5 text-xl leading-none text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            ☰
          </button>
          <Brand />
        </div>
        {error && <div className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
        <ChatWindow
          conversationId={activeConversationId}
          newChatDocumentIds={selectedDocIds}
          onNewChatDocumentIdsChange={setSelectedDocIds}
          documents={documents}
          onConversationCreated={setActiveConversationId}
          onAnswered={refreshConversations}
        />
      </main>
    </div>
  );
}
