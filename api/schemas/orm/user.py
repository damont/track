from datetime import datetime
from typing import Optional

import pymongo
from beanie import Document, Indexed
from pydantic import EmailStr


class User(Document):
    email: Indexed(EmailStr, unique=True)
    username: Indexed(str, unique=True)
    # Optional for Google-only accounts (no password set).
    hashed_password: Optional[str] = None
    display_name: Optional[str] = None
    # Plain string with a sparse unique index (declared in Settings.indexes)
    # so multiple users without a google_sub don't collide on None.
    google_sub: Optional[str] = None
    # Default True so existing users are grandfathered as verified;
    # the register endpoint explicitly sets False for new signups.
    email_verified: bool = True
    created_at: datetime = datetime.utcnow()
    is_active: bool = True

    class Settings:
        name = "users"
        indexes = [
            pymongo.IndexModel(
                [("google_sub", pymongo.ASCENDING)],
                unique=True,
                sparse=True,
                name="google_sub_unique_sparse",
            ),
        ]
