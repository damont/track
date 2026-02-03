from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class NoteCreate(BaseModel):
    content: str
    category_id: Optional[str] = None


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    pinned: Optional[bool] = None
    order: Optional[float] = None
    tags: Optional[List[str]] = None
    category_id: Optional[str] = None


class NoteResponse(BaseModel):
    id: str
    content: str
    created_at: datetime
    updated_at: datetime
    pinned: bool
    order: float
    tags: List[str]
    category_id: Optional[str]
