import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../api/client';
import { Task, TaskListItem, Project, TaskStatus } from '../types';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

interface TaskContextType {
  tasks: TaskListItem[];
  projects: Project[];
  selectedTask: Task | null;
  isLoading: boolean;
  filter: {
    active: boolean | null;
    projectId: string | null;
    status: TaskStatus | null;
  };
  setFilter: (filter: Partial<TaskContextType['filter']>) => void;
  fetchTasks: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  selectTask: (taskId: string | null) => Promise<void>;
  createTask: (data: { name: string; description?: string; project_id?: string; notes?: string }) => Promise<Task>;
  updateTask: (taskId: string, data: { name?: string; description?: string; project_id?: string; notes?: string }) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<Task>;
  reactivateTask: (taskId: string) => Promise<Task>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<Task>;
  reorderTask: (taskId: string, orderType: 'overall' | 'project', beforeTaskId?: string, afterTaskId?: string, newOrder?: number) => Promise<void>;
  addStep: (taskId: string, description: string) => Promise<Task>;
  updateStep: (taskId: string, stepId: string, data: { description?: string; completed?: boolean }) => Promise<Task>;
  deleteStep: (taskId: string, stepId: string) => Promise<Task>;
  addResearch: (taskId: string, data: { title: string; url?: string; notes?: string }) => Promise<Task>;
  updateResearch: (taskId: string, refId: string, data: { title?: string; url?: string; notes?: string }) => Promise<Task>;
  deleteResearch: (taskId: string, refId: string) => Promise<Task>;
  linkNote: (taskId: string, noteId: string) => Promise<Task>;
  unlinkNote: (taskId: string, noteId: string) => Promise<Task>;
  createProject: (data: { name: string; color?: string }) => Promise<Project>;
  updateProject: (projectId: string, data: { name?: string; color?: string }) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { pendingTaskId, clearPendingTask, selectedProjectId, setSelectedProjectId } = useApp();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localFilter, setLocalFilter] = useState<Omit<TaskContextType['filter'], 'projectId'>>({
    active: true,
    status: null,
  });

  const filter: TaskContextType['filter'] = {
    ...localFilter,
    projectId: selectedProjectId,
  };

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (localFilter.active !== null) {
        params.set('active', String(localFilter.active));
      }
      if (selectedProjectId) {
        params.set('project_id', selectedProjectId);
      }
      if (localFilter.status) {
        params.set('status', localFilter.status);
      }
      const queryString = params.toString();
      const endpoint = `/api/tasks${queryString ? `?${queryString}` : ''}`;
      const data = await api.get<TaskListItem[]>(endpoint);
      setTasks(data);
    } finally {
      setIsLoading(false);
    }
  }, [localFilter, selectedProjectId]);

  const fetchProjects = useCallback(async () => {
    const data = await api.get<Project[]>('/api/projects');
    setProjects(data);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchProjects();
    }
  }, [isAuthenticated, fetchTasks, fetchProjects]);

  const setFilter = (newFilter: Partial<TaskContextType['filter']>) => {
    if ('projectId' in newFilter) {
      setSelectedProjectId(newFilter.projectId ?? null);
    }
    const { projectId, ...rest } = newFilter;
    if (Object.keys(rest).length > 0) {
      setLocalFilter(prev => ({ ...prev, ...rest }));
    }
  };

  const selectTask = useCallback(async (taskId: string | null) => {
    if (!taskId) {
      setSelectedTask(null);
      return;
    }
    const task = await api.get<Task>(`/api/tasks/${taskId}`);
    setSelectedTask(task);
  }, []);

  // Handle navigation from other parts of the app (e.g. note linked tasks)
  useEffect(() => {
    if (pendingTaskId) {
      selectTask(pendingTaskId);
      clearPendingTask();
    }
  }, [pendingTaskId, selectTask, clearPendingTask]);

  const createTask = async (data: { name: string; description?: string; project_id?: string; notes?: string }) => {
    const task = await api.post<Task>('/api/tasks', data);
    await fetchTasks();
    return task;
  };

  const updateTask = async (taskId: string, data: { name?: string; description?: string; project_id?: string; notes?: string }) => {
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
    orderType: 'overall' | 'project',
    beforeTaskId?: string,
    afterTaskId?: string,
    newOrder?: number
  ) => {
    await api.post('/api/tasks/reorder', {
      task_id: taskId,
      order_type: orderType,
      before_task_id: beforeTaskId,
      after_task_id: afterTaskId,
      new_order: newOrder,
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

  const createProject = async (data: { name: string; color?: string }) => {
    const project = await api.post<Project>('/api/projects', data);
    await fetchProjects();
    return project;
  };

  const updateProject = async (projectId: string, data: { name?: string; color?: string }) => {
    const project = await api.put<Project>(`/api/projects/${projectId}`, data);
    await fetchProjects();
    return project;
  };

  const deleteProject = async (projectId: string) => {
    await api.delete(`/api/projects/${projectId}`);
    await fetchProjects();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        projects,
        selectedTask,
        isLoading,
        filter,
        setFilter,
        fetchTasks,
        fetchProjects,
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
        createProject,
        updateProject,
        deleteProject,
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
