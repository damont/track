import { useState, FormEvent } from 'react';
import { api } from '../../api/client';

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="max-w-md w-full space-y-8 p-8 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div>
            <h2 className="text-center text-3xl font-bold" style={{ color: 'var(--accent)' }}>
              Track
            </h2>
            <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              If an account with that email exists, we've sent a password reset link. Check your inbox.
            </p>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <div>
          <h2 className="text-center text-3xl font-bold" style={{ color: 'var(--accent)' }}>
            Track
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Reset your password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded" style={{ backgroundColor: 'rgba(200, 100, 100, 0.12)', border: '1px solid rgba(200, 100, 100, 0.25)', color: '#c06464' }}>
              {error}
            </div>
          )}
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Enter your email address"
            />
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
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
