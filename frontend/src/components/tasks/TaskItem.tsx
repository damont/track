import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskListItem } from '../../types';

interface TaskItemProps {
  task: TaskListItem;
  isSelected: boolean;
  onSelect: () => void;
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function TaskItem({ task, isSelected, onSelect }: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`protocol-card ${isSelected ? 'is-selected' : ''}`}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab"
          style={{ color: 'var(--text-faint)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name}
          </div>

          {task.next_step_description ? (
            <div
              style={{
                marginTop: 6,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'rgba(60, 194, 255, 0.08)',
                border: '1px solid var(--panel-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="glow-dot" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.next_step_description}
              </span>
            </div>
          ) : task.description ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </p>
          ) : null}

          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 9999,
                color: 'var(--text-secondary)',
                border: '1px solid var(--panel-border)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {statusLabels[task.current_status.status] || task.current_status.status}
            </span>
            {task.step_count > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {task.completed_step_count}/{task.step_count} steps
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
