from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(..., description="Display name")
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AgentTokenRequest(BaseModel):
    expires_in_days: int = Field(default=30, ge=1, le=365)


class AgentTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_days: int


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class MessageResponse(BaseModel):
    message: str
