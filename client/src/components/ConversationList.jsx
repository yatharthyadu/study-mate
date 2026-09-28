import { HOVER_REVEAL } from './styles.js';

// Past chats in the sidebar. Clicking one opens it; ✕ deletes it.
export default function ConversationList({ conversations, activeId, onOpen, onDelete }) {
  if (conversations.length === 0) {
    return <p className="px-2 text-sm text-slate-400">No chats yet</p>;
  }

  return (
    <ul className="space-y-1">
      {conversations.map((c) => (
        <li key={c._id}>
          <div
            onClick={() => onOpen(c._id)}
            className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${
              c._id === activeId ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="min-w-0 truncate">💬 {c.title}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c._id);
              }}
              className={`ml-2 text-slate-400 hover:text-red-600 ${HOVER_REVEAL}`}
              title="Delete chat"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
