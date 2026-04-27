import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { api, type AuthUser } from '../api';

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'todo-app-user';

const readStoredUser = (): AuthUser | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : (JSON.parse(raw) as AuthUser);
  } catch {
    return null;
  }
};

const persistUser = (user: AuthUser | null): void => {
  if (user === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setUser(result.user);
    persistUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await api.register(email, password);
    setUser(result.user);
    persistUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    persistUser(null);
    window.localStorage.removeItem('todo-app-active-org');
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
