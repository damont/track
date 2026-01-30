import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskListItem } from '../../types';
import { useTasks } from '../../context/TaskContext';

interface TaskItemProps {
  task: TaskListItem;
  isSelected: boolean;
  onSelect: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(156, 163, 175, 0.2)', text: '#9ca3af' },
  in_progress: { bg: 'rgba(96, 165, 250, 0.2)', text: '#60a5fa' },
  on_hold: { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
  completed: { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
  cancelled: { bg: 'rgba(248, 113, 113, 0.2)', text: '#f87171' },
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function TaskItem({ task, isSelected, onSelect }: TaskItemProps) {
  const { categories } = useTasks();
  const category = categories.find(c => c.id === task.category_id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColor = statusColors[task.current_status.status] || statusColors.pending;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: isSelected ? 'var(--selected-bg)' : 'transparent',
        borderLeft: isSelected ? '4px solid var(--accent)' : '4px solid transparent',
      }}
      className="p-3 cursor-pointer"
      onClick={onSelect}
      onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-raised)'; }}
      onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab"
          style={{ color: 'var(--text-muted)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.name}</span>
          </div>

          {task.next_step_description ? (
            <div
              className="flex items-center gap-2 mt-1.5 px-2.5 py-1.5 rounded"
              style={{ backgroundColor: 'rgba(233, 84, 32, 0.12)', border: '1px solid rgba(233, 84, 32, 0.25)' }}
            >
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {task.next_step_description}
              </span>
            </div>
          ) : task.description ? (
            <p className="text-sm truncate mt-1" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
          ) : null}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
            >
              {statusLabels[task.current_status.status]}
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

            {task.step_count > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {task.completed_step_count}/{task.step_count} steps
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
