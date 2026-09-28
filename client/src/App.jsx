import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import { listDocuments } from './api.js';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setDocuments(await listDocuments());
      setError('');
    } catch {
      setError('Could not connect to the backend. Is the server (port 5000) running?');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = documents.find((d) => d._id === selectedId);

  return (
    <div className="flex h-screen flex-col bg-white md:flex-row">
      <Sidebar documents={documents} selectedId={selectedId} onSelect={setSelectedId} onChange={refresh} />
      <main className="flex min-h-0 flex-1 flex-col">
        {error && <div className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
        <ChatWindow document={selected} />
      </main>
    </div>
  );
}
