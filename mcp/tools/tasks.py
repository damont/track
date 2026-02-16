"""Task management tools for MCP."""

from typing import Optional, List
from datetime import datetime
from enum import Enum

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from beanie import PydanticObjectId

from api.schemas.orm.task import Task
from api.schemas.orm.project import Project
from mcp.utils.auth import MCPUser, get_mcp_user, require_scope
from mcp.oauth.models import OAuthScope

router = APIRouter(prefix="/mcp/tools/tasks", tags=["mcp-tasks"])


# ============================================================================
# Schemas
# ============================================================================

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: Optional[int] = None
    due_date: Optional[datetime] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]
    total: int


class TaskCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: Optional[int] = Field(None, ge=1, le=5)
    due_date: Optional[datetime] = None
    project_id: Optional[str] = None


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    due_date: Optional[datetime] = None
    project_id: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

async def task_to_response(task: Task) -> TaskResponse:
    """Convert Task document to response model."""
    project_name = None
    if task.project_id:
        project = await Project.get(task.project_id)
        if project:
            project_name = project.name
    
    return TaskResponse(
        id=str(task.id),
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        project_id=str(task.project_id) if task.project_id else None,
        project_name=project_name,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


# ============================================================================
# Endpoints
# ============================================================================

@router.get("", response_model=TaskListResponse)
async def list_tasks(
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.TASKS_READ)),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List tasks for the authenticated user."""
    # Build query
    query = {"user_id": PydanticObjectId(mcp_user.user_id)}
    
    if project_id:
        query["project_id"] = PydanticObjectId(project_id)
    
    if status:
        query["status"] = status.value
    
    # Execute query
    tasks = await Task.find(query).skip(offset).limit(limit).to_list()
    total = await Task.find(query).count()
    
    task_responses = [await task_to_response(t) for t in tasks]
    
    return TaskListResponse(tasks=task_responses, total=total)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.TASKS_READ)),
):
    """Get a specific task by ID."""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task or str(task.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return await task_to_response(task)


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    request: TaskCreateRequest,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.TASKS_WRITE)),
):
    """Create a new task."""
    # Validate project if provided
    project_id = None
    if request.project_id:
        try:
            project = await Project.get(PydanticObjectId(request.project_id))
            if not project or str(project.user_id) != mcp_user.user_id:
                raise HTTPException(status_code=400, detail="Invalid project_id")
            project_id = project.id
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid project_id")
    
    task = Task(
        title=request.title,
        description=request.description,
        status=request.status.value,
        priority=request.priority,
        due_date=request.due_date,
        project_id=project_id,
        user_id=PydanticObjectId(mcp_user.user_id),
    )
    await task.insert()
    
    return await task_to_response(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    request: TaskUpdateRequest,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.TASKS_WRITE)),
):
    """Update an existing task."""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task or str(task.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    
    if "project_id" in update_data:
        if update_data["project_id"]:
            try:
                project = await Project.get(PydanticObjectId(update_data["project_id"]))
                if not project or str(project.user_id) != mcp_user.user_id:
                    raise HTTPException(status_code=400, detail="Invalid project_id")
                update_data["project_id"] = project.id
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid project_id")
        else:
            update_data["project_id"] = None
    
    if "status" in update_data:
        update_data["status"] = update_data["status"].value
    
    for key, value in update_data.items():
        setattr(task, key, value)
    
    task.updated_at = datetime.utcnow()
    await task.save()
    
    return await task_to_response(task)


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: str,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.TASKS_WRITE)),
):
    """Mark a task as complete."""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task or str(task.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "done"
    task.updated_at = datetime.utcnow()
    await task.save()
    
    return await task_to_response(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.TASKS_WRITE)),
):
    """Delete a task."""
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task or str(task.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await task.delete()
