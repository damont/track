import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotes } from '../../context/NoteContext';
import { useTasks } from '../../context/TaskContext';
import { api } from '../../api/client';
import { Task, TaskListItem } from '../../types';

interface ToastState {
  message: string;
  visible: boolean;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

export function NoteDetail() {
  const {
    selectedNote,
    categories,
    updateNote,
    deleteNote,
    selectNote,
  } = useNotes();
  const { fetchTasks } = useTasks();

  const [editContent, setEditContent] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<ToolbarPosition>({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [activeTasks, setActiveTasks] = useState<TaskListItem[]>([]);
  const [toast, setToast] = useState<ToastState>({ message: '', visible: false });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedNote) {
      setEditContent(selectedNote.content);
    }
  }, [selectedNote]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (noteId: string, content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        await updateNote(noteId, { content });
      }, 800);
    },
    [updateNote]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleContentChange = (value: string) => {
    setEditContent(value);
    if (selectedNote) {
      debouncedSave(selectedNote.id, value);
    }
  };

  // Save on blur immediately
  const handleBlur = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (selectedNote && editContent !== selectedNote.content) {
      await updateNote(selectedNote.id, { content: editContent });
    }
  };

  // Handle text selection in textarea
  // Note: window.getSelection() doesn't work with textareas —
  // must use selectionStart/selectionEnd instead.
  // Uses fixed positioning so the toolbar never clips under the sidebar.
  const handleTextareaMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const text = textarea.value.substring(start, end).trim();
      if (text) {
        // Use viewport coordinates (fixed positioning)
        // Clamp so toolbar stays fully visible
        const toolbarWidth = 280;
        const toolbarHeight = 40;
        const left = Math.max(toolbarWidth / 2, Math.min(e.clientX, window.innerWidth - toolbarWidth / 2));
        const top = Math.max(toolbarHeight + 8, e.clientY - 50);

        setToolbarPos({ top, left });
        setSelectedText(text);
        setShowToolbar(true);
        return;
      }
    }
    setShowToolbar(false);
    setShowTaskPicker(false);
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  };

  const handleCreateTask = async () => {
    if (!selectedText) return;
    try {
      await api.post<Task>('/api/tasks', { name: selectedText });
      await fetchTasks();
      showToast('Task created!');
      setShowToolbar(false);
      setShowTaskPicker(false);
    } catch {
      showToast('Failed to create task');
    }
  };

  const handleShowAddStep = async () => {
    try {
      const tasks = await api.get<TaskListItem[]>('/api/tasks?active=true');
      setActiveTasks(tasks);
      setShowTaskPicker(true);
    } catch {
      showToast('Failed to fetch tasks');
    }
  };

  const handleAddStep = async (taskId: string, taskName: string) => {
    if (!selectedText) return;
    try {
      await api.post<Task>(`/api/tasks/${taskId}/steps`, { description: selectedText });
      await fetchTasks();
      showToast(`Step added to ${taskName}`);
      setShowToolbar(false);
      setShowTaskPicker(false);
    } catch {
      showToast('Failed to add step');
    }
  };

  // Close toolbar on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
        setShowTaskPicker(false);
      }
    };
    if (showToolbar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showToolbar]);

  if (!selectedNote) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        Select a note to view or edit
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      await deleteNote(selectedNote.id);
    }
  };

  const handleTogglePin = async () => {
    await updateNote(selectedNote.id, { pinned: !selectedNote.pinned });
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div>
      <div className="rounded-lg p-6 space-y-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedNote.content.split('\n')[0].substring(0, 60) || 'Untitled Note'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Pin toggle */}
            <button
              onClick={handleTogglePin}
              className="px-3 py-1 rounded text-sm flex items-center gap-1"
              style={{ color: selectedNote.pinned ? 'var(--accent)' : 'var(--text-secondary)' }}
              title={selectedNote.pinned ? 'Unpin' : 'Pin'}
            >
              <svg className="w-4 h-4" fill={selectedNote.pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {selectedNote.pinned ? 'Pinned' : 'Pin'}
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="px-3 py-1 text-sm"
              style={{ color: '#c06464' }}
            >
              Delete
            </button>

            {/* Close */}
            <button
              onClick={() => selectNote(null)}
              className="px-3 py-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Category
          </label>
          <select
            value={selectedNote.category_id || ''}
            onChange={(e) => updateNote(selectedNote.id, { category_id: e.target.value })}
            className="px-3 py-2 rounded text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content with selection toolbar */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Content
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onBlur={handleBlur}
              onMouseUp={handleTextareaMouseUp}
              rows={16}
              className="w-full px-4 py-3 rounded text-sm focus:outline-none resize-y font-mono"
              style={{
                ...inputStyle,
                lineHeight: '1.6',
                minHeight: '300px',
              }}
              placeholder="Write your thoughts..."
            />

            {/* Selection toolbar — fixed so it floats above everything */}
            {showToolbar && (
              <div
                ref={toolbarRef}
                className="fixed z-50"
                style={{
                  top: `${toolbarPos.top}px`,
                  left: `${toolbarPos.left}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div
                  className="rounded-lg px-2 py-1.5 flex items-center gap-1"
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    backgroundColor: 'var(--bg-raised)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <button
                    onClick={handleCreateTask}
                    className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                    }}
                  >
                    📋 Create Task
                  </button>
                  <button
                    onClick={handleShowAddStep}
                    className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    ➕ Add as Step
                  </button>
                </div>

                {/* Task picker dropdown */}
                {showTaskPicker && (
                  <div
                    className="mt-1 rounded-lg overflow-hidden max-h-48 overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      backgroundColor: 'var(--bg-raised)',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      minWidth: '220px',
                    }}
                  >
                    {activeTasks.length === 0 ? (
                      <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        No active tasks
                      </div>
                    ) : (
                      activeTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleAddStep(task.id, task.name)}
                          className="w-full text-left px-3 py-2 text-xs truncate block"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--selected-bg)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {task.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Created: {new Date(selectedNote.created_at).toLocaleString()}</span>
          <span>Updated: {new Date(selectedNote.updated_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Toast notification */}
      {toast.visible && (
        <div
          className="fixed bottom-6 right-6 px-4 py-2 rounded-lg text-sm font-medium z-50"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'fadeInOut 2.5s ease-in-out',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Toast animation style */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
