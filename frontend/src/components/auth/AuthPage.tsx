import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const goToLogin = () => navigate('/login');

  if (location.pathname.startsWith('/reset-password/') && params.token) {
    return <ResetPassword token={params.token} onBackToLogin={goToLogin} />;
  }
  if (location.pathname === '/forgot-password') {
    return <ForgotPassword onBack={goToLogin} />;
  }
  if (location.pathname === '/register') {
    return <Register onSwitchToLogin={goToLogin} />;
  }

  return (
    <Login
      onSwitchToRegister={() => navigate('/register')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  );
}
