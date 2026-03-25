import { useState, useEffect } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/reset-password\/(.+)$/);
    if (match) {
      setResetToken(match[1]);
      setMode('reset-password');
    } else if (path === '/forgot-password') {
      setMode('forgot-password');
    }
  }, []);

  const goToLogin = () => {
    window.history.pushState({}, '', '/');
    setMode('login');
  };

  if (mode === 'reset-password' && resetToken) {
    return <ResetPassword token={resetToken} onBackToLogin={goToLogin} />;
  }

  if (mode === 'forgot-password') {
    return <ForgotPassword onBack={goToLogin} />;
  }

  if (mode === 'register') {
    return <Register onSwitchToLogin={() => setMode('login')} />;
  }

  return (
    <Login
      onSwitchToRegister={() => setMode('register')}
      onForgotPassword={() => {
        window.history.pushState({}, '', '/forgot-password');
        setMode('forgot-password');
      }}
    />
  );
}
