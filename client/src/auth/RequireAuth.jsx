import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Wraps pages that need a login. Logged-out users are sent to /login.
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) return <FullPageMessage text="Loading…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

// The opposite: /login and /signup redirect away if you're already logged in
export function RedirectIfLoggedIn({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <FullPageMessage text="Loading…" />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function FullPageMessage({ text }) {
  return <div className="flex h-screen items-center justify-center text-sm text-slate-400">{text}</div>;
}
