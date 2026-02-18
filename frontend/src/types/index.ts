export type TaskStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export interface StatusEntry {
  id: string;
  status: TaskStatus;
  active_at: string;
  inactive_at: string | null;
}

export interface Step {
  id: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
  order: number;
}

export interface ResearchReference {
  id: string;
  title: string;
  url: string | null;
  notes: string | null;
  added_at: string;
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  current_status: StatusEntry;
  status_history: StatusEntry[];
  project_id: string | null;
  overall_order: number;
  project_order: number;
  notes: string | null;
  next_steps: Step[];
  research: ResearchReference[];
  linked_note_ids: string[];
}

export interface TaskListItem {
  id: string;
  name: string;
  description: string | null;
  current_status: StatusEntry;
  project_id: string | null;
  overall_order: number;
  project_order: number;
  completed_at: string | null;
  step_count: number;
  completed_step_count: number;
  next_step_description: string | null;
  linked_note_ids: string[];
}

export interface Project {
  id: string;
  name: string;
  color: string | null;
  order: number;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  order: number;
  tags: string[];
  project_id: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AgentTokenResponse {
  access_token: string;
  token_type: string;
  expires_in_days: number;
}
