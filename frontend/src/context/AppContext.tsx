import { createContext, useCallback, useContext, useMemo, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type FocusKind = 'tasks' | 'notes' | 'insights' | null;
export type TabKind = 'tasks' | 'notes' | 'insights';

const LAST_PROJECT_KEY = 'track.lastProjectId';

interface AppContextType {
  selectedProjectId: string | null;
  focusKind: FocusKind;
  focusId: string | null;
  activeTab: TabKind;
  isProfile: boolean;
  openProject: (projectId: string) => void;
  openTab: (tab: TabKind, projectId?: string | null) => void;
  openTask: (taskId: string, projectId?: string | null) => void;
  openNote: (noteId: string, projectId?: string | null) => void;
  openInsight: (insightId: string, projectId?: string | null) => void;
  openProfile: () => void;
  closeFocus: () => void;
  openProjectsRoot: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PROJECT_PATH_RE = /^\/projects\/([^/]+)(?:\/(tasks|notes|insights)(?:\/([^/]+))?)?\/?$/;

export function rememberLastProject(id: string | null) {
  try {
    if (id) localStorage.setItem(LAST_PROJECT_KEY, id);
    else localStorage.removeItem(LAST_PROJECT_KEY);
  } catch {
    // ignore
  }
}

export function getLastProject(): string | null {
  try {
    return localStorage.getItem(LAST_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedProjectId, focusKind, focusId, activeTab, isProfile } = useMemo(() => {
    const path = location.pathname;
    if (path === '/profile' || path.startsWith('/profile/')) {
      return {
        selectedProjectId: null,
        focusKind: null as FocusKind,
        focusId: null,
        activeTab: 'tasks' as TabKind,
        isProfile: true,
      };
    }
    const match = path.match(PROJECT_PATH_RE);
    if (!match) {
      return {
        selectedProjectId: null,
        focusKind: null as FocusKind,
        focusId: null,
        activeTab: 'tasks' as TabKind,
        isProfile: false,
      };
    }
    const projectId = match[1];
    const tab = (match[2] as TabKind | undefined) || null;
    const id = match[3] || null;
    // focusKind drives desktop's panel-focus expansion — only set when a detail is open.
    // activeTab drives the mobile tab bar — falls back to 'tasks' on bare project routes.
    return {
      selectedProjectId: projectId,
      focusKind: id ? (tab as FocusKind) : null,
      focusId: id,
      activeTab: (tab || 'tasks') as TabKind,
      isProfile: false,
    };
  }, [location.pathname]);

  const resolveProject = useCallback(
    (override?: string | null) => override ?? selectedProjectId,
    [selectedProjectId]
  );

  const openProject = useCallback(
    (projectId: string) => {
      rememberLastProject(projectId);
      navigate(`/projects/${projectId}`);
    },
    [navigate]
  );

  const openTab = useCallback(
    (tab: TabKind, projectId?: string | null) => {
      const pid = resolveProject(projectId);
      if (!pid) return;
      rememberLastProject(pid);
      navigate(`/projects/${pid}/${tab}`);
    },
    [navigate, resolveProject]
  );

  const openTask = useCallback(
    (taskId: string, projectId?: string | null) => {
      const pid = resolveProject(projectId);
      if (!pid) return;
      rememberLastProject(pid);
      navigate(`/projects/${pid}/tasks/${taskId}`);
    },
    [navigate, resolveProject]
  );

  const openNote = useCallback(
    (noteId: string, projectId?: string | null) => {
      const pid = resolveProject(projectId);
      if (!pid) return;
      rememberLastProject(pid);
      navigate(`/projects/${pid}/notes/${noteId}`);
    },
    [navigate, resolveProject]
  );

  const openInsight = useCallback(
    (insightId: string, projectId?: string | null) => {
      const pid = resolveProject(projectId);
      if (!pid) return;
      rememberLastProject(pid);
      navigate(`/projects/${pid}/insights/${insightId}`);
    },
    [navigate, resolveProject]
  );

  const openProfile = useCallback(() => navigate('/profile'), [navigate]);

  const openProjectsRoot = useCallback(() => navigate('/projects'), [navigate]);

  const closeFocus = useCallback(() => {
    if (!selectedProjectId) {
      navigate('/projects');
      return;
    }
    // If a detail is open, drop back to the bare-tab route so the active section
    // is preserved (matters on mobile where the tab is the visible context).
    if (focusId && focusKind) {
      navigate(`/projects/${selectedProjectId}/${focusKind}`);
    } else {
      navigate(`/projects/${selectedProjectId}`);
    }
  }, [navigate, selectedProjectId, focusKind, focusId]);

  return (
    <AppContext.Provider
      value={{
        selectedProjectId,
        focusKind,
        focusId,
        activeTab,
        isProfile,
        openProject,
        openTab,
        openTask,
        openNote,
        openInsight,
        openProfile,
        closeFocus,
        openProjectsRoot,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
