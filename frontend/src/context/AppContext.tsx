import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AppTab = 'tasks' | 'scratchpad';

interface AppContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  navigateToNote: (noteId: string) => void;
  pendingNoteId: string | null;
  clearPendingNote: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<AppTab>('tasks');
  const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);

  const navigateToNote = useCallback((noteId: string) => {
    setPendingNoteId(noteId);
    setActiveTab('scratchpad');
  }, []);

  const clearPendingNote = useCallback(() => {
    setPendingNoteId(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        navigateToNote,
        pendingNoteId,
        clearPendingNote,
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
