import { useState, useEffect } from 'react';
import { useTasks } from '../../context/TaskContext';
import { TaskStatus } from '../../types';
import { TaskSteps } from './TaskSteps';
import { TaskResearch } from './TaskResearch';
import { StatusHistory } from './StatusHistory';

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function TaskDetail() {
  const {
    selectedTask,
    categories,
    updateTask,
    deleteTask,
    updateTaskStatus,
    completeTask,
    reactivateTask,
    selectTask,
  } = useTasks();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [showStatusHistory, setShowStatusHistory] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setEditName(selectedTask.name);
      setEditDescription(selectedTask.description || '');
      setEditNotes(selectedTask.notes || '');
      setEditCategoryId(selectedTask.category_id || '');
    }
  }, [selectedTask]);

  if (!selectedTask) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        Select a task to view details
      </div>
    );
  }

  const handleSave = async () => {
    await updateTask(selectedTask.id, {
      name: editName,
      description: editDescription || undefined,
      notes: editNotes || undefined,
      category_id: editCategoryId || undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(selectedTask.id);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (status === 'completed') {
      await completeTask(selectedTask.id);
    } else if (selectedTask.completed_at) {
      await reactivateTask(selectedTask.id);
      await updateTaskStatus(selectedTask.id, status);
    } else {
      await updateTaskStatus(selectedTask.id, status);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-lg p-6 space-y-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div className="flex items-start justify-between">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-2xl font-bold w-full focus:outline-none"
              style={{ ...inputStyle, borderWidth: '0 0 2px 0', borderBottomColor: 'var(--accent)', backgroundColor: 'transparent' }}
            />
          ) : (
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTask.name}</h2>
          )}

          <div className="flex gap-2 ml-4 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm"
                  style={{ color: '#f87171' }}
                >
                  Delete
                </button>
                <button
                  onClick={() => selectTask(null)}
                  className="px-3 py-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status and Category */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Status
            </label>
            <select
              value={selectedTask.current_status.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="px-3 py-2 rounded text-sm focus:outline-none"
              style={inputStyle}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Category
            </label>
            {isEditing ? (
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
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
            ) : (
              <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {categories.find((c) => c.id === selectedTask.category_id)?.name || 'None'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Created
            </label>
            <div className="px-3 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {new Date(selectedTask.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Description
          </label>
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded text-sm focus:outline-none"
              style={inputStyle}
              placeholder="Add a description..."
            />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {selectedTask.description || 'No description'}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Notes
          </label>
          {isEditing ? (
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded text-sm focus:outline-none"
              style={inputStyle}
              placeholder="Add notes..."
            />
          ) : (
            <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {selectedTask.notes || 'No notes'}
            </div>
          )}
        </div>

        {/* Steps */}
        <TaskSteps taskId={selectedTask.id} steps={selectedTask.next_steps} />

        {/* Research */}
        <TaskResearch taskId={selectedTask.id} research={selectedTask.research} />

        {/* Status History */}
        <div>
          <button
            onClick={() => setShowStatusHistory(!showStatusHistory)}
            className="text-sm hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {showStatusHistory ? 'Hide' : 'Show'} Status History
          </button>
          {showStatusHistory && (
            <div className="mt-3">
              <StatusHistory
                statusHistory={selectedTask.status_history}
                currentStatus={selectedTask.current_status}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
