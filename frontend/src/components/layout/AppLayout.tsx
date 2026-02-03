import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppTab } from '../../App';

interface AppLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function AppLayout({ sidebar, children, activeTab, onTabChange }: AppLayoutProps) {
  const { user, logout } = useAuth();

  const tabStyle = (tab: AppTab) => ({
    backgroundColor: activeTab === tab ? 'var(--selected-bg)' : 'transparent',
    color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                <rect x="2" y="2" width="28" height="28" rx="6" stroke="var(--accent)" strokeWidth="2.5"/>
                <path d="M9 16.5L14 21.5L23 11" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--accent)' }}>Track</h1>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={() => onTabChange('tasks')}
                className="px-4 py-1.5 text-sm font-medium rounded-t"
                style={tabStyle('tasks')}
              >
                Tasks
              </button>
              <button
                onClick={() => onTabChange('scratchpad')}
                className="px-4 py-1.5 text-sm font-medium rounded-t"
                style={tabStyle('scratchpad')}
              >
                Scratchpad
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user?.display_name || user?.username}
            </span>
            <button
              onClick={logout}
              className="text-sm hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 overflow-y-auto" style={{ backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)' }}>
          {sidebar}
        </aside>

        {/* Main panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
