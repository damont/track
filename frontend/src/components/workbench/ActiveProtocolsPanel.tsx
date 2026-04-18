import { useTasks } from '../../context/TaskContext';
import { useApp } from '../../context/AppContext';
import { TaskList } from '../tasks/TaskList';
import { TaskDetail } from '../tasks/TaskDetail';

interface PanelProps {
  expanded: boolean;
  collapsed: boolean;
}

export function ActiveProtocolsPanel({ expanded, collapsed }: PanelProps) {
  const { tasks, selectedTask } = useTasks();
  const { closeFocus, selectedProjectId, openTask } = useApp();

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div className="section-label">Active Protocols</div>
        <span className="glow-dot" />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tasks.length}</span>
      </div>
      {expanded && (
        <button
          type="button"
          className="pill-tab"
          onClick={() => closeFocus()}
          style={{ padding: '3px 10px', fontSize: 11 }}
        >
          ← Back
        </button>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <button
        type="button"
        className="glass-panel"
        onClick={() => closeFocus()}
        title="Expand Active Protocols"
        style={{
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'stretch',
          cursor: 'pointer',
          textAlign: 'left',
          overflow: 'hidden',
        }}
      >
        {header}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {tasks.slice(0, 4).map((t) => (
            <div
              key={t.id}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedProjectId) openTask(t.id, selectedProjectId);
              }}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                marginBottom: 4,
                background: 'rgba(13, 18, 38, 0.55)',
                border: '1px solid var(--panel-border)',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {t.name}
            </div>
          ))}
          {tasks.length > 4 && (
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>
              +{tasks.length - 4} more
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {header}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {expanded && selectedTask ? <TaskDetail /> : <TaskList />}
      </div>
    </div>
  );
}
