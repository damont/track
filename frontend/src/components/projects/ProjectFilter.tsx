import { useState } from 'react';
import { useTasks } from '../../context/TaskContext';

export function ProjectFilter() {
  const { projects, filter, setFilter, createProject, deleteProject } = useTasks();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6c8aec');

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject({ name: newProjectName, color: newProjectColor });
    setNewProjectName('');
    setShowNewProject(false);
  };

  return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-2">
        <select
          value={filter.projectId || ''}
          onChange={(e) => setFilter({ projectId: e.target.value || null })}
          className="flex-1 px-3 py-1.5 rounded text-sm focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All Tasks</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowNewProject(!showNewProject)}
          className="px-2 py-1.5 rounded text-sm font-medium whitespace-nowrap"
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          title="Add project"
        >
          {projects.length === 0 ? '+ Project' : '+'}
        </button>

        {filter.projectId && (
          <button
            onClick={() => {
              if (confirm('Delete this project?')) {
                deleteProject(filter.projectId!);
                setFilter({ projectId: null });
              }
            }}
            className="px-2 py-1.5 rounded text-sm"
            style={{ color: 'var(--text-muted)' }}
            title="Delete selected project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {showNewProject && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-1.5 rounded text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateProject();
              if (e.key === 'Escape') setShowNewProject(false);
            }}
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newProjectColor}
              onChange={(e) => setNewProjectColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <button
              onClick={handleCreateProject}
              className="flex-1 px-3 py-1 rounded text-sm text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowNewProject(false)}
              className="px-3 py-1 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
