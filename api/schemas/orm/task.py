from datetime import datetime
from enum import Enum
from typing import List, Optional
import uuid

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Step(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    completed: bool = False
    completed_at: Optional[datetime] = None
    order: int = 0


class ResearchReference(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: Optional[str] = None
    notes: Optional[str] = None
    added_at: datetime = Field(default_factory=datetime.utcnow)


class StatusEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: TaskStatus
    active_at: datetime = Field(default_factory=datetime.utcnow)
    inactive_at: Optional[datetime] = None  # null = current status


class Task(Document):
    name: str
    description: Optional[str] = None
    user_id: Indexed(PydanticObjectId)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None  # null = active task

    # Status with history
    current_status: StatusEntry = Field(
        default_factory=lambda: StatusEntry(status=TaskStatus.PENDING)
    )
    status_history: List[StatusEntry] = Field(default_factory=list)

    # Organization
    project_id: Optional[PydanticObjectId] = None
    overall_order: float = 0.0  # Fractional indexing for global sort
    project_order: float = 0.0  # Fractional indexing for project sort

    # Content
    notes: Optional[str] = None
    next_steps: List[Step] = Field(default_factory=list)
    research: List[ResearchReference] = Field(default_factory=list)

    # Linked notes
    linked_note_ids: List[PydanticObjectId] = Field(default_factory=list)

    class Settings:
        name = "tasks"
