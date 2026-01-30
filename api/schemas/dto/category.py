from typing import Optional
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = None
    order: Optional[int] = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    color: Optional[str]
    order: int
