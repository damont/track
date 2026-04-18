import { useState } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useApp } from '../../context/AppContext';

export function NoteList() {
  const { notes, selectedNote, createNote, updateNote, deleteNote, isLoading } = useNotes();
  const { selectedProjectId, openNote } = useApp();

  const [newNoteContent, setNewNoteContent] = useState('');

  const handleCreateNote = async () => {
    if (!newNoteContent.trim() || !selectedProjectId) return;
    const note = await createNote(newNoteContent, selectedProjectId);
    setNewNoteContent('');
    openNote(note.id, selectedProjectId);
  };

  const handleTogglePin = async (e: React.MouseEvent, noteId: string, currentPinned: boolean) => {
    e.stopPropagation();
    await updateNote(noteId, { pinned: !currentPinned });
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    await deleteNote(noteId);
  };

  const getPreview = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 80 ? firstLine.substring(0, 80) + '…' : firstLine;
  };

  return (
    <div className="h-full flex flex-col" style={{ gap: 10 }}>
      <div className="flex-1 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {isLoading ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
        ) : notes.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No directives yet.
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNote?.id === note.id;
            return (
              <div
                key={note.id}
                onClick={() => selectedProjectId && openNote(note.id, selectedProjectId)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--panel-border)'}`,
                  background: isSelected ? 'var(--accent-soft)' : 'rgba(13, 18, 38, 0.55)',
                  boxShadow: isSelected ? 'var(--accent-glow)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getPreview(note.content)}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                    {note.pinned && <span className="chip" style={{ fontSize: 9, padding: '1px 6px' }}>Pinned</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={(e) => handleTogglePin(e, note.id, note.pinned)}
                    title={note.pinned ? 'Unpin' : 'Pin'}
                    style={{
                      padding: 4,
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      color: note.pinned ? 'var(--accent)' : 'var(--text-faint)',
                      cursor: 'pointer',
                    }}
                  >
                    <svg className="w-4 h-4" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    title="Delete"
                    style={{
                      padding: 4,
                      borderRadius: 6,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-faint)',
                      cursor: 'pointer',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Document new thesis…"
          className="accent-input"
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateNote();
          }}
          disabled={!selectedProjectId}
        />
        <button
          onClick={handleCreateNote}
          className="pill-tab is-active"
          style={{ padding: '6px 14px' }}
          disabled={!selectedProjectId || !newNoteContent.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}
