import { useApp } from '../../context/AppContext';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';

interface MobileTopBarProps {
  onOpenDrawer: () => void;
}

export function MobileTopBar({ onOpenDrawer }: MobileTopBarProps) {
  const { selectedProjectId, isProfile, openProfile, focusId, closeFocus } = useApp();
  const { projects } = useTasks();
  const { user } = useAuth();

  const project = projects.find((p) => p.id === selectedProjectId) || null;

  const title = isProfile
    ? 'Profile'
    : project
    ? project.name
    : 'Track';

  const showBack = focusId !== null;

  return (
    <header
      style={{
        flex: '0 0 auto',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px',
        background: 'rgba(5, 6, 13, 0.85)',
        borderBottom: '1px solid var(--panel-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <button
        type="button"
        aria-label={showBack ? 'Back' : 'Open menu'}
        onClick={showBack ? closeFocus : onOpenDrawer}
        style={iconBtnStyle}
      >
        {showBack ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {project && !isProfile && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 9999,
              background: project.color || 'var(--accent)',
              boxShadow: `0 0 8px ${project.color || 'rgba(60,194,255,0.7)'}`,
              flex: '0 0 auto',
            }}
          />
        )}
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: 17,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>

      <button
        type="button"
        aria-label="Profile"
        onClick={openProfile}
        style={{
          ...iconBtnStyle,
          color: isProfile ? 'var(--accent)' : 'var(--text-secondary)',
        }}
        title={user?.name || 'Profile'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      </button>
    </header>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
