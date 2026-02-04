import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../api/client';
import { Task, TaskListItem, Category, TaskStatus } from '../types';
import { useAuth } from './AuthContext';

interface TaskContextType {
  tasks: TaskListItem[];
  categories: Category[];
  selectedTask: Task | null;
  isLoading: boolean;
  filter: {
    active: boolean | null;
    categoryId: string | null;
    status: TaskStatus | null;
  };
  setFilter: (filter: Partial<TaskContextType['filter']>) => void;
  fetchTasks: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  selectTask: (taskId: string | null) => Promise<void>;
  createTask: (data: { name: string; description?: string; category_id?: string; notes?: string }) => Promise<Task>;
  updateTask: (taskId: string, data: { name?: string; description?: string; category_id?: string; notes?: string }) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<Task>;
  reactivateTask: (taskId: string) => Promise<Task>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<Task>;
  reorderTask: (taskId: string, orderType: 'overall' | 'category', beforeTaskId?: string, afterTaskId?: string) => Promise<void>;
  addStep: (taskId: string, description: string) => Promise<Task>;
  updateStep: (taskId: string, stepId: string, data: { description?: string; completed?: boolean }) => Promise<Task>;
  deleteStep: (taskId: string, stepId: string) => Promise<Task>;
  addResearch: (taskId: string, data: { title: string; url?: string; notes?: string }) => Promise<Task>;
  updateResearch: (taskId: string, refId: string, data: { title?: string; url?: string; notes?: string }) => Promise<Task>;
  deleteResearch: (taskId: string, refId: string) => Promise<Task>;
  linkNote: (taskId: string, noteId: string) => Promise<Task>;
  unlinkNote: (taskId: string, noteId: string) => Promise<Task>;
  createCategory: (data: { name: string; color?: string }) => Promise<Category>;
  updateCategory: (categoryId: string, data: { name?: string; color?: string }) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilterState] = useState<TaskContextType['filter']>({
    active: true,
    categoryId: null,
    status: null,
  });

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.active !== null) {
        params.set('active', String(filter.active));
      }
      if (filter.categoryId) {
        params.set('category_id', filter.categoryId);
      }
      if (filter.status) {
        params.set('status', filter.status);
      }
      const queryString = params.toString();
      const endpoint = `/api/tasks${queryString ? `?${queryString}` : ''}`;
      const data = await api.get<TaskListItem[]>(endpoint);
      setTasks(data);
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
      fetchTasks();
      fetchCategories();
    }
  }, [isAuthenticated, fetchTasks, fetchCategories]);

  const setFilter = (newFilter: Partial<TaskContextType['filter']>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  };

  const selectTask = async (taskId: string | null) => {
    if (!taskId) {
      setSelectedTask(null);
      return;
    }
    const task = await api.get<Task>(`/api/tasks/${taskId}`);
    setSelectedTask(task);
  };

  const createTask = async (data: { name: string; description?: string; category_id?: string; notes?: string }) => {
    const task = await api.post<Task>('/api/tasks', data);
    await fetchTasks();
    return task;
  };

  const updateTask = async (taskId: string, data: { name?: string; description?: string; category_id?: string; notes?: string }) => {
    const task = await api.put<Task>(`/api/tasks/${taskId}`, data);
    await fetchTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const deleteTask = async (taskId: string) => {
    await api.delete(`/api/tasks/${taskId}`);
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
    await fetchTasks();
  };

  const completeTask = async (taskId: string) => {
    const task = await api.post<Task>(`/api/tasks/${taskId}/complete`);
    await fetchTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const reactivateTask = async (taskId: string) => {
    const task = await api.post<Task>(`/api/tasks/${taskId}/reactivate`);
    await fetchTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const task = await api.put<Task>(`/api/tasks/${taskId}/status`, { status });
    await fetchTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const reorderTask = async (
    taskId: string,
    orderType: 'overall' | 'category',
    beforeTaskId?: string,
    afterTaskId?: string
  ) => {
    await api.post('/api/tasks/reorder', {
      task_id: taskId,
      order_type: orderType,
      before_task_id: beforeTaskId,
      after_task_id: afterTaskId,
    });
    await fetchTasks();
  };

  const addStep = async (taskId: string, description: string) => {
    const task = await api.post<Task>(`/api/tasks/${taskId}/steps`, { description });
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    await fetchTasks();
    return task;
  };

  const updateStep = async (taskId: string, stepId: string, data: { description?: string; completed?: boolean }) => {
    const task = await api.put<Task>(`/api/tasks/${taskId}/steps/${stepId}`, data);
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    await fetchTasks();
    return task;
  };

  const deleteStep = async (taskId: string, stepId: string) => {
    const task = await api.delete<Task>(`/api/tasks/${taskId}/steps/${stepId}`);
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    await fetchTasks();
    return task;
  };

  const addResearch = async (taskId: string, data: { title: string; url?: string; notes?: string }) => {
    const task = await api.post<Task>(`/api/tasks/${taskId}/research`, data);
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const updateResearch = async (taskId: string, refId: string, data: { title?: string; url?: string; notes?: string }) => {
    const task = await api.put<Task>(`/api/tasks/${taskId}/research/${refId}`, data);
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const deleteResearch = async (taskId: string, refId: string) => {
    const task = await api.delete<Task>(`/api/tasks/${taskId}/research/${refId}`);
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const linkNote = async (taskId: string, noteId: string) => {
    const task = await api.post<Task>(`/api/tasks/${taskId}/notes/${noteId}`);
    await fetchTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const unlinkNote = async (taskId: string, noteId: string) => {
    const task = await api.delete<Task>(`/api/tasks/${taskId}/notes/${noteId}`);
    await fetchTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(task);
    }
    return task;
  };

  const createCategory = async (data: { name: string; color?: string }) => {
    const category = await api.post<Category>('/api/categories', data);
    await fetchCategories();
    return category;
  };

  const updateCategory = async (categoryId: string, data: { name?: string; color?: string }) => {
    const category = await api.put<Category>(`/api/categories/${categoryId}`, data);
    await fetchCategories();
    return category;
  };

  const deleteCategory = async (categoryId: string) => {
    await api.delete(`/api/categories/${categoryId}`);
    await fetchCategories();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        categories,
        selectedTask,
        isLoading,
        filter,
        setFilter,
        fetchTasks,
        fetchCategories,
        selectTask,
        createTask,
        updateTask,
        deleteTask,
        completeTask,
        reactivateTask,
        updateTaskStatus,
        reorderTask,
        addStep,
        updateStep,
        deleteStep,
        addResearch,
        updateResearch,
        deleteResearch,
        linkNote,
        unlinkNote,
        createCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
