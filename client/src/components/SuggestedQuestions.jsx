// Shown in an empty chat: each selected PDF's summary plus clickable study questions
export default function SuggestedQuestions({ documents, onAsk, disabled }) {
  const withAids = documents.filter((d) => d.summary || d.suggestedQuestions?.length);
  if (withAids.length === 0) return null;

  return (
    <div className="space-y-4">
      {withAids.map((doc) => (
        <div key={doc._id} className="rounded-2xl border border-slate-200 p-4">
          <p className="truncate text-sm font-semibold text-slate-900">{doc.name}</p>
          {doc.summary && <p className="mt-1 text-sm leading-relaxed text-slate-600">{doc.summary}</p>}

          {doc.suggestedQuestions?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {doc.suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAsk(q)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-left text-xs text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
