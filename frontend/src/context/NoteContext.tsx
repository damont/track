import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../api/client';
import { Note, Project } from '../types';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

interface NoteFilter {
  projectId: string | null;
}

interface NoteContextType {
  notes: Note[];
  projects: Project[];
  selectedNote: Note | null;
  isLoading: boolean;
  filter: NoteFilter;
  setFilter: (filter: Partial<NoteFilter>) => void;
  fetchNotes: () => Promise<void>;
  selectNote: (noteId: string | null) => Promise<void>;
  createNote: (content: string, projectId: string) => Promise<Note>;
  updateNote: (noteId: string, data: { content?: string; pinned?: boolean; order?: number; tags?: string[]; project_id?: string }) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  createProject: (data: { name: string; color?: string }) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { selectedProjectId, focusKind, focusId, openProject } = useApp();
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filter: NoteFilter = {
    projectId: selectedProjectId,
  };

  const fetchNotes = useCallback(async () => {
    if (!selectedProjectId) {
      setNotes([]);
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('project_id', selectedProjectId);
      const endpoint = `/api/notes?${params.toString()}`;
      const data = await api.get<Note[]>(endpoint);
      setNotes(data);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId]);

  const fetchProjects = useCallback(async () => {
    const data = await api.get<Project[]>('/api/projects');
    setProjects(data);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
      fetchProjects();
    }
  }, [isAuthenticated, fetchNotes, fetchProjects]);

  const setFilter = (newFilter: Partial<NoteFilter>) => {
    if ('projectId' in newFilter && newFilter.projectId) {
      openProject(newFilter.projectId);
    }
  };

  const selectNote = useCallback(
    async (noteId: string | null) => {
      if (!noteId) {
        setSelectedNote(null);
        return;
      }
      const local = notes.find((n) => n.id === noteId);
      if (local) {
        setSelectedNote(local);
        return;
      }
      try {
        const fetched = await api.get<Note>(`/api/notes/${noteId}`);
        setSelectedNote(fetched);
      } catch {
        setSelectedNote(null);
      }
    },
    [notes]
  );

  // Sync selection from URL focus
  useEffect(() => {
    if (focusKind === 'notes' && focusId) {
      selectNote(focusId);
    } else {
      setSelectedNote(null);
    }
  }, [focusKind, focusId, selectNote]);

  const createNote = async (content: string, projectId: string) => {
    const note = await api.post<Note>('/api/notes', {
      content,
      project_id: projectId,
    });
    await fetchNotes();
    setSelectedNote(note);
    return note;
  };

  const updateNote = async (noteId: string, data: { content?: string; pinned?: boolean; order?: number; tags?: string[]; project_id?: string }) => {
    const note = await api.put<Note>(`/api/notes/${noteId}`, data);
    await fetchNotes();
    if (selectedNote?.id === noteId) {
      setSelectedNote(note);
    }
    return note;
  };

  const deleteNote = async (noteId: string) => {
    await api.delete(`/api/notes/${noteId}`);
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
    await fetchNotes();
  };

  const createProject = async (data: { name: string; color?: string }) => {
    const project = await api.post<Project>('/api/projects', data);
    await fetchProjects();
    return project;
  };

  const deleteProject = async (projectId: string) => {
    await api.delete(`/api/projects/${projectId}`);
    await fetchProjects();
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        projects,
        selectedNote,
        isLoading,
        filter,
        setFilter,
        fetchNotes,
        selectNote,
        createNote,
        updateNote,
        deleteNote,
        createProject,
        deleteProject,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}
