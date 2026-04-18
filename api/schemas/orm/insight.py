from datetime import datetime
from typing import List, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class AgentInsight(Document):
    project_id: Indexed(PydanticObjectId)
    user_id: Indexed(PydanticObjectId)
    title: str
    body: str
    agent_name: Optional[str] = None
    kind: str = "neural"  # neural | scheduling | risk | summary
    created_at: datetime = Field(default_factory=datetime.utcnow)
    linked_task_ids: List[PydanticObjectId] = Field(default_factory=list)
    linked_note_ids: List[PydanticObjectId] = Field(default_factory=list)
    dismissed_at: Optional[datetime] = None

    class Settings:
        name = "agent_insights"
