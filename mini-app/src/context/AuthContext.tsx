import WebApp from '@twa-dev/sdk';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchMe, getAuthToken, loginWithTelegram, setAuthToken } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  refreshUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
  }, []);

  const authenticate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const initData = WebApp.initData;
      const existingToken = getAuthToken();

      if (initData) {
        const result = await loginWithTelegram(initData);
        setUser(result.user);
        return;
      }

      if (existingToken) {
        setLoading(false);
        try {
          const me = await fetchMe();
          setUser(me);
        } catch (err) {
          setAuthToken(null);
          setUser(null);
          setError(err instanceof Error ? err.message : 'Ошибка авторизации');
        }
        return;
      }

      setError('Откройте приложение через Telegram');
    } catch (err) {
      setAuthToken(null);
      setUser(null);
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    authenticate();
  }, [authenticate, attempt]);

  const refreshUser = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      retry: () => setAttempt((n) => n + 1),
      refreshUser,
    }),
    [user, loading, error, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
