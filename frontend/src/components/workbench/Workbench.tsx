import { useMemo } from 'react';
import { useApp, TabKind } from '../../context/AppContext';
import { useTasks } from '../../context/TaskContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ActiveProtocolsPanel } from './ActiveProtocolsPanel';
import { ContextDirectivesPanel } from './ContextDirectivesPanel';
import { AgentInsightsPanel } from './AgentInsightsPanel';

export function Workbench() {
  const { selectedProjectId, focusKind, activeTab, openProject, openTab, closeFocus } = useApp();
  const { projects } = useTasks();
  const isMobile = useIsMobile();

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

  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <MobileTabBar active={activeTab} onSelect={(t) => openTab(t)} />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {activeTab === 'tasks' && <ActiveProtocolsPanel expanded collapsed={false} />}
          {activeTab === 'notes' && <ContextDirectivesPanel expanded collapsed={false} />}
          {activeTab === 'insights' && <AgentInsightsPanel expanded collapsed={false} />}
        </div>
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

interface MobileTabBarProps {
  active: TabKind;
  onSelect: (tab: TabKind) => void;
}

function MobileTabBar({ active, onSelect }: MobileTabBarProps) {
  const tabs: { key: TabKind; label: string }[] = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'notes', label: 'Notes' },
    { key: 'insights', label: 'Insights' },
  ];
  return (
    <div
      role="tablist"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4,
        padding: 4,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--panel-border)',
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(t.key)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? '#03040a' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: isActive ? 'var(--accent-glow)' : 'none',
              transition: 'background 120ms, color 120ms',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
