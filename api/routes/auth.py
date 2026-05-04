import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

from api.config import get_settings
from api.schemas.orm.user import User
from api.schemas.orm.password_reset import PasswordResetToken
from api.schemas.dto.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    AgentTokenRequest,
    AgentTokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    MessageResponse,
)
from api.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from api.services.email import send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    # Check if user already exists
    existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=data.email,
        username=data.email,  # Use email as username for backwards compatibility
        hashed_password=hash_password(data.password),
        display_name=data.name,
    )
    await user.insert()

    return UserResponse(
        id=str(user.id),
        name=user.display_name or data.name,
        email=user.email,
        is_active=user.is_active,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    # Find user by email
    user = await User.find_one(User.email == data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )

    # Generate token
    access_token = create_access_token(str(user.id))

    return TokenResponse(access_token=access_token)


@router.post("/agent-token", response_model=AgentTokenResponse)
async def agent_token(
    data: AgentTokenRequest,
    current_user: User = Depends(get_current_user),
):
    access_token = create_access_token(
        str(current_user.id), expires_delta=timedelta(days=data.expires_in_days)
    )

    return AgentTokenResponse(
        access_token=access_token,
        expires_in_days=data.expires_in_days,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        name=current_user.display_name or current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: PasswordResetRequest):
    settings = get_settings()
    message = "If an account with that email exists, a password reset link has been sent."

    user = await User.find_one(User.email == data.email)
    if not user:
        return MessageResponse(message=message)

    # Invalidate existing unused tokens for this user
    existing = await PasswordResetToken.find(
        PasswordResetToken.user_id == str(user.id),
        PasswordResetToken.used_at == None,
    ).to_list()
    for tok in existing:
        tok.used_at = datetime.utcnow()
        await tok.save()

    # Generate new token
    token = secrets.token_urlsafe(16)
    reset_token = PasswordResetToken(
        token=token,
        user_id=str(user.id),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.password_reset_expire_minutes),
        created_at=datetime.utcnow(),
    )
    await reset_token.insert()

    reset_url = f"{settings.frontend_base_url}/reset-password/{token}"

    try:
        await send_password_reset_email(user.email, reset_url)
    except Exception:
        pass  # Don't reveal whether email was sent

    return MessageResponse(message=message)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: PasswordResetConfirm):
    reset_token = await PasswordResetToken.find_one(
        PasswordResetToken.token == data.token
    )

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if reset_token.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset token has already been used",
        )

    if datetime.utcnow() > reset_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Mark token as used
    reset_token.used_at = datetime.utcnow()
    await reset_token.save()

    # Update user password
    user = await User.get(reset_token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found",
        )

    user.hashed_password = hash_password(data.new_password)
    await user.save()

    return MessageResponse(message="Your password has been reset successfully.")
