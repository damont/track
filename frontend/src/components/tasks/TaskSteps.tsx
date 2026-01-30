import { useState } from 'react';
import { Step } from '../../types';
import { useTasks } from '../../context/TaskContext';

interface TaskStepsProps {
  taskId: string;
  steps: Step[];
}

export function TaskSteps({ taskId, steps }: TaskStepsProps) {
  const { addStep, updateStep, deleteStep } = useTasks();
  const [newStepText, setNewStepText] = useState('');
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  const handleAddStep = async () => {
    if (!newStepText.trim()) return;
    await addStep(taskId, newStepText);
    setNewStepText('');
  };

  const handleToggleComplete = async (step: Step) => {
    await updateStep(taskId, step.id, { completed: !step.completed });
  };

  const startEditing = (step: Step) => {
    setEditingStep(step.id);
    setEditText(step.description);
  };

  const saveEdit = async (stepId: string) => {
    if (!editText.trim()) return;
    await updateStep(taskId, stepId, { description: editText });
    setEditingStep(null);
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-raised)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Steps</h3>

      <div className="space-y-2">
        {sortedSteps.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-2 p-2 rounded"
            style={{
              backgroundColor: step.completed ? 'var(--bg-main)' : 'var(--bg-raised)',
            }}
          >
            <input
              type="checkbox"
              checked={step.completed}
              onChange={() => handleToggleComplete(step)}
              className="mt-1 accent-[var(--accent)]"
            />

            {editingStep === step.id ? (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 px-2 py-1 rounded text-sm focus:outline-none"
                  style={inputStyle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(step.id);
                    if (e.key === 'Escape') setEditingStep(null);
                  }}
                  autoFocus
                />
                <button
                  onClick={() => saveEdit(step.id)}
                  className="text-sm"
                  style={{ color: 'var(--accent)' }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-start justify-between group">
                <span
                  className={`text-sm cursor-pointer ${step.completed ? 'line-through' : ''}`}
                  style={{ color: step.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}
                  onClick={() => startEditing(step)}
                >
                  {step.description}
                </span>
                <button
                  onClick={() => deleteStep(taskId, step.id)}
                  className="opacity-0 group-hover:opacity-100"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newStepText}
          onChange={(e) => setNewStepText(e.target.value)}
          placeholder="Add a step..."
          className="flex-1 px-3 py-2 rounded text-sm focus:outline-none"
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddStep();
          }}
        />
        <button
          onClick={handleAddStep}
          className="px-3 py-2 rounded text-sm text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
