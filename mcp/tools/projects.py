"""Project management tools for MCP."""

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from beanie import PydanticObjectId

from api.schemas.orm.project import Project
from api.schemas.orm.task import Task
from api.schemas.orm.note import Note
from mcp.utils.auth import MCPUser, get_mcp_user, require_scope
from mcp.oauth.models import OAuthScope

router = APIRouter(prefix="/mcp/tools/projects", tags=["mcp-projects"])


# ============================================================================
# Schemas
# ============================================================================

class ProjectStats(BaseModel):
    total_tasks: int = 0
    completed_tasks: int = 0
    total_notes: int = 0


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    stats: Optional[ProjectStats] = None
    
    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

async def project_to_response(project: Project, include_stats: bool = False) -> ProjectResponse:
    """Convert Project document to response model."""
    stats = None
    if include_stats:
        total_tasks = await Task.find({"project_id": project.id}).count()
        completed_tasks = await Task.find({"project_id": project.id, "status": "done"}).count()
        total_notes = await Note.find({"project_id": project.id}).count()
        stats = ProjectStats(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            total_notes=total_notes,
        )
    
    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        color=project.color,
        icon=project.icon,
        created_at=project.created_at,
        updated_at=project.updated_at,
        stats=stats,
    )


# ============================================================================
# Endpoints
# ============================================================================

@router.get("", response_model=ProjectListResponse)
async def list_projects(
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.PROJECTS_READ)),
    include_stats: bool = Query(False, description="Include task/note counts"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List projects for the authenticated user."""
    query = {"user_id": PydanticObjectId(mcp_user.user_id)}
    
    projects = await Project.find(query).skip(offset).limit(limit).to_list()
    total = await Project.find(query).count()
    
    project_responses = [await project_to_response(p, include_stats) for p in projects]
    
    return ProjectListResponse(projects=project_responses, total=total)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.PROJECTS_READ)),
    include_stats: bool = Query(True, description="Include task/note counts"),
):
    """Get a specific project by ID."""
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project or str(project.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return await project_to_response(project, include_stats)


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    request: ProjectCreateRequest,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.PROJECTS_WRITE)),
):
    """Create a new project."""
    project = Project(
        name=request.name,
        description=request.description,
        color=request.color,
        icon=request.icon,
        user_id=PydanticObjectId(mcp_user.user_id),
    )
    await project.insert()
    
    return await project_to_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    request: ProjectUpdateRequest,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.PROJECTS_WRITE)),
):
    """Update an existing project."""
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project or str(project.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(project, key, value)
    
    project.updated_at = datetime.utcnow()
    await project.save()
    
    return await project_to_response(project, include_stats=True)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.PROJECTS_WRITE)),
):
    """Delete a project. Tasks and notes in this project will have their project_id set to null."""
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project or str(project.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Unlink tasks and notes from this project
    await Task.find({"project_id": project.id}).update({"$set": {"project_id": None}})
    await Note.find({"project_id": project.id}).update({"$set": {"project_id": None}})
    
    await project.delete()
