from datetime import datetime
from typing import List, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class Note(Document):
    user_id: Indexed(PydanticObjectId)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    pinned: bool = False
    order: float = 0.0
    tags: List[str] = Field(default_factory=list)
    category_id: Optional[PydanticObjectId] = None

    class Settings:
        name = "notes"
