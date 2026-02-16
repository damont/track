"""Note management tools for MCP."""

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from beanie import PydanticObjectId

from api.schemas.orm.note import Note
from api.schemas.orm.project import Project
from mcp.utils.auth import MCPUser, get_mcp_user, require_scope
from mcp.oauth.models import OAuthScope

router = APIRouter(prefix="/mcp/tools/notes", tags=["mcp-notes"])


# ============================================================================
# Schemas
# ============================================================================

class NoteResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    notes: List[NoteResponse]
    total: int


class NoteCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    project_id: Optional[str] = None


class NoteUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    project_id: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

async def note_to_response(note: Note) -> NoteResponse:
    """Convert Note document to response model."""
    project_name = None
    if note.project_id:
        project = await Project.get(note.project_id)
        if project:
            project_name = project.name
    
    return NoteResponse(
        id=str(note.id),
        title=note.title,
        content=note.content,
        project_id=str(note.project_id) if note.project_id else None,
        project_name=project_name,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


# ============================================================================
# Endpoints
# ============================================================================

@router.get("", response_model=NoteListResponse)
async def list_notes(
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.NOTES_READ)),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List notes for the authenticated user."""
    # Build query
    query = {"user_id": PydanticObjectId(mcp_user.user_id)}
    
    if project_id:
        query["project_id"] = PydanticObjectId(project_id)
    
    # Execute query
    notes_query = Note.find(query)
    
    # Text search if provided (simple contains for now)
    # TODO: Use MongoDB text search index for better performance
    if search:
        notes = await notes_query.to_list()
        search_lower = search.lower()
        notes = [
            n for n in notes 
            if search_lower in n.title.lower() 
            or (n.content and search_lower in n.content.lower())
        ]
        total = len(notes)
        notes = notes[offset:offset + limit]
    else:
        notes = await notes_query.skip(offset).limit(limit).to_list()
        total = await Note.find(query).count()
    
    note_responses = [await note_to_response(n) for n in notes]
    
    return NoteListResponse(notes=note_responses, total=total)


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.NOTES_READ)),
):
    """Get a specific note by ID."""
    try:
        note = await Note.get(PydanticObjectId(note_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note or str(note.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return await note_to_response(note)


@router.post("", response_model=NoteResponse, status_code=201)
async def create_note(
    request: NoteCreateRequest,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.NOTES_WRITE)),
):
    """Create a new note."""
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
    
    note = Note(
        title=request.title,
        content=request.content,
        project_id=project_id,
        user_id=PydanticObjectId(mcp_user.user_id),
    )
    await note.insert()
    
    return await note_to_response(note)


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    request: NoteUpdateRequest,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.NOTES_WRITE)),
):
    """Update an existing note."""
    try:
        note = await Note.get(PydanticObjectId(note_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note or str(note.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Note not found")
    
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
    
    for key, value in update_data.items():
        setattr(note, key, value)
    
    note.updated_at = datetime.utcnow()
    await note.save()
    
    return await note_to_response(note)


@router.delete("/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    mcp_user: MCPUser = Depends(require_scope(OAuthScope.NOTES_WRITE)),
):
    """Delete a note."""
    try:
        note = await Note.get(PydanticObjectId(note_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note or str(note.user_id) != mcp_user.user_id:
        raise HTTPException(status_code=404, detail="Note not found")
    
    await note.delete()
