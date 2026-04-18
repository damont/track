import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTasks } from '../../context/TaskContext';
import { ActiveProtocolsPanel } from './ActiveProtocolsPanel';
import { ContextDirectivesPanel } from './ContextDirectivesPanel';
import { AgentInsightsPanel } from './AgentInsightsPanel';

export function Workbench() {
  const { selectedProjectId, focusKind, openProject, closeFocus } = useApp();
  const { projects } = useTasks();

  const project = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  if (!selectedProjectId || !project) {
    return (
      <div
        className="glass-panel"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 14,
          padding: 40,
          textAlign: 'center',
        }}
      >
        <div className="section-label">No project selected</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 360 }}>
          {projects.length === 0
            ? 'Create your first project in the left rail to begin.'
            : 'Choose a project from the left rail to open its workbench.'}
        </div>
        {projects.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {projects.slice(0, 4).map((p) => (
              <button key={p.id} className="pill-tab" onClick={() => openProject(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const gridTemplate =
    focusKind === 'tasks'
      ? '5fr minmax(180px, 0.7fr) minmax(180px, 0.7fr)'
      : focusKind === 'notes'
      ? 'minmax(180px, 0.7fr) 5fr minmax(180px, 0.7fr)'
      : focusKind === 'insights'
      ? 'minmax(180px, 0.7fr) minmax(180px, 0.7fr) 5fr'
      : 'minmax(260px, 1fr) minmax(320px, 1.6fr) minmax(280px, 1fr)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <div
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: 22,
              color: 'var(--text-primary)',
              letterSpacing: '0.01em',
            }}
          >
            {project.name}
          </div>
          {project.description && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {project.description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 20 }}>
          <button
            className="pill-tab is-active"
            type="button"
            onClick={() => focusKind && closeFocus()}
          >
            Workbench
          </button>
          <button className="pill-tab" type="button" disabled title="Coming soon">
            Telemetry
          </button>
          <button className="pill-tab" type="button" disabled title="Coming soon">
            Graph
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative', minWidth: 220 }}>
          <input
            type="text"
            placeholder="System search"
            className="accent-input"
            style={{ width: '100%', paddingLeft: 32 }}
            disabled
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
            }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* Three-column grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          gap: 14,
          minHeight: 0,
          transition: 'grid-template-columns 220ms ease',
        }}
      >
        <ActiveProtocolsPanel
          expanded={focusKind === 'tasks'}
          collapsed={focusKind !== null && focusKind !== 'tasks'}
        />
        <ContextDirectivesPanel
          expanded={focusKind === 'notes'}
          collapsed={focusKind !== null && focusKind !== 'notes'}
        />
        <AgentInsightsPanel
          expanded={focusKind === 'insights'}
          collapsed={focusKind !== null && focusKind !== 'insights'}
        />
      </div>
    </div>
  );
}
