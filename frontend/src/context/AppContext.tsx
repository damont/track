import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AppTab = 'tasks' | 'scratchpad';

interface AppContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
  navigateToNote: (noteId: string) => void;
  navigateToTask: (taskId: string) => void;
  pendingNoteId: string | null;
  pendingTaskId: string | null;
  clearPendingNote: () => void;
  clearPendingTask: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<AppTab>('tasks');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const navigateToNote = useCallback((noteId: string) => {
    setPendingNoteId(noteId);
    setActiveTab('scratchpad');
  }, []);

  const navigateToTask = useCallback((taskId: string) => {
    setPendingTaskId(taskId);
    setActiveTab('tasks');
  }, []);

  const clearPendingNote = useCallback(() => {
    setPendingNoteId(null);
  }, []);

  const clearPendingTask = useCallback(() => {
    setPendingTaskId(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedProjectId,
        setSelectedProjectId,
        navigateToNote,
        navigateToTask,
        pendingNoteId,
        pendingTaskId,
        clearPendingNote,
        clearPendingTask,
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
