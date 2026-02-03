from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.note import Note
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
        category_id=str(note.category_id) if note.category_id else None,
    )


@router.get("", response_model=List[NoteResponse])
async def list_notes(
    current_user: User = Depends(get_current_user),
    category_id: Optional[str] = Query(None, description="Filter by category"),
):
    query = {"user_id": current_user.id}

    if category_id:
        try:
            query["category_id"] = PydanticObjectId(category_id)
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

    category_id = None
    if data.category_id:
        try:
            category_id = PydanticObjectId(data.category_id)
        except Exception:
            pass

    note = Note(
        user_id=current_user.id,
        content=data.content,
        order=order,
        category_id=category_id,
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

    await note.delete()
    return None
