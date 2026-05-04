import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTasks } from '../../context/TaskContext';

interface ProjectRailProps {
  onNavigate?: () => void;
}

export function ProjectRail({ onNavigate }: ProjectRailProps = {}) {
  const { user, logout } = useAuth();
  const { selectedProjectId, isProfile, openProject: openProjectAction, openProfile: openProfileAction, openProjectsRoot } = useApp();
  const { projects, createProject, deleteProject } = useTasks();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const openProject = (id: string) => {
    openProjectAction(id);
    onNavigate?.();
  };
  const openProfile = () => {
    openProfileAction();
    onNavigate?.();
  };

  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3cc2ff');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const project = await createProject({ name: newName.trim(), color: newColor });
    openProject(project.id);
    setNewName('');
    setShowNewProject(false);
  };

  const handleDelete = async (projectId: string, name: string) => {
    if (!confirm(`Delete project "${name}"? All tasks, notes, and insights will be permanently removed.`)) return;
    await deleteProject(projectId);
    if (selectedProjectId === projectId) openProjectsRoot();
  };

  const inDrawer = onNavigate !== undefined;

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: inDrawer ? '100%' : 260,
        minWidth: inDrawer ? 0 : 260,
        padding: '18px 14px',
        gap: 14,
        background: 'rgba(5, 6, 13, 0.55)',
        borderRight: '1px solid var(--panel-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Brand */}
      <div className="glass-panel-tight" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-7 h-7">
          <rect x="3" y="3" width="26" height="26" rx="7" stroke="var(--accent)" strokeWidth="2" />
          <path d="M10 16.5L14.5 21L22 11.5" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Track</div>
          <div style={{ fontSize: 10, letterSpacing: '0.22em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Project Studio
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="section-label" style={{ padding: '4px 8px 6px' }}>Projects</div>

        {projects.length === 0 && !showNewProject && (
          <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-muted)' }}>
            No projects yet — add your first one below.
          </div>
        )}

        {projects.map((p) => {
          const isActive = selectedProjectId === p.id && !isProfile;
          const isHovered = hoveredId === p.id;
          return (
            <div
              key={p.id}
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId((id) => (id === p.id ? null : id))}
            >
              <button
                type="button"
                className={`project-rail-item ${isActive ? 'is-active' : ''}`}
                onClick={() => openProject(p.id)}
                style={{ flex: 1, paddingRight: 28 }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    background: p.color || 'var(--accent)',
                    boxShadow: `0 0 8px ${p.color || 'rgba(60,194,255,0.7)'}`,
                    flex: '0 0 auto',
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </button>
              <button
                type="button"
                aria-label={`Delete project ${p.name}`}
                title="Delete project"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p.id, p.name);
                }}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  opacity: isHovered || isActive ? 1 : 0,
                  transition: 'opacity 120ms, color 120ms, background 120ms',
                  fontSize: 14,
                  lineHeight: 1,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--danger)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ×
              </button>
            </div>
          );
        })}

        {showNewProject ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px' }}>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              className="accent-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowNewProject(false);
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{ width: 32, height: 32, background: 'transparent', border: '1px solid var(--panel-border)', borderRadius: 8, cursor: 'pointer' }}
              />
              <button onClick={handleCreate} className="pill-tab is-active" style={{ flex: 1, justifyContent: 'center' }}>
                Create
              </button>
              <button onClick={() => setShowNewProject(false)} className="pill-tab">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="ghost-btn"
            style={{ margin: '8px 4px 4px', justifyContent: 'flex-start' }}
            onClick={() => setShowNewProject(true)}
          >
            <span style={{ fontSize: 14 }}>＋</span> Add Project
          </button>
        )}
      </div>

      {/* Footer: Control (profile) + sign out */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="glass-panel-tight">
        <button
          type="button"
          className="project-rail-item"
          style={{
            borderColor: isProfile ? 'var(--accent)' : 'transparent',
            boxShadow: isProfile ? 'var(--accent-glow)' : 'none',
            color: isProfile ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
          onClick={() => openProfile()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Control · {user?.name || 'You'}
          </span>
        </button>
        <button
          type="button"
          onClick={logout}
          style={{
            textAlign: 'left',
            padding: '6px 10px',
            borderRadius: 8,
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
