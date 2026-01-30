import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AppLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--accent)' }}>Track</h1>
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
