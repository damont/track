from typing import Optional
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    display_name: Optional[str]
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
