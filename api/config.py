from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "track"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    cors_origins: str = "*"

    # Google OAuth
    google_client_id: Optional[str] = None

    # SMTP / password reset
    smtp_email: Optional[str] = None
    smtp_app_password: Optional[str] = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    password_reset_expire_minutes: int = 60
    frontend_base_url: str = "http://localhost:8090"

    @field_validator("frontend_base_url")
    @classmethod
    def _ensure_scheme(cls, v: str) -> str:
        if v and not v.startswith(("http://", "https://")):
            return f"https://{v}"
        return v

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
