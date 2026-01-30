import { useState } from 'react';
import { ResearchReference } from '../../types';
import { useTasks } from '../../context/TaskContext';

interface TaskResearchProps {
  taskId: string;
  research: ResearchReference[];
}

export function TaskResearch({ taskId, research }: TaskResearchProps) {
  const { addResearch, updateResearch, deleteResearch } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', url: '', notes: '' });

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addResearch(taskId, {
      title: newTitle,
      url: newUrl || undefined,
      notes: newNotes || undefined,
    });
    setNewTitle('');
    setNewUrl('');
    setNewNotes('');
    setShowAdd(false);
  };

  const startEditing = (ref: ResearchReference) => {
    setEditingRef(ref.id);
    setEditData({
      title: ref.title,
      url: ref.url || '',
      notes: ref.notes || '',
    });
  };

  const saveEdit = async (refId: string) => {
    await updateResearch(taskId, refId, {
      title: editData.title,
      url: editData.url || undefined,
      notes: editData.notes || undefined,
    });
    setEditingRef(null);
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Research</h3>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            + Add
          </button>
        )}
      </div>

      <div className="space-y-3">
        {research.map((ref) => (
          <div key={ref.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-raised)' }}>
            {editingRef === ref.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Title"
                  className="w-full px-2 py-1 rounded text-sm focus:outline-none"
                  style={inputStyle}
                />
                <input
                  type="url"
                  value={editData.url}
                  onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                  placeholder="URL (optional)"
                  className="w-full px-2 py-1 rounded text-sm focus:outline-none"
                  style={inputStyle}
                />
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full px-2 py-1 rounded text-sm focus:outline-none"
                  style={inputStyle}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(ref.id)}
                    className="px-3 py-1 rounded text-sm text-white"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingRef(null)}
                    className="px-3 py-1 text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {ref.title}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-primary)' }}>{ref.title}</span>
                      )}
                    </div>
                    {ref.notes && (
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{ref.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => startEditing(ref)}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteResearch(taskId, ref.id)}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--bg-raised)' }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-2 py-1 rounded text-sm focus:outline-none"
            style={inputStyle}
            autoFocus
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL (optional)"
            className="w-full px-2 py-1 rounded text-sm focus:outline-none"
            style={inputStyle}
          />
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full px-2 py-1 rounded text-sm focus:outline-none"
            style={inputStyle}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-3 py-1 rounded text-sm text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
