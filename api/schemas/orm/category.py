from typing import Optional

from beanie import Document, Indexed, PydanticObjectId


class Category(Document):
    name: str
    user_id: Indexed(PydanticObjectId)
    color: Optional[str] = None  # Hex color for UI
    order: int = 0

    class Settings:
        name = "categories"
