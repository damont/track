import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export function UserProfile() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<{ access_token: string; expires_in_days: number } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6" style={{ color: 'var(--text-primary)' }}>
        <h1 className="text-2xl font-semibold mb-6">User Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Not logged in</p>
      </div>
    );
  }

  const handleGenerateToken = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await api.agentToken(user.email, password, expiresInDays);
      setTokenResult({
        access_token: result.access_token,
        expires_in_days: result.expires_in_days,
      });
      setPassword('');
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
    setError('');
  };

  const baseUrl = window.location.origin;

  return (
    <div className="max-w-4xl mx-auto p-6" style={{ color: 'var(--text-primary)' }}>
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--accent)' }}>
        User Profile
      </h1>

      <div
        className="rounded-lg p-6"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        {/* Profile Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </h2>
          </div>
        </div>

        {/* Profile Information */}
        <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
          <div className="space-y-4">
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Name</div>
              <div style={{ color: 'var(--text-primary)' }}>{user.name}</div>
            </div>

            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Email</div>
              <div style={{ color: 'var(--text-primary)' }}>{user.email}</div>
            </div>

            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>User ID</div>
              <div
                className="text-xs font-mono p-2 rounded border"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-raised)',
                  borderColor: 'var(--border-color)'
                }}
              >
                {user.id}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Token Section */}
        <div className="border-t pt-6 mt-6" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Agent Access Token
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Generate a token for AI agents to access your account via the API.
          </p>

          {tokenResult ? (
            <div className="space-y-3">
              <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: 'rgba(100, 200, 100, 0.12)', border: '1px solid rgba(100, 200, 100, 0.25)', color: '#64c064' }}>
                Token generated — valid for {tokenResult.expires_in_days} day{tokenResult.expires_in_days !== 1 ? 's' : ''}.
              </div>
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
                className="w-full py-2 px-4 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: copied ? '#64c064' : 'var(--accent)' }}
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>API Docs:</span>{' '}
                  <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-raised)' }}>{baseUrl}/agent</code>
                </div>
                <div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>API Base:</span>{' '}
                  <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-raised)' }}>{baseUrl}/api/</code>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-sm hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                Generate Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleGenerateToken} className="space-y-3">
              {error && (
                <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: 'rgba(200, 100, 100, 0.12)', border: '1px solid rgba(200, 100, 100, 0.25)', color: '#c06464' }}>
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Token Duration
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>365 days</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {isLoading ? 'Generating...' : 'Generate Token'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
