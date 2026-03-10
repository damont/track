import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6" style={{ color: 'var(--text-primary)' }}>
        <h1 className="text-2xl font-semibold mb-6">User Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Not logged in</p>
      </div>
    );
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API call
    setIsEditing(false);
  };

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
            <p style={{ color: 'var(--text-secondary)' }}>
              Member since {new Date(user.id).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-raised)', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ 
                    backgroundColor: 'var(--bg-raised)', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ 
                    backgroundColor: 'var(--bg-raised)', 
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
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

              <div className="pt-4">
                <button
                  onClick={() => {
                    setEditForm({ name: user.name, email: user.email });
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}