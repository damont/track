import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ProjectRail } from './ProjectRail';
import { MobileTopBar } from './MobileTopBar';
import { useIsMobile } from '../../hooks/useIsMobile';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  if (!isMobile) {
    return (
      <div className="min-h-screen flex" style={{ height: '100vh', overflow: 'hidden' }}>
        <ProjectRail />
        <main className="flex-1 overflow-hidden" style={{ padding: '18px 18px 18px 0' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MobileTopBar onOpenDrawer={() => setDrawerOpen(true)} />
      <main style={{ flex: 1, minHeight: 0, padding: '12px', overflow: 'hidden' }}>
        {children}
      </main>

      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              zIndex: 40,
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '85%',
              maxWidth: 320,
              zIndex: 50,
              boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
            }}
          >
            <ProjectRail onNavigate={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
