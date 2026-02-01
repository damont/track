import { StatusEntry, TaskStatus } from '../../types';

interface StatusHistoryProps {
  statusHistory: StatusEntry[];
  currentStatus: StatusEntry;
}

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  pending: { bg: 'rgba(148, 153, 165, 0.15)', text: '#8b8fa0' },
  in_progress: { bg: 'rgba(108, 138, 236, 0.15)', text: '#6c8aec' },
  on_hold: { bg: 'rgba(214, 174, 82, 0.15)', text: '#c9a84c' },
  completed: { bg: 'rgba(82, 184, 120, 0.15)', text: '#52b878' },
  cancelled: { bg: 'rgba(200, 100, 100, 0.15)', text: '#c06464' },
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDuration(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diffMs = endDate.getTime() - startDate.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  const minutes = Math.floor(diffMs / (1000 * 60));
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StatusHistory({ statusHistory, currentStatus }: StatusHistoryProps) {
  const allStatuses = [...statusHistory, currentStatus];

  // Calculate total time in each status
  const timeByStatus: Record<TaskStatus, number> = {
    pending: 0,
    in_progress: 0,
    on_hold: 0,
    completed: 0,
    cancelled: 0,
  };

  allStatuses.forEach((entry) => {
    const start = new Date(entry.active_at);
    const end = entry.inactive_at ? new Date(entry.inactive_at) : new Date();
    timeByStatus[entry.status] += end.getTime() - start.getTime();
  });

  const formatTotalTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(ms / (1000 * 60))}m`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status History</h3>

      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(timeByStatus)
          .filter(([, time]) => time > 0)
          .map(([status, time]) => {
            const colors = statusColors[status as TaskStatus];
            return (
              <div
                key={status}
                className="px-2 py-1 rounded text-xs"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {statusLabels[status as TaskStatus]}: {formatTotalTime(time)}
              </div>
            );
          })}
      </div>

      {/* Timeline */}
      <div className="relative pl-4 space-y-4" style={{ borderLeft: '2px solid var(--border-color)' }}>
        {allStatuses.map((entry, index) => {
          const colors = statusColors[entry.status];
          return (
            <div key={entry.id} className="relative">
              <div
                className="absolute -left-[9px] w-4 h-4 rounded-full"
                style={{
                  backgroundColor: colors.text,
                  border: '2px solid var(--bg-surface)',
                }}
              />
              <div className="ml-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {statusLabels[entry.status]}
                  </span>
                  {index === allStatuses.length - 1 && (
                    <span className="text-xs" style={{ color: 'var(--accent)' }}>(Current)</span>
                  )}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(entry.active_at)}
                  {entry.inactive_at && (
                    <> - {formatDate(entry.inactive_at)}</>
                  )}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Duration: {formatDuration(entry.active_at, entry.inactive_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
