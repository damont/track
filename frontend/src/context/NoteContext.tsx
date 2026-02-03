import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../api/client';
import { Note, Category } from '../types';
import { useAuth } from './AuthContext';

interface NoteFilter {
  categoryId: string | null;
}

interface NoteContextType {
  notes: Note[];
  categories: Category[];
  selectedNote: Note | null;
  isLoading: boolean;
  filter: NoteFilter;
  setFilter: (filter: Partial<NoteFilter>) => void;
  fetchNotes: () => Promise<void>;
  selectNote: (noteId: string | null) => void;
  createNote: (content: string, categoryId?: string) => Promise<Note>;
  updateNote: (noteId: string, data: { content?: string; pinned?: boolean; order?: number; tags?: string[]; category_id?: string }) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  createCategory: (data: { name: string; color?: string }) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilterState] = useState<NoteFilter>({
    categoryId: null,
  });

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.categoryId) {
        params.set('category_id', filter.categoryId);
      }
      const queryString = params.toString();
      const endpoint = `/api/notes${queryString ? `?${queryString}` : ''}`;
      const data = await api.get<Note[]>(endpoint);
      setNotes(data);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const fetchCategories = useCallback(async () => {
    const data = await api.get<Category[]>('/api/categories');
    setCategories(data);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
      fetchCategories();
    }
  }, [isAuthenticated, fetchNotes, fetchCategories]);

  const setFilter = (newFilter: Partial<NoteFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  };

  const selectNote = (noteId: string | null) => {
    if (!noteId) {
      setSelectedNote(null);
      return;
    }
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(note);
    }
  };

  const createNote = async (content: string, categoryId?: string) => {
    const note = await api.post<Note>('/api/notes', {
      content,
      category_id: categoryId || undefined,
    });
    await fetchNotes();
    setSelectedNote(note);
    return note;
  };

  const updateNote = async (noteId: string, data: { content?: string; pinned?: boolean; order?: number; tags?: string[]; category_id?: string }) => {
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

  const createCategory = async (data: { name: string; color?: string }) => {
    const category = await api.post<Category>('/api/categories', data);
    await fetchCategories();
    return category;
  };

  const deleteCategory = async (categoryId: string) => {
    await api.delete(`/api/categories/${categoryId}`);
    await fetchCategories();
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        categories,
        selectedNote,
        isLoading,
        filter,
        setFilter,
        fetchNotes,
        selectNote,
        createNote,
        updateNote,
        deleteNote,
        createCategory,
        deleteCategory,
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
