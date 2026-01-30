from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.task import Task, TaskStatus, StatusEntry, Step, ResearchReference
from api.schemas.dto.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskReorder,
    StepCreate,
    StepUpdate,
    ResearchCreate,
    ResearchUpdate,
    TaskResponse,
    TaskListResponse,
)
from api.utils.auth import get_current_user
from api.services.ordering import calculate_order, should_rebalance, rebalance_orders

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def task_to_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=str(task.id),
        name=task.name,
        description=task.description,
        user_id=str(task.user_id),
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        current_status=task.current_status,
        status_history=task.status_history,
        category_id=str(task.category_id) if task.category_id else None,
        overall_order=task.overall_order,
        category_order=task.category_order,
        notes=task.notes,
        next_steps=task.next_steps,
        research=task.research,
    )


def task_to_list_response(task: Task) -> TaskListResponse:
    completed_steps = sum(1 for s in task.next_steps if s.completed)
    sorted_steps = sorted(task.next_steps, key=lambda s: s.order)
    next_step = next((s for s in sorted_steps if not s.completed), None)
    return TaskListResponse(
        id=str(task.id),
        name=task.name,
        description=task.description,
        current_status=task.current_status,
        category_id=str(task.category_id) if task.category_id else None,
        overall_order=task.overall_order,
        category_order=task.category_order,
        completed_at=task.completed_at,
        step_count=len(task.next_steps),
        completed_step_count=completed_steps,
        next_step_description=next_step.description if next_step else None,
    )


@router.get("", response_model=List[TaskListResponse])
async def list_tasks(
    current_user: User = Depends(get_current_user),
    active: Optional[bool] = Query(None, description="Filter by active status"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    task_status: Optional[TaskStatus] = Query(None, alias="status", description="Filter by status"),
):
    query = {"user_id": current_user.id}

    if active is True:
        query["completed_at"] = None
    elif active is False:
        query["completed_at"] = {"$ne": None}

    if category_id:
        try:
            query["category_id"] = PydanticObjectId(category_id)
        except Exception:
            pass

    if task_status:
        query["current_status.status"] = task_status.value

    tasks = await Task.find(query).sort(+Task.overall_order).to_list()
    return [task_to_list_response(t) for t in tasks]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
):
    # Get the max order to place new task at end
    max_order_task = await Task.find(Task.user_id == current_user.id).sort(-Task.overall_order).first_or_none()
    overall_order = (max_order_task.overall_order + 1000.0) if max_order_task else 1000.0

    category_order = 0.0
    category_id = None
    if data.category_id:
        try:
            category_id = PydanticObjectId(data.category_id)
            max_cat_task = await Task.find(
                Task.user_id == current_user.id,
                Task.category_id == category_id
            ).sort(-Task.category_order).first_or_none()
            category_order = (max_cat_task.category_order + 1000.0) if max_cat_task else 1000.0
        except Exception:
            pass

    task = Task(
        name=data.name,
        description=data.description,
        user_id=current_user.id,
        category_id=category_id,
        overall_order=overall_order,
        category_order=category_order,
        notes=data.notes,
    )
    await task.insert()
    return task_to_response(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    return task_to_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = data.model_dump(exclude_unset=True)

    # Handle category_id conversion
    if "category_id" in update_data:
        if update_data["category_id"]:
            try:
                update_data["category_id"] = PydanticObjectId(update_data["category_id"])
            except Exception:
                del update_data["category_id"]
        else:
            update_data["category_id"] = None

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await task.update({"$set": update_data})
        task = await Task.get(task.id)

    return task_to_response(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await task.delete()
    return None


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    now = datetime.utcnow()

    # Close current status
    task.current_status.inactive_at = now
    task.status_history.append(task.current_status)

    # Create completed status
    task.current_status = StatusEntry(status=TaskStatus.COMPLETED, active_at=now)
    task.completed_at = now
    task.updated_at = now

    await task.save()
    return task_to_response(task)


@router.post("/{task_id}/reactivate", response_model=TaskResponse)
async def reactivate_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    now = datetime.utcnow()

    # Close current status
    task.current_status.inactive_at = now
    task.status_history.append(task.current_status)

    # Create pending status
    task.current_status = StatusEntry(status=TaskStatus.PENDING, active_at=now)
    task.completed_at = None
    task.updated_at = now

    await task.save()
    return task_to_response(task)


@router.put("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    now = datetime.utcnow()

    # Close current status
    task.current_status.inactive_at = now
    task.status_history.append(task.current_status)

    # Create new status
    task.current_status = StatusEntry(status=data.status, active_at=now)

    # Handle completion
    if data.status == TaskStatus.COMPLETED:
        task.completed_at = now
    elif task.completed_at is not None:
        task.completed_at = None

    task.updated_at = now

    await task.save()
    return task_to_response(task)


@router.get("/{task_id}/status-history", response_model=List[StatusEntry])
async def get_status_history(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Return history plus current status
    return task.status_history + [task.current_status]


@router.post("/reorder", response_model=TaskResponse)
async def reorder_task(
    data: TaskReorder,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(data.task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    before_order = None
    after_order = None

    if data.before_task_id:
        try:
            before_task = await Task.get(PydanticObjectId(data.before_task_id))
            if before_task and before_task.user_id == current_user.id:
                before_order = before_task.overall_order if data.order_type == "overall" else before_task.category_order
        except Exception:
            pass

    if data.after_task_id:
        try:
            after_task = await Task.get(PydanticObjectId(data.after_task_id))
            if after_task and after_task.user_id == current_user.id:
                after_order = after_task.overall_order if data.order_type == "overall" else after_task.category_order
        except Exception:
            pass

    new_order = calculate_order(before_order, after_order)

    if data.order_type == "overall":
        task.overall_order = new_order
    else:
        task.category_order = new_order

    task.updated_at = datetime.utcnow()
    await task.save()

    # Check if rebalancing is needed
    if should_rebalance(before_order, after_order, new_order):
        await rebalance_orders(current_user.id, data.order_type, task.category_id)

    return task_to_response(task)


# --- Steps ---

@router.post("/{task_id}/steps", response_model=TaskResponse)
async def add_step(
    task_id: str,
    data: StepCreate,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    order = data.order if data.order is not None else len(task.next_steps)
    step = Step(description=data.description, order=order)
    task.next_steps.append(step)
    task.updated_at = datetime.utcnow()
    await task.save()

    return task_to_response(task)


@router.put("/{task_id}/steps/{step_id}", response_model=TaskResponse)
async def update_step(
    task_id: str,
    step_id: str,
    data: StepUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    step_found = False
    for step in task.next_steps:
        if step.id == step_id:
            step_found = True
            if data.description is not None:
                step.description = data.description
            if data.completed is not None:
                step.completed = data.completed
                step.completed_at = datetime.utcnow() if data.completed else None
            if data.order is not None:
                step.order = data.order
            break

    if not step_found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Step not found")

    task.updated_at = datetime.utcnow()
    await task.save()

    return task_to_response(task)


@router.delete("/{task_id}/steps/{step_id}", response_model=TaskResponse)
async def delete_step(
    task_id: str,
    step_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task.next_steps = [s for s in task.next_steps if s.id != step_id]
    task.updated_at = datetime.utcnow()
    await task.save()

    return task_to_response(task)


# --- Research ---

@router.post("/{task_id}/research", response_model=TaskResponse)
async def add_research(
    task_id: str,
    data: ResearchCreate,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    ref = ResearchReference(title=data.title, url=data.url, notes=data.notes)
    task.research.append(ref)
    task.updated_at = datetime.utcnow()
    await task.save()

    return task_to_response(task)


@router.put("/{task_id}/research/{ref_id}", response_model=TaskResponse)
async def update_research(
    task_id: str,
    ref_id: str,
    data: ResearchUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    ref_found = False
    for ref in task.research:
        if ref.id == ref_id:
            ref_found = True
            if data.title is not None:
                ref.title = data.title
            if data.url is not None:
                ref.url = data.url
            if data.notes is not None:
                ref.notes = data.notes
            break

    if not ref_found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research reference not found")

    task.updated_at = datetime.utcnow()
    await task.save()

    return task_to_response(task)


@router.delete("/{task_id}/research/{ref_id}", response_model=TaskResponse)
async def delete_research(
    task_id: str,
    ref_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        task = await Task.get(PydanticObjectId(task_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task is None or task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    task.research = [r for r in task.research if r.id != ref_id]
    task.updated_at = datetime.utcnow()
    await task.save()

    return task_to_response(task)
