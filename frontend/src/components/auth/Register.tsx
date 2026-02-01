import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export function Register({ onSwitchToLogin }: RegisterProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, username, password, displayName || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <div>
          <h2 className="text-center text-3xl font-bold" style={{ color: 'var(--accent)' }}>
            Track
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded" style={{ backgroundColor: 'rgba(200, 100, 100, 0.12)', border: '1px solid rgba(200, 100, 100, 0.25)', color: '#c06464' }}>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Display Name (optional)
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
