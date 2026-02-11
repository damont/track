from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.note import Note
from api.schemas.orm.task import Task
from api.schemas.dto.note import NoteCreate, NoteUpdate, NoteResponse
from api.utils.auth import get_current_user

router = APIRouter(prefix="/api/notes", tags=["notes"])


def note_to_response(note: Note) -> NoteResponse:
    return NoteResponse(
        id=str(note.id),
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
        pinned=note.pinned,
        order=note.order,
        tags=note.tags,
        project_id=str(note.project_id) if note.project_id else None,
    )


@router.get("", response_model=List[NoteResponse])
async def list_notes(
    current_user: User = Depends(get_current_user),
    project_id: Optional[str] = Query(None, description="Filter by project"),
):
    query = {"user_id": current_user.id}

    if project_id:
        try:
            query["project_id"] = PydanticObjectId(project_id)
        except Exception:
            pass

    # Sort: pinned first (descending bool), then by order ascending
    notes = await Note.find(query).sort(
        [("pinned", -1), ("order", 1)]
    ).to_list()
    return [note_to_response(n) for n in notes]


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
):
    # Get max order to place new note at end
    max_order_note = await Note.find(
        Note.user_id == current_user.id
    ).sort(-Note.order).first_or_none()
    order = (max_order_note.order + 1000.0) if max_order_note else 1000.0

    project_id = None
    if data.project_id:
        try:
            project_id = PydanticObjectId(data.project_id)
        except Exception:
            pass

    note = Note(
        user_id=current_user.id,
        content=data.content,
        order=order,
        project_id=project_id,
    )
    await note.insert()
    return note_to_response(note)


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    data: NoteUpdate,
    current_user: User = Depends(get_current_user),
):
    try:
        note = await Note.get(PydanticObjectId(note_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note is None or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    update_data = data.model_dump(exclude_unset=True)

    # Handle project_id conversion
    if "project_id" in update_data:
        if update_data["project_id"]:
            try:
                update_data["project_id"] = PydanticObjectId(update_data["project_id"])
            except Exception:
                del update_data["project_id"]
        else:
            update_data["project_id"] = None

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await note.update({"$set": update_data})
        note = await Note.get(note.id)

    return note_to_response(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        note = await Note.get(PydanticObjectId(note_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    if note is None or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    # Remove this note from any tasks that have it linked
    await Task.find({"linked_note_ids": PydanticObjectId(note_id)}).update_many(
        {"$pull": {"linked_note_ids": PydanticObjectId(note_id)}}
    )

    await note.delete()
    return None
