import { ReactNode } from 'react';
import { ProjectRail } from './ProjectRail';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ height: '100vh', overflow: 'hidden' }}>
      <ProjectRail />
      <main className="flex-1 overflow-hidden" style={{ padding: '18px 18px 18px 0' }}>
        {children}
      </main>
    </div>
  );
}
