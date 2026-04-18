import { useNotes } from '../../context/NoteContext';
import { useApp } from '../../context/AppContext';
import { NoteList } from '../notes/NoteList';
import { NoteDetail } from '../notes/NoteDetail';

interface PanelProps {
  expanded: boolean;
  collapsed: boolean;
}

export function ContextDirectivesPanel({ expanded, collapsed }: PanelProps) {
  const { notes, selectedNote } = useNotes();
  const { closeFocus, selectedProjectId, openNote } = useApp();

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : 14 }}>
      <div className="section-label">Context &amp; Directives</div>
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
        title="Expand Context & Directives"
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
          {notes.slice(0, 4).map((n) => (
            <div
              key={n.id}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedProjectId) openNote(n.id, selectedProjectId);
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
              {n.content.split('\n')[0] || 'Untitled'}
            </div>
          ))}
          {notes.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>No notes.</div>
          )}
          {notes.length > 4 && (
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>
              +{notes.length - 4} more
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
        {expanded && selectedNote ? <NoteDetail /> : <NoteList />}
      </div>
    </div>
  );
}
