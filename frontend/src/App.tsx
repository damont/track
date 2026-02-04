import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { TaskProvider } from './context/TaskContext';
import { NoteProvider } from './context/NoteContext';
import { AuthPage } from './components/auth/AuthPage';
import { AppLayout } from './components/layout/AppLayout';
import { TaskList } from './components/tasks/TaskList';
import { TaskDetail } from './components/tasks/TaskDetail';
import { NoteList } from './components/notes/NoteList';
import { NoteDetail } from './components/notes/NoteDetail';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeTab } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const sidebar = activeTab === 'tasks' ? <TaskList /> : <NoteList />;
  const main = activeTab === 'tasks' ? <TaskDetail /> : <NoteDetail />;

  return (
    <TaskProvider>
      <NoteProvider>
        <AppLayout sidebar={sidebar}>
          {main}
        </AppLayout>
      </NoteProvider>
    </TaskProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
