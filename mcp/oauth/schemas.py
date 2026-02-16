"""OAuth 2.0 request/response schemas."""

from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl

from mcp.oauth.models import OAuthScope


# Client Registration
class ClientRegisterRequest(BaseModel):
    """Request to register a new OAuth client."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    redirect_uris: List[str] = Field(..., min_length=1)


class ClientRegisterResponse(BaseModel):
    """Response with client credentials."""
    client_id: str
    client_secret: str  # Only returned once at registration
    name: str
    redirect_uris: List[str]


# Authorization
class AuthorizeRequest(BaseModel):
    """Authorization request parameters."""
    client_id: str
    redirect_uri: str
    response_type: str = "code"
    scope: Optional[str] = None  # Space-separated scopes
    state: Optional[str] = None  # CSRF protection
    
    # PKCE (optional)
    code_challenge: Optional[str] = None
    code_challenge_method: Optional[str] = None  # "S256" or "plain"


class AuthorizeSubmit(BaseModel):
    """User submitting authorization form."""
    username: str
    password: str
    approve: bool = True
    
    # Carry forward from authorize request
    client_id: str
    redirect_uri: str
    scope: Optional[str] = None
    state: Optional[str] = None
    code_challenge: Optional[str] = None
    code_challenge_method: Optional[str] = None


# Token Exchange
class TokenRequest(BaseModel):
    """Token request (code exchange or refresh)."""
    grant_type: str  # "authorization_code" or "refresh_token"
    
    # For authorization_code grant
    code: Optional[str] = None
    redirect_uri: Optional[str] = None
    code_verifier: Optional[str] = None  # PKCE
    
    # For refresh_token grant
    refresh_token: Optional[str] = None
    
    # Client credentials (can also be in Authorization header)
    client_id: Optional[str] = None
    client_secret: Optional[str] = None


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int  # Seconds until expiration
    refresh_token: Optional[str] = None
    scope: str  # Space-separated scopes


class TokenRevokeRequest(BaseModel):
    """Revoke a token."""
    token: str
    token_type_hint: Optional[str] = None  # "access_token" or "refresh_token"


# Error responses
class OAuthError(BaseModel):
    """OAuth 2.0 error response."""
    error: str
    error_description: Optional[str] = None
    error_uri: Optional[str] = None
