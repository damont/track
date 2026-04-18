from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.project import Project
from api.schemas.orm.insight import AgentInsight
from api.schemas.orm.task import Task
from api.schemas.orm.note import Note
from api.schemas.dto.insight import InsightCreate, InsightResponse
from api.utils.auth import get_current_user

router = APIRouter(tags=["insights"])


def insight_to_response(insight: AgentInsight) -> InsightResponse:
    return InsightResponse(
        id=str(insight.id),
        project_id=str(insight.project_id),
        title=insight.title,
        body=insight.body,
        agent_name=insight.agent_name,
        kind=insight.kind,
        created_at=insight.created_at,
        linked_task_ids=[str(t) for t in insight.linked_task_ids],
        linked_note_ids=[str(n) for n in insight.linked_note_ids],
        dismissed_at=insight.dismissed_at,
    )


async def _load_owned_project(project_id: str, user: User) -> Project:
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    if project is None or project.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


async def _load_owned_insight(insight_id: str, user: User) -> AgentInsight:
    try:
        insight = await AgentInsight.get(PydanticObjectId(insight_id))
    except Exception:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Insight not found")
    if insight is None or insight.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Insight not found")
    return insight


@router.get("/api/projects/{project_id}/insights", response_model=List[InsightResponse])
async def list_insights(
    project_id: str,
    limit: int = Query(3, ge=1, le=50),
    include_dismissed: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    project = await _load_owned_project(project_id, current_user)
    query = {"project_id": project.id, "user_id": current_user.id}
    if not include_dismissed:
        query["dismissed_at"] = None
    insights = (
        await AgentInsight.find(query)
        .sort(-AgentInsight.created_at)
        .limit(limit)
        .to_list()
    )
    return [insight_to_response(i) for i in insights]


@router.post(
    "/api/projects/{project_id}/insights",
    response_model=InsightResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_insight(
    project_id: str,
    data: InsightCreate,
    current_user: User = Depends(get_current_user),
):
    project = await _load_owned_project(project_id, current_user)

    linked_task_ids: List[PydanticObjectId] = []
    if data.linked_task_ids:
        for tid in data.linked_task_ids:
            try:
                oid = PydanticObjectId(tid)
            except Exception:
                continue
            task = await Task.get(oid)
            if task and task.user_id == current_user.id and task.project_id == project.id:
                linked_task_ids.append(oid)

    linked_note_ids: List[PydanticObjectId] = []
    if data.linked_note_ids:
        for nid in data.linked_note_ids:
            try:
                oid = PydanticObjectId(nid)
            except Exception:
                continue
            note = await Note.get(oid)
            if note and note.user_id == current_user.id and note.project_id == project.id:
                linked_note_ids.append(oid)

    insight = AgentInsight(
        project_id=project.id,
        user_id=current_user.id,
        title=data.title,
        body=data.body,
        agent_name=data.agent_name,
        kind=data.kind or "neural",
        linked_task_ids=linked_task_ids,
        linked_note_ids=linked_note_ids,
    )
    await insight.insert()
    return insight_to_response(insight)


@router.post("/api/insights/{insight_id}/dismiss", response_model=InsightResponse)
async def dismiss_insight(
    insight_id: str,
    current_user: User = Depends(get_current_user),
):
    insight = await _load_owned_insight(insight_id, current_user)
    insight.dismissed_at = datetime.utcnow()
    await insight.save()
    return insight_to_response(insight)


@router.delete("/api/insights/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insight(
    insight_id: str,
    current_user: User = Depends(get_current_user),
):
    insight = await _load_owned_insight(insight_id, current_user)
    await insight.delete()
    return None
