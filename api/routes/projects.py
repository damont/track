from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.project import Project
from api.schemas.orm.task import Task
from api.schemas.orm.note import Note
from api.schemas.orm.insight import AgentInsight
from api.schemas.dto.project import ProjectCreate, ProjectUpdate, ProjectResponse
from api.utils.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


def project_to_response(p: Project) -> ProjectResponse:
    return ProjectResponse(
        id=str(p.id),
        name=p.name,
        color=p.color,
        description=p.description,
        order=p.order,
    )


@router.get("", response_model=List[ProjectResponse])
async def list_projects(current_user: User = Depends(get_current_user)):
    projects = await Project.find(Project.user_id == current_user.id).sort(+Project.order).to_list()
    return [project_to_response(p) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
):
    project = Project(
        name=data.name,
        user_id=current_user.id,
        color=data.color,
        description=data.description,
        order=data.order or 0,
    )
    await project.insert()
    return project_to_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project is None or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        await project.update({"$set": update_data})
        project = await Project.get(project.id)

    return project_to_response(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        project = await Project.get(PydanticObjectId(project_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project is None or project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Cascade: remove all tasks, notes, and insights belonging to this project.
    await Task.find({"project_id": project.id, "user_id": current_user.id}).delete()
    await Note.find({"project_id": project.id, "user_id": current_user.id}).delete()
    await AgentInsight.find({"project_id": project.id, "user_id": current_user.id}).delete()

    await project.delete()
    return None
