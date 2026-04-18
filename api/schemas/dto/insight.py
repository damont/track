from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class InsightCreate(BaseModel):
    title: str
    body: str
    agent_name: Optional[str] = None
    kind: Optional[str] = "neural"
    linked_task_ids: Optional[List[str]] = None
    linked_note_ids: Optional[List[str]] = None


class InsightResponse(BaseModel):
    id: str
    project_id: str
    title: str
    body: str
    agent_name: Optional[str]
    kind: str
    created_at: datetime
    linked_task_ids: List[str]
    linked_note_ids: List[str]
    dismissed_at: Optional[datetime]
