"""OAuth 2.0 database models for MCP authentication."""

from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum
import secrets

from beanie import Document, Indexed
from pydantic import Field


class OAuthScope(str, Enum):
    """Available OAuth scopes."""
    TASKS_READ = "tasks:read"
    TASKS_WRITE = "tasks:write"
    NOTES_READ = "notes:read"
    NOTES_WRITE = "notes:write"
    PROJECTS_READ = "projects:read"
    PROJECTS_WRITE = "projects:write"
    PROFILE_READ = "profile:read"


# Convenience scope groups
SCOPE_ALL_READ = [
    OAuthScope.TASKS_READ,
    OAuthScope.NOTES_READ,
    OAuthScope.PROJECTS_READ,
    OAuthScope.PROFILE_READ,
]
SCOPE_ALL_WRITE = [
    OAuthScope.TASKS_WRITE,
    OAuthScope.NOTES_WRITE,
    OAuthScope.PROJECTS_WRITE,
]
SCOPE_ALL = SCOPE_ALL_READ + SCOPE_ALL_WRITE


class OAuthClient(Document):
    """Registered OAuth application."""
    
    client_id: Indexed(str, unique=True) = Field(
        default_factory=lambda: f"track_{secrets.token_urlsafe(16)}"
    )
    client_secret_hash: str  # Hashed with argon2
    
    name: str
    description: Optional[str] = None
    redirect_uris: List[str]  # Allowed redirect URIs
    
    # Owner (user who registered the app)
    owner_id: str
    
    # Allowed scopes for this client
    allowed_scopes: List[OAuthScope] = Field(default_factory=lambda: list(SCOPE_ALL))
    
    # Client status
    is_active: bool = True
    is_first_party: bool = False  # First-party apps skip consent screen
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "oauth_clients"


class OAuthAuthorizationCode(Document):
    """Temporary authorization code (valid for ~10 minutes)."""
    
    code: Indexed(str, unique=True) = Field(
        default_factory=lambda: secrets.token_urlsafe(32)
    )
    
    client_id: str
    user_id: str
    redirect_uri: str
    scopes: List[OAuthScope]
    state: Optional[str] = None  # CSRF protection
    
    # Code challenge for PKCE (optional but recommended)
    code_challenge: Optional[str] = None
    code_challenge_method: Optional[str] = None  # "S256" or "plain"
    
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(minutes=10)
    )
    used: bool = False
    
    class Settings:
        name = "oauth_authorization_codes"
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at


class OAuthAccessToken(Document):
    """Access token for API access."""
    
    token: Indexed(str, unique=True) = Field(
        default_factory=lambda: secrets.token_urlsafe(32)
    )
    
    client_id: str
    user_id: Indexed(str)
    scopes: List[OAuthScope]
    
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=1)
    )
    revoked: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used_at: Optional[datetime] = None
    
    class Settings:
        name = "oauth_access_tokens"
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        return not self.revoked and not self.is_expired


class OAuthRefreshToken(Document):
    """Refresh token for obtaining new access tokens."""
    
    token: Indexed(str, unique=True) = Field(
        default_factory=lambda: secrets.token_urlsafe(48)
    )
    
    client_id: str
    user_id: Indexed(str)
    scopes: List[OAuthScope]
    
    # Refresh tokens last longer (30 days default)
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(days=30)
    )
    revoked: bool = False
    
    # Track which access token this refresh token created
    access_token_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "oauth_refresh_tokens"
    
    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        return not self.revoked and not self.is_expired


# All OAuth models for Beanie initialization
OAUTH_MODELS = [
    OAuthClient,
    OAuthAuthorizationCode,
    OAuthAccessToken,
    OAuthRefreshToken,
]
