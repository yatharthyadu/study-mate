// Checkbox list for choosing which PDFs a new chat should search
export default function DocumentPicker({ documents, selectedIds, onChange }) {
  function toggle(id) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  if (documents.length === 0) {
    return <p className="text-sm text-slate-400">Upload a PDF on the left to get started.</p>;
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Choose PDFs for this chat</p>
        <button
          type="button"
          onClick={() => onChange(selectedIds.length === documents.length ? [] : documents.map((d) => d._id))}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          {selectedIds.length === documents.length ? 'Clear' : 'Select all'}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {documents.map((doc) => {
          const checked = selectedIds.includes(doc._id);
          return (
            <li key={doc._id}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                  checked ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => toggle(doc._id)} className="accent-indigo-600" />
                <span className="max-w-[16rem] truncate">{doc.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
