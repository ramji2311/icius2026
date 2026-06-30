import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  email: string;
  username: string;
  role: 'Admin' | 'Editor' | 'Author' | 'Reviewer' | string;
  country?: string;
  verified: boolean;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Refresh auth state (call after login/logout) */
  refresh: () => Promise<void>;
  /** True while the initial check is in progress */
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: 'loading',
  refresh: async () => {},
  isLoading: true,
  isAuthenticated: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      setStatus('loading');
      const res = await api.get('/api/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        setStatus('authenticated');
        // Keep the fallback token in sync for cross-domain resilience (SameSite fallback)
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        // Keep the lightweight localStorage flag in sync for Navbar legacy code
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        setUser(null);
        setStatus('unauthenticated');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token');
      }
    } catch (error: any) {
      // Only warn if they actually HAD a token but it failed. Guest users shouldn't see errors.
      if (localStorage.getItem('token')) {
        console.warn('❌ Auth: Verification failed for /api/auth/me', error.response?.status);
      }
      
      setUser(null);
      setStatus('unauthenticated');
      
      // If it's a definite 401 Unauthorized, clear everything
      if (error.response?.status === 401) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Run once on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Also re-run whenever a custom "authStateChanged" event fires (emitted by Login/Logout)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('authStateChanged', handler);
    return () => window.removeEventListener('authStateChanged', handler);
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        refresh,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
