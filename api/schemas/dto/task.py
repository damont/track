from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from api.schemas.orm.task import TaskStatus, Step, ResearchReference, StatusEntry


class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    notes: Optional[str] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    notes: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskReorder(BaseModel):
    task_id: str
    order_type: str  # "overall" or "category"
    before_task_id: Optional[str] = None  # Task to place after
    after_task_id: Optional[str] = None   # Task to place before


class StepCreate(BaseModel):
    description: str
    order: Optional[int] = None


class StepUpdate(BaseModel):
    description: Optional[str] = None
    completed: Optional[bool] = None
    order: Optional[int] = None


class ResearchCreate(BaseModel):
    title: str
    url: Optional[str] = None
    notes: Optional[str] = None


class ResearchUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    user_id: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    current_status: StatusEntry
    status_history: List[StatusEntry]
    category_id: Optional[str]
    overall_order: float
    category_order: float
    notes: Optional[str]
    next_steps: List[Step]
    research: List[ResearchReference]


class TaskListResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    current_status: StatusEntry
    category_id: Optional[str]
    overall_order: float
    category_order: float
    completed_at: Optional[datetime]
    step_count: int
    completed_step_count: int
    next_step_description: Optional[str] = None
