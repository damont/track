import { useMemo } from 'react';
import { useInsights } from '../../context/InsightContext';
import { useTasks } from '../../context/TaskContext';
import { useNotes } from '../../context/NoteContext';
import { useApp } from '../../context/AppContext';
import { AgentInsight } from '../../types';

interface PanelProps {
  expanded: boolean;
  collapsed: boolean;
}

function relativeTime(ts: string) {
  const d = new Date(ts).getTime();
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function InsightCard({
  insight,
  detailed,
  onOpen,
  onDismiss,
  onOpenTask,
  onOpenNote,
  taskLabels,
  noteLabels,
}: {
  insight: AgentInsight;
  detailed: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  onOpenTask: (id: string) => void;
  onOpenNote: (id: string) => void;
  taskLabels: Record<string, string>;
  noteLabels: Record<string, string>;
}) {
  return (
    <div className="insight-card" onClick={!detailed ? onOpen : undefined} style={{ cursor: detailed ? 'default' : 'pointer' }}>
      <div className="insight-card-badge">{insight.kind}</div>
      <div style={{ fontSize: detailed ? 16 : 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        {insight.title}
      </div>
      <div style={{ fontSize: detailed ? 13 : 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
        {insight.body}
      </div>

      {(insight.linked_task_ids.length > 0 || insight.linked_note_ids.length > 0) && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {insight.linked_task_ids.map((tid) => (
            <button
              key={tid}
              type="button"
              className="chip"
              style={{ padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenTask(tid);
              }}
            >
              Task · {taskLabels[tid] || tid.slice(-6)}
            </button>
          ))}
          {insight.linked_note_ids.map((nid) => (
            <button
              key={nid}
              type="button"
              className="chip chip-gold"
              style={{ padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenNote(nid);
              }}
            >
              Note · {noteLabels[nid] || nid.slice(-6)}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
          {insight.agent_name ? `${insight.agent_name} · ` : ''}{relativeTime(insight.created_at)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          style={{ fontSize: 10, background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function AgentInsightsPanel({ expanded, collapsed }: PanelProps) {
  const { insights, selectedInsight, isLoading, lastSyncedAt, refresh, dismiss } = useInsights();
  const { tasks } = useTasks();
  const { notes } = useNotes();
  const { openInsight, openTask, openNote, closeFocus, selectedProjectId } = useApp();

  const synced = useMemo(() => (lastSyncedAt ? Date.now() - lastSyncedAt < 60_000 : false), [lastSyncedAt]);
  const taskLabels = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, t.name])),
    [tasks]
  );
  const noteLabels = useMemo(
    () =>
      Object.fromEntries(
        notes.map((n) => [n.id, (n.content.split('\n')[0] || '').slice(0, 24) || 'Note'])
      ),
    [notes]
  );

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="section-label" style={{ color: 'var(--agent-gold)' }}>
          Agent Insights
        </div>
        <span className="chip chip-gold" style={{ padding: '3px 8px' }}>
          <span className="glow-dot-gold" />
          {synced ? 'Synced' : 'Idle'}
        </span>
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
        title="Expand Agent Insights"
        style={{
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'stretch',
          cursor: 'pointer',
          textAlign: 'left',
          overflow: 'hidden',
        }}
      >
        {header}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          {insights.slice(0, 3).map((i) => (
            <div
              key={i.id}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedProjectId) openInsight(i.id, selectedProjectId);
              }}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                marginBottom: 4,
                background: 'rgba(244,196,106,0.06)',
                border: '1px dashed rgba(244,196,106,0.35)',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {i.title}
            </div>
          ))}
          {insights.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>No insights.</div>
          )}
        </div>
      </button>
    );
  }

  const list = expanded && selectedInsight ? [selectedInsight] : insights;

  return (
    <div className="glass-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {header}

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {expanded && selectedInsight === null ? 'Insight not found.' : 'No insights yet. Agents will post here.'}
          </div>
        ) : (
          list.map((i) => (
            <InsightCard
              key={i.id}
              insight={i}
              detailed={expanded && selectedInsight?.id === i.id}
              onOpen={() => selectedProjectId && openInsight(i.id, selectedProjectId)}
              onDismiss={async () => {
                await dismiss(i.id);
                if (expanded && selectedInsight?.id === i.id) closeFocus();
              }}
              onOpenTask={(tid) => selectedProjectId && openTask(tid, selectedProjectId)}
              onOpenNote={(nid) => selectedProjectId && openNote(nid, selectedProjectId)}
              taskLabels={taskLabels}
              noteLabels={noteLabels}
            />
          ))
        )}
      </div>

      {!expanded && (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="ghost-btn ghost-btn-gold" style={{ width: '100%' }} onClick={() => refresh()}>
            <span style={{ fontSize: 14 }}>↻</span> Refresh Insights
          </button>
        </div>
      )}
    </div>
  );
}
