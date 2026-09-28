import { useRef, useState } from 'react';
import { uploadPdf, deleteDocument } from '../api.js';

export default function Sidebar({ documents, selectedId, onSelect, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const doc = await uploadPdf(file);
      await onChange();
      onSelect(doc._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      inputRef.current.value = '';
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this PDF?')) return;
    await deleteDocument(id);
    if (id === selectedId) onSelect(null);
    onChange();
  }

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-slate-50 md:w-72 md:border-b-0 md:border-r">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-slate-900">PDF Chat</h1>
        <p className="text-xs text-slate-500">Upload a PDF, ask questions</p>
      </div>

      <div className="px-4">
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
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {uploading ? 'Processing… (creating embeddings)' : '+ Upload PDF'}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <ul className="mt-4 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {documents.length === 0 && (
          <li className="px-2 text-sm text-slate-400">No PDFs yet</li>
        )}
        {documents.map((doc) => (
          <li key={doc._id}>
            <div
              onClick={() => onSelect(doc._id)}
              className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
                doc._id === selectedId ? 'bg-indigo-100 text-indigo-900' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{doc.name}</p>
                <p className="text-xs text-slate-500">
                  {doc.pages} pages · {doc.chunkCount} chunks
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, doc._id)}
                className="ml-2 text-slate-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
