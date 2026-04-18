import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { api } from '../api/client';
import { AgentInsight } from '../types';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

interface InsightContextType {
  insights: AgentInsight[];
  selectedInsight: AgentInsight | null;
  isLoading: boolean;
  lastSyncedAt: number | null;
  refresh: () => Promise<void>;
  dismiss: (insightId: string) => Promise<void>;
  create: (data: {
    title: string;
    body: string;
    agent_name?: string;
    kind?: string;
    linked_task_ids?: string[];
    linked_note_ids?: string[];
  }) => Promise<AgentInsight | null>;
}

const InsightContext = createContext<InsightContextType | undefined>(undefined);

export function InsightProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { selectedProjectId, focusKind, focusId } = useApp();
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<AgentInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const activeProjectRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!selectedProjectId) {
      setInsights([]);
      setLastSyncedAt(null);
      return;
    }
    const project = selectedProjectId;
    activeProjectRef.current = project;
    setIsLoading(true);
    try {
      const data = await api.get<AgentInsight[]>(
        `/api/projects/${project}/insights?limit=3`
      );
      if (activeProjectRef.current === project) {
        setInsights(data);
        setLastSyncedAt(Date.now());
      }
    } finally {
      if (activeProjectRef.current === project) {
        setIsLoading(false);
      }
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setInsights([]);
      setLastSyncedAt(null);
    }
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (focusKind === 'insights' && focusId) {
      const local = insights.find((i) => i.id === focusId);
      if (local) {
        setSelectedInsight(local);
      } else {
        setSelectedInsight(null);
      }
    } else {
      setSelectedInsight(null);
    }
  }, [focusKind, focusId, insights]);

  const dismiss = useCallback(
    async (insightId: string) => {
      await api.post(`/api/insights/${insightId}/dismiss`);
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
    },
    []
  );

  const create = useCallback(
    async (data: {
      title: string;
      body: string;
      agent_name?: string;
      kind?: string;
      linked_task_ids?: string[];
      linked_note_ids?: string[];
    }) => {
      if (!selectedProjectId) return null;
      const insight = await api.post<AgentInsight>(
        `/api/projects/${selectedProjectId}/insights`,
        data
      );
      await refresh();
      return insight;
    },
    [selectedProjectId, refresh]
  );

  return (
    <InsightContext.Provider
      value={{ insights, selectedInsight, isLoading, lastSyncedAt, refresh, dismiss, create }}
    >
      {children}
    </InsightContext.Provider>
  );
}

export function useInsights() {
  const ctx = useContext(InsightContext);
  if (!ctx) throw new Error('useInsights must be used within an InsightProvider');
  return ctx;
}
