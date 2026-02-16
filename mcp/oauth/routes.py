"""OAuth 2.0 routes for MCP authentication."""

import secrets
import hashlib
import base64
from datetime import datetime
from typing import Optional
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, status, Depends, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.utils.auth import verify_password

from mcp.oauth.models import (
    OAuthClient,
    OAuthAuthorizationCode,
    OAuthAccessToken,
    OAuthRefreshToken,
    OAuthScope,
    SCOPE_ALL,
)
from mcp.oauth.schemas import (
    ClientRegisterRequest,
    ClientRegisterResponse,
    TokenRequest,
    TokenResponse,
    TokenRevokeRequest,
    OAuthError,
)

router = APIRouter(prefix="/mcp/oauth", tags=["oauth"])
ph = PasswordHasher()


def parse_scopes(scope_str: Optional[str]) -> list[OAuthScope]:
    """Parse space-separated scope string into list of OAuthScope."""
    if not scope_str:
        return list(SCOPE_ALL)
    
    scopes = []
    for s in scope_str.split():
        try:
            scopes.append(OAuthScope(s))
        except ValueError:
            pass  # Ignore invalid scopes
    
    return scopes if scopes else list(SCOPE_ALL)


def scopes_to_string(scopes: list[OAuthScope]) -> str:
    """Convert list of scopes to space-separated string."""
    return " ".join(s.value for s in scopes)


# ============================================================================
# Client Registration
# ============================================================================

@router.post("/register", response_model=ClientRegisterResponse)
async def register_client(
    request: ClientRegisterRequest,
    # TODO: Require authentication for registration
):
    """Register a new OAuth client application."""
    # Generate client secret
    client_secret = secrets.token_urlsafe(32)
    
    client = OAuthClient(
        name=request.name,
        description=request.description,
        redirect_uris=request.redirect_uris,
        client_secret_hash=ph.hash(client_secret),
        owner_id="system",  # TODO: Use authenticated user
    )
    await client.insert()
    
    return ClientRegisterResponse(
        client_id=client.client_id,
        client_secret=client_secret,  # Only returned once!
        name=client.name,
        redirect_uris=client.redirect_uris,
    )


# ============================================================================
# Authorization Endpoint
# ============================================================================

@router.get("/authorize", response_class=HTMLResponse)
async def authorize_page(
    client_id: str,
    redirect_uri: str,
    response_type: str = "code",
    scope: Optional[str] = None,
    state: Optional[str] = None,
    code_challenge: Optional[str] = None,
    code_challenge_method: Optional[str] = None,
):
    """Display authorization page for user to login and approve."""
    # Validate client
    client = await OAuthClient.find_one(OAuthClient.client_id == client_id)
    if not client or not client.is_active:
        return HTMLResponse(
            content="<h1>Error</h1><p>Invalid client_id</p>",
            status_code=400,
        )
    
    # Validate redirect_uri
    if redirect_uri not in client.redirect_uris:
        return HTMLResponse(
            content="<h1>Error</h1><p>Invalid redirect_uri</p>",
            status_code=400,
        )
    
    # Validate response_type
    if response_type != "code":
        return HTMLResponse(
            content="<h1>Error</h1><p>Only response_type=code is supported</p>",
            status_code=400,
        )
    
    # Parse requested scopes
    requested_scopes = parse_scopes(scope)
    scope_descriptions = {
        OAuthScope.TASKS_READ: "View your tasks",
        OAuthScope.TASKS_WRITE: "Create and edit your tasks",
        OAuthScope.NOTES_READ: "View your notes",
        OAuthScope.NOTES_WRITE: "Create and edit your notes",
        OAuthScope.PROJECTS_READ: "View your projects",
        OAuthScope.PROJECTS_WRITE: "Create and edit your projects",
        OAuthScope.PROFILE_READ: "View your profile",
    }
    
    scope_list_html = "\n".join(
        f"<li>{scope_descriptions.get(s, s.value)}</li>"
        for s in requested_scopes
    )
    
    # Render login/consent page
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Authorize {client.name} - Track</title>
        <style>
            body {{ font-family: system-ui, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }}
            .card {{ border: 1px solid #ddd; border-radius: 8px; padding: 20px; }}
            h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem; }}
            .app-name {{ color: #2563eb; }}
            .scopes {{ background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }}
            .scopes ul {{ margin: 10px 0 0 0; padding-left: 20px; }}
            input {{ width: 100%; padding: 10px; margin: 5px 0 15px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }}
            button {{ width: 100%; padding: 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }}
            .btn-approve {{ background: #2563eb; color: white; margin-bottom: 10px; }}
            .btn-deny {{ background: #f3f4f6; color: #374151; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1><span class="app-name">{client.name}</span> wants to access your Track account</h1>
            
            <div class="scopes">
                <strong>This will allow the application to:</strong>
                <ul>{scope_list_html}</ul>
            </div>
            
            <form method="POST" action="/mcp/oauth/authorize">
                <input type="hidden" name="client_id" value="{client_id}">
                <input type="hidden" name="redirect_uri" value="{redirect_uri}">
                <input type="hidden" name="scope" value="{scope or ''}">
                <input type="hidden" name="state" value="{state or ''}">
                <input type="hidden" name="code_challenge" value="{code_challenge or ''}">
                <input type="hidden" name="code_challenge_method" value="{code_challenge_method or ''}">
                
                <label>Username</label>
                <input type="text" name="username" required>
                
                <label>Password</label>
                <input type="password" name="password" required>
                
                <button type="submit" name="approve" value="true" class="btn-approve">Authorize</button>
                <button type="submit" name="approve" value="false" class="btn-deny">Deny</button>
            </form>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


@router.post("/authorize")
async def authorize_submit(
    username: str = Form(...),
    password: str = Form(...),
    approve: str = Form("false"),
    client_id: str = Form(...),
    redirect_uri: str = Form(...),
    scope: str = Form(""),
    state: str = Form(""),
    code_challenge: str = Form(""),
    code_challenge_method: str = Form(""),
):
    """Process authorization form submission."""
    # Handle denial
    if approve.lower() != "true":
        params = {"error": "access_denied", "error_description": "User denied access"}
        if state:
            params["state"] = state
        return RedirectResponse(
            url=f"{redirect_uri}?{urlencode(params)}",
            status_code=302,
        )
    
    # Validate client again
    client = await OAuthClient.find_one(OAuthClient.client_id == client_id)
    if not client or not client.is_active:
        params = {"error": "invalid_client"}
        if state:
            params["state"] = state
        return RedirectResponse(
            url=f"{redirect_uri}?{urlencode(params)}",
            status_code=302,
        )
    
    # Authenticate user
    user = await User.find_one(User.username == username)
    if not user or not verify_password(password, user.hashed_password):
        # Re-render form with error (simplified: redirect with error)
        params = {"error": "access_denied", "error_description": "Invalid credentials"}
        if state:
            params["state"] = state
        return RedirectResponse(
            url=f"{redirect_uri}?{urlencode(params)}",
            status_code=302,
        )
    
    if not user.is_active:
        params = {"error": "access_denied", "error_description": "Account disabled"}
        if state:
            params["state"] = state
        return RedirectResponse(
            url=f"{redirect_uri}?{urlencode(params)}",
            status_code=302,
        )
    
    # Create authorization code
    scopes = parse_scopes(scope if scope else None)
    
    auth_code = OAuthAuthorizationCode(
        client_id=client_id,
        user_id=str(user.id),
        redirect_uri=redirect_uri,
        scopes=scopes,
        state=state if state else None,
        code_challenge=code_challenge if code_challenge else None,
        code_challenge_method=code_challenge_method if code_challenge_method else None,
    )
    await auth_code.insert()
    
    # Redirect with code
    params = {"code": auth_code.code}
    if state:
        params["state"] = state
    
    return RedirectResponse(
        url=f"{redirect_uri}?{urlencode(params)}",
        status_code=302,
    )


# ============================================================================
# Token Endpoint
# ============================================================================

@router.post("/token", response_model=TokenResponse)
async def exchange_token(request: TokenRequest):
    """Exchange authorization code or refresh token for access token."""
    
    if request.grant_type == "authorization_code":
        return await _handle_authorization_code_grant(request)
    elif request.grant_type == "refresh_token":
        return await _handle_refresh_token_grant(request)
    else:
        raise HTTPException(
            status_code=400,
            detail={"error": "unsupported_grant_type"},
        )


async def _handle_authorization_code_grant(request: TokenRequest) -> TokenResponse:
    """Handle authorization_code grant type."""
    if not request.code:
        raise HTTPException(status_code=400, detail={"error": "invalid_request", "error_description": "code required"})
    if not request.client_id or not request.client_secret:
        raise HTTPException(status_code=400, detail={"error": "invalid_request", "error_description": "client credentials required"})
    
    # Find and validate authorization code
    auth_code = await OAuthAuthorizationCode.find_one(
        OAuthAuthorizationCode.code == request.code
    )
    if not auth_code:
        raise HTTPException(status_code=400, detail={"error": "invalid_grant", "error_description": "Invalid authorization code"})
    
    if auth_code.used or auth_code.is_expired:
        raise HTTPException(status_code=400, detail={"error": "invalid_grant", "error_description": "Authorization code expired or already used"})
    
    if auth_code.client_id != request.client_id:
        raise HTTPException(status_code=400, detail={"error": "invalid_grant", "error_description": "Client mismatch"})
    
    if request.redirect_uri and auth_code.redirect_uri != request.redirect_uri:
        raise HTTPException(status_code=400, detail={"error": "invalid_grant", "error_description": "Redirect URI mismatch"})
    
    # Validate client
    client = await OAuthClient.find_one(OAuthClient.client_id == request.client_id)
    if not client or not client.is_active:
        raise HTTPException(status_code=401, detail={"error": "invalid_client"})
    
    try:
        ph.verify(client.client_secret_hash, request.client_secret)
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail={"error": "invalid_client"})
    
    # Validate PKCE if present
    if auth_code.code_challenge:
        if not request.code_verifier:
            raise HTTPException(status_code=400, detail={"error": "invalid_request", "error_description": "code_verifier required"})
        
        if auth_code.code_challenge_method == "S256":
            computed = base64.urlsafe_b64encode(
                hashlib.sha256(request.code_verifier.encode()).digest()
            ).rstrip(b"=").decode()
        else:
            computed = request.code_verifier
        
        if computed != auth_code.code_challenge:
            raise HTTPException(status_code=400, detail={"error": "invalid_grant", "error_description": "Invalid code_verifier"})
    
    # Mark code as used
    auth_code.used = True
    await auth_code.save()
    
    # Create tokens
    access_token = OAuthAccessToken(
        client_id=auth_code.client_id,
        user_id=auth_code.user_id,
        scopes=auth_code.scopes,
    )
    await access_token.insert()
    
    refresh_token = OAuthRefreshToken(
        client_id=auth_code.client_id,
        user_id=auth_code.user_id,
        scopes=auth_code.scopes,
        access_token_id=str(access_token.id),
    )
    await refresh_token.insert()
    
    expires_in = int((access_token.expires_at - datetime.utcnow()).total_seconds())
    
    return TokenResponse(
        access_token=access_token.token,
        token_type="Bearer",
        expires_in=expires_in,
        refresh_token=refresh_token.token,
        scope=scopes_to_string(access_token.scopes),
    )


async def _handle_refresh_token_grant(request: TokenRequest) -> TokenResponse:
    """Handle refresh_token grant type."""
    if not request.refresh_token:
        raise HTTPException(status_code=400, detail={"error": "invalid_request", "error_description": "refresh_token required"})
    
    # Find and validate refresh token
    refresh = await OAuthRefreshToken.find_one(
        OAuthRefreshToken.token == request.refresh_token
    )
    if not refresh or not refresh.is_valid:
        raise HTTPException(status_code=400, detail={"error": "invalid_grant", "error_description": "Invalid or expired refresh token"})
    
    # Revoke old access token if exists
    if refresh.access_token_id:
        old_access = await OAuthAccessToken.get(PydanticObjectId(refresh.access_token_id))
        if old_access:
            old_access.revoked = True
            await old_access.save()
    
    # Create new access token
    access_token = OAuthAccessToken(
        client_id=refresh.client_id,
        user_id=refresh.user_id,
        scopes=refresh.scopes,
    )
    await access_token.insert()
    
    # Update refresh token's access_token_id
    refresh.access_token_id = str(access_token.id)
    await refresh.save()
    
    expires_in = int((access_token.expires_at - datetime.utcnow()).total_seconds())
    
    return TokenResponse(
        access_token=access_token.token,
        token_type="Bearer",
        expires_in=expires_in,
        refresh_token=refresh.token,  # Return same refresh token
        scope=scopes_to_string(access_token.scopes),
    )


# ============================================================================
# Token Revocation
# ============================================================================

@router.post("/revoke", status_code=200)
async def revoke_token(request: TokenRevokeRequest):
    """Revoke an access or refresh token."""
    # Try access token first
    access = await OAuthAccessToken.find_one(OAuthAccessToken.token == request.token)
    if access:
        access.revoked = True
        await access.save()
        return {"message": "Token revoked"}
    
    # Try refresh token
    refresh = await OAuthRefreshToken.find_one(OAuthRefreshToken.token == request.token)
    if refresh:
        refresh.revoked = True
        await refresh.save()
        # Also revoke associated access token
        if refresh.access_token_id:
            access = await OAuthAccessToken.get(PydanticObjectId(refresh.access_token_id))
            if access:
                access.revoked = True
                await access.save()
        return {"message": "Token revoked"}
    
    # Per RFC 7009, return 200 even if token not found
    return {"message": "Token revoked"}
