import { useState, FormEvent } from 'react';
import { api } from '../../api/client';

interface AgentAuthProps {
  onSwitchToLogin: () => void;
}

interface TokenResult {
  access_token: string;
  expires_in_days: number;
}

export function AgentAuth({ onSwitchToLogin }: AgentAuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await api.agentToken(username, password, expiresInDays);
      setTokenResult({
        access_token: result.access_token,
        expires_in_days: result.expires_in_days,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!tokenResult) return;
    await navigator.clipboard.writeText(tokenResult.access_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setTokenResult(null);
    setPassword('');
    setCopied(false);
  };

  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <div>
          <h2 className="text-center text-3xl font-bold" style={{ color: 'var(--accent)' }}>
            Track
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Generate an agent token
          </p>
        </div>

        {tokenResult ? (
          <div className="space-y-4">
            <div className="px-4 py-3 rounded" style={{ backgroundColor: 'rgba(100, 200, 100, 0.12)', border: '1px solid rgba(100, 200, 100, 0.25)', color: '#64c064' }}>
              Agent token generated successfully
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This token is valid for {tokenResult.expires_in_days} day{tokenResult.expires_in_days !== 1 ? 's' : ''}.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Token
              </label>
              <textarea
                readOnly
                value={tokenResult.access_token}
                rows={4}
                className="block w-full px-3 py-2 rounded-md focus:outline-none text-xs font-mono"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'none' }}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="mt-2 w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: copied ? '#64c064' : 'var(--accent)' }}
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>API Docs:</span>{' '}
                <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-raised)' }}>{baseUrl}/agent</code>
              </div>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>API Base:</span>{' '}
                <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-raised)' }}>{baseUrl}/api/</code>
              </div>
            </div>
            <div className="text-center space-y-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm hover:underline block w-full"
                style={{ color: 'var(--accent)' }}
              >
                Generate Another
              </button>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm hover:underline block w-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 rounded" style={{ backgroundColor: 'rgba(200, 100, 100, 0.12)', border: '1px solid rgba(200, 100, 100, 0.25)', color: '#c06464' }}>
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="agent-username" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Username
                </label>
                <input
                  id="agent-username"
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
                <label htmlFor="agent-password" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <input
                  id="agent-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label htmlFor="agent-expires" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Token Duration (days)
                </label>
                <select
                  id="agent-expires"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 rounded-md focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>365 days</option>
                </select>
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
                {isLoading ? 'Generating...' : 'Generate Agent Token'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm hover:underline"
                style={{ color: 'var(--text-secondary)' }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
