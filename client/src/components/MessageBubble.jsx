import Markdown from 'react-markdown';

// One chat message. Assistant answers render Markdown and list their sources.
export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm">🎓</div>
      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200">
        <div className="answer">
          {message.content ? (
            <Markdown>{message.content}</Markdown>
          ) : (
            <span className="animate-pulse text-slate-400">Thinking…</span>
          )}
        </div>

        {message.sources?.length > 0 && (
          <details className="mt-2 text-xs text-slate-500">
            <summary className="cursor-pointer select-none hover:text-slate-700">
              Sources ({message.sources.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {message.sources.map((s, j) => (
                <li key={j} className="rounded-lg bg-slate-50 p-2">
                  <span className="font-medium text-slate-700">
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
  );
}
