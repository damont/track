import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, getLastProject } from './context/AppContext';
import { TaskProvider } from './context/TaskContext';
import { NoteProvider } from './context/NoteContext';
import { InsightProvider } from './context/InsightContext';
import { AuthPage } from './components/auth/AuthPage';
import { AppLayout } from './components/layout/AppLayout';
import { Workbench } from './components/workbench/Workbench';
import { UserProfile } from './components/UserProfile';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/agent-auth'];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function RootRedirect() {
  const last = getLastProject();
  return <Navigate to={last ? `/projects/${last}` : '/projects'} replace />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}
      >
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}
      >
        Loading…
      </div>
    );
  }
  if (isAuthenticated) {
    const last = getLastProject();
    return <Navigate to={last ? `/projects/${last}` : '/projects'} replace />;
  }
  return <>{children}</>;
}

function AuthedShell({ children }: { children: React.ReactNode }) {
  return (
    <TaskProvider>
      <NoteProvider>
        <InsightProvider>
          <AppLayout>{children}</AppLayout>
        </InsightProvider>
      </NoteProvider>
    </TaskProvider>
  );
}

function LandingWatcher() {
  // If user lands directly on /login etc. but is authenticated, redirect is handled.
  // No-op component placeholder reserved for future hooks.
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated && isAuthPath(location.pathname)) {
      const last = getLastProject();
      navigate(last ? `/projects/${last}` : '/projects', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);
  return null;
}

function AppContent() {
  return (
    <AppProvider>
      <LandingWatcher />
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Auth routes */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/agent-auth"
          element={
            <RedirectIfAuthed>
              <AuthPage />
            </RedirectIfAuthed>
          }
        />

        {/* Authenticated shell */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <AuthedShell>
                <UserProfile />
              </AuthedShell>
            </RequireAuth>
          }
        />
        <Route
          path="/projects"
          element={
            <RequireAuth>
              <AuthedShell>
                <Workbench />
              </AuthedShell>
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <RequireAuth>
              <AuthedShell>
                <Workbench />
              </AuthedShell>
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:projectId/tasks/:taskId"
          element={
            <RequireAuth>
              <AuthedShell>
                <Workbench />
              </AuthedShell>
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:projectId/notes/:noteId"
          element={
            <RequireAuth>
              <AuthedShell>
                <Workbench />
              </AuthedShell>
            </RequireAuth>
          }
        />
        <Route
          path="/projects/:projectId/insights/:insightId"
          element={
            <RequireAuth>
              <AuthedShell>
                <Workbench />
              </AuthedShell>
            </RequireAuth>
          }
        />

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
