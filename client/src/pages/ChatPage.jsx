import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
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
    <div className="flex h-screen flex-col bg-white md:flex-row">
      <Sidebar
        documents={documents}
        conversations={conversations}
        activeConversationId={activeConversationId}
        selectedDocIds={selectedDocIds}
        onSelectDocument={selectDocument}
        onOpenConversation={setActiveConversationId}
        onNewChat={() => setActiveConversationId(null)}
        onDocumentsChange={handleDocumentsChange}
        onConversationsChange={refreshConversations}
      />
      <main className="flex min-h-0 flex-1 flex-col">
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
