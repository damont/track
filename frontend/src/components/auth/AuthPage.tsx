import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { AgentAuth } from './AgentAuth';

type AuthMode = 'login' | 'register' | 'agent';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'register') {
    return <Register onSwitchToLogin={() => setMode('login')} />;
  }

  if (mode === 'agent') {
    return <AgentAuth onSwitchToLogin={() => setMode('login')} />;
  }

  return (
    <Login
      onSwitchToRegister={() => setMode('register')}
      onSwitchToAgent={() => setMode('agent')}
    />
  );
}
