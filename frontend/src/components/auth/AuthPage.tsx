import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  if (mode === 'register') {
    return <Register onSwitchToLogin={() => setMode('login')} />;
  }

  return (
    <Login
      onSwitchToRegister={() => setMode('register')}
    />
  );
}
