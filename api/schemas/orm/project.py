from typing import Optional

from beanie import Document, Indexed, PydanticObjectId


class Project(Document):
    name: str
    user_id: Indexed(PydanticObjectId)
    color: Optional[str] = None  # Hex color for UI
    description: Optional[str] = None
    order: int = 0

    class Settings:
        name = "projects"
