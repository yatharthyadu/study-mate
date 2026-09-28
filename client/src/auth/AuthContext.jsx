import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../api.js';

// Holds the logged-in user for the whole app.
// user === undefined while we're still checking the cookie, null when logged out.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.getMe().then(setUser, () => setUser(null));
    api.setUnauthorizedHandler(() => setUser(null));
  }, []);

  const login = useCallback(async (email, password) => setUser(await api.login(email, password)), []);
  const signup = useCallback(async (email, password) => setUser(await api.signup(email, password)), []);
  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
