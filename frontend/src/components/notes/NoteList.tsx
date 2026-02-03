import { useState } from 'react';
import { useNotes } from '../../context/NoteContext';

export function NoteList() {
  const {
    notes,
    categories,
    selectedNote,
    selectNote,
    createNote,
    updateNote,
    deleteNote,
    filter,
    setFilter,
    createCategory,
    deleteCategory,
    isLoading,
  } = useNotes();

  const [newNoteContent, setNewNoteContent] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6c8aec');

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    await createNote(newNoteContent, filter.categoryId || undefined);
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory({ name: newCategoryName, color: newCategoryColor });
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const getPreview = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Category filter */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <select
            value={filter.categoryId || ''}
            onChange={(e) => setFilter({ categoryId: e.target.value || null })}
            className="flex-1 px-3 py-1.5 rounded text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Notes</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewCategory(!showNewCategory)}
            className="px-2 py-1.5 rounded text-sm font-medium whitespace-nowrap"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            title="Add category"
          >
            {categories.length === 0 ? '+ Category' : '+'}
          </button>

          {filter.categoryId && (
            <button
              onClick={() => {
                if (confirm('Delete this category?')) {
                  deleteCategory(filter.categoryId!);
                  setFilter({ categoryId: null });
                }
              }}
              className="px-2 py-1.5 rounded text-sm"
              style={{ color: 'var(--text-muted)' }}
              title="Delete selected category"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {showNewCategory && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full px-3 py-1.5 rounded text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-raised)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCategory();
                if (e.key === 'Escape') setShowNewCategory(false);
              }}
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <button
                onClick={handleCreateCategory}
                className="flex-1 px-3 py-1 rounded text-sm text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Add
              </button>
              <button
                onClick={() => setShowNewCategory(false)}
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
            const category = categories.find(c => c.id === note.category_id);
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
                      {category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: category.color ? `${category.color}30` : 'var(--bg-raised)',
                            color: category.color || 'var(--text-secondary)',
                          }}
                        >
                          {category.name}
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
