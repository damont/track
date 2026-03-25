from datetime import datetime
from typing import Optional

from beanie import Document, Indexed


class PasswordResetToken(Document):
    token: Indexed(str, unique=True)
    user_id: Indexed(str)
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "password_reset_tokens"
