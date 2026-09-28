// StudyMate logo + name, used in the sidebar, mobile top bar and auth pages
export default function Brand({ subtitle }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white shadow-sm">
        🎓
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold leading-tight text-slate-900">StudyMate</p>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
