import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, getCurrency, getFriendRequestCount, logout as apiLogout } from './services';

const AuthContext = createContext(null);

/**
 * Holds the signed-in user. status is 'loading' | 'in' | 'out'.
 * The session itself is the backend's HttpOnly cookie; nothing secret lives in JS.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, balance: null, requests: 0 });

  const refresh = useCallback(async () => {
    try {
      const user = await getMe();
      const [currency, requests] = await Promise.all([
        getCurrency(user.id).catch(() => null),
        getFriendRequestCount().catch(() => 0),
      ]);
      setState({ status: 'in', user, balance: currency ? currency.robux ?? currency.balance ?? null : null, requests });
    } catch {
      setState({ status: 'out', user: null, balance: null, requests: 0 });
    }
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* session may already be gone */ }
    setState({ status: 'out', user: null, balance: null, requests: 0 });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <AuthContext.Provider value={{ ...state, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
