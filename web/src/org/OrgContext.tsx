import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ORGS_CHANGED_EVENT, api, type OrgSummary } from '../api';
import { useAuth } from '../auth/AuthContext';

interface OrgState {
  organizations: OrgSummary[];
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const OrgContext = createContext<OrgState | null>(null);

const STORAGE_KEY = 'todo-app-active-org';

const readActive = (): string | null =>
  window.localStorage.getItem(STORAGE_KEY);

const writeActive = (id: string | null): void => {
  if (id === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, id);
  }
};

const pickActive = (
  current: string | null,
  orgs: readonly OrgSummary[],
): string | null => {
  if (current !== null && orgs.some((o) => o.id === current)) {
    return current;
  }
  return orgs[0]?.id ?? null;
};

export const OrgProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrgSummary[]>([]);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(readActive);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (user === null) {
      setOrganizations([]);
      setActiveOrgIdState(null);
      writeActive(null);
      return;
    }
    setLoading(true);
    try {
      const orgs = await api.listOrganizations();
      setOrganizations(orgs);
      const next = pickActive(readActive(), orgs);
      writeActive(next);
      setActiveOrgIdState(next);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = (): void => {
      void refresh();
    };
    window.addEventListener(ORGS_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener(ORGS_CHANGED_EVENT, handler);
    };
  }, [refresh]);

  const setActiveOrgId = useCallback((id: string) => {
    writeActive(id);
    setActiveOrgIdState(id);
  }, []);

  const value = useMemo<OrgState>(
    () => ({ organizations, activeOrgId, setActiveOrgId, refresh, loading }),
    [organizations, activeOrgId, setActiveOrgId, refresh, loading],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrg = (): OrgState => {
  const ctx = useContext(OrgContext);
  if (ctx === null) {
    throw new Error('useOrg must be used inside OrgProvider');
  }
  return ctx;
};
