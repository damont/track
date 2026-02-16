"""Authentication utilities for MCP endpoints."""

from datetime import datetime
from typing import Optional, List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from mcp.oauth.models import OAuthAccessToken, OAuthScope


http_bearer = HTTPBearer()


class MCPUser:
    """Authenticated MCP user with associated scopes."""
    
    def __init__(self, user: User, scopes: List[OAuthScope], token: OAuthAccessToken):
        self.user = user
        self.scopes = scopes
        self.token = token
        self.user_id = str(user.id)
    
    def has_scope(self, scope: OAuthScope) -> bool:
        """Check if user has a specific scope."""
        return scope in self.scopes
    
    def require_scope(self, scope: OAuthScope) -> None:
        """Raise exception if user doesn't have scope."""
        if not self.has_scope(scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient scope. Required: {scope.value}",
            )


async def get_mcp_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
) -> MCPUser:
    """
    Dependency to get the authenticated MCP user from Bearer token.
    
    Usage:
        @router.get("/some-endpoint")
        async def endpoint(mcp_user: MCPUser = Depends(get_mcp_user)):
            mcp_user.require_scope(OAuthScope.TASKS_READ)
            return {"user_id": mcp_user.user_id}
    """
    token_str = credentials.credentials
    
    # Find access token
    token = await OAuthAccessToken.find_one(OAuthAccessToken.token == token_str)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not token.is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired or revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last used timestamp
    token.last_used_at = datetime.utcnow()
    await token.save()
    
    # Get user
    try:
        user = await User.get(PydanticObjectId(token.user_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return MCPUser(user=user, scopes=token.scopes, token=token)


def require_scope(scope: OAuthScope):
    """
    Dependency factory for requiring a specific scope.
    
    Usage:
        @router.get("/tasks")
        async def list_tasks(
            mcp_user: MCPUser = Depends(require_scope(OAuthScope.TASKS_READ))
        ):
            ...
    """
    async def dependency(mcp_user: MCPUser = Depends(get_mcp_user)) -> MCPUser:
        mcp_user.require_scope(scope)
        return mcp_user
    return dependency
