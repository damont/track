from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    color: Optional[str] = None
    order: Optional[int] = 0


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    color: Optional[str]
    order: int
