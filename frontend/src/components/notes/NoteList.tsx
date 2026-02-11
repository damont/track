import { useState } from 'react';
import { useNotes } from '../../context/NoteContext';

export function NoteList() {
  const {
    notes,
    projects,
    selectedNote,
    selectNote,
    createNote,
    updateNote,
    deleteNote,
    filter,
    setFilter,
    createProject,
    deleteProject,
    isLoading,
  } = useNotes();

  const [newNoteContent, setNewNoteContent] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6c8aec');

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    await createNote(newNoteContent, filter.projectId || undefined);
    setNewNoteContent('');
  };

  const handleTogglePin = async (e: React.MouseEvent, noteId: string, currentPinned: boolean) => {
    e.stopPropagation();
    await updateNote(noteId, { pinned: !currentPinned });
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    await deleteNote(noteId);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await createProject({ name: newProjectName, color: newProjectColor });
    setNewProjectName('');
    setShowNewProject(false);
  };

  const getPreview = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Project filter */}
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
            <option value="">All Notes</option>
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

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>No notes yet</div>
        ) : (
          notes.map((note) => {
            const project = projects.find(p => p.id === note.project_id);
            return (
              <div
                key={note.id}
                className="p-3 cursor-pointer"
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: selectedNote?.id === note.id ? 'var(--selected-bg)' : 'transparent',
                  borderLeft: selectedNote?.id === note.id ? '4px solid var(--accent)' : '4px solid transparent',
                }}
                onClick={() => selectNote(note.id)}
                onMouseOver={(e) => {
                  if (selectedNote?.id !== note.id) e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
                }}
                onMouseOut={(e) => {
                  if (selectedNote?.id !== note.id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                        {getPreview(note.content)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                      {project && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: project.color ? `${project.color}30` : 'var(--bg-raised)',
                            color: project.color || 'var(--text-secondary)',
                          }}
                        >
                          {project.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Pin toggle */}
                    <button
                      onClick={(e) => handleTogglePin(e, note.id, note.pinned)}
                      className="p-1 rounded"
                      style={{ color: note.pinned ? 'var(--accent)' : 'var(--text-muted)' }}
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      <svg className="w-4 h-4" fill={note.pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      className="p-1 rounded"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick-add */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Jot something down..."
            className="flex-1 px-3 py-2 rounded text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateNote();
            }}
          />
          <button
            onClick={handleCreateNote}
            className="px-3 py-2 rounded text-sm text-white flex-shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
