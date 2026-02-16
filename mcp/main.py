"""
MCP Server for Track.

This module provides the MCP (Model Context Protocol) server endpoints,
allowing AI agents and external applications to interact with Track.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from api.config import get_settings
from api.schemas.orm.user import User
from api.schemas.orm.project import Project
from api.schemas.orm.task import Task
from api.schemas.orm.note import Note

from mcp.oauth.models import OAUTH_MODELS
from mcp.oauth.routes import router as oauth_router
from mcp.tools.tasks import router as tasks_router
from mcp.tools.notes import router as notes_router
from mcp.tools.projects import router as projects_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database connection and Beanie ODM."""
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    
    # Initialize Beanie with all document models
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[User, Project, Task, Note] + OAUTH_MODELS,
    )
    
    yield
    
    client.close()


app = FastAPI(
    title="Track MCP Server",
    description="Model Context Protocol server for Track task management",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
cors_origins = settings.cors_origins.split(",") if settings.cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(oauth_router)
app.include_router(tasks_router)
app.include_router(notes_router)
app.include_router(projects_router)


@app.get("/mcp/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "mcp"}


@app.get("/mcp/tools")
async def list_tools():
    """List available MCP tools for discovery."""
    return {
        "tools": [
            {
                "name": "tasks",
                "description": "Manage tasks (create, read, update, delete, complete)",
                "endpoints": [
                    {"method": "GET", "path": "/mcp/tools/tasks", "description": "List tasks"},
                    {"method": "GET", "path": "/mcp/tools/tasks/{id}", "description": "Get task"},
                    {"method": "POST", "path": "/mcp/tools/tasks", "description": "Create task"},
                    {"method": "PATCH", "path": "/mcp/tools/tasks/{id}", "description": "Update task"},
                    {"method": "POST", "path": "/mcp/tools/tasks/{id}/complete", "description": "Complete task"},
                    {"method": "DELETE", "path": "/mcp/tools/tasks/{id}", "description": "Delete task"},
                ],
                "scopes": ["tasks:read", "tasks:write"],
            },
            {
                "name": "notes",
                "description": "Manage notes (create, read, update, delete)",
                "endpoints": [
                    {"method": "GET", "path": "/mcp/tools/notes", "description": "List notes"},
                    {"method": "GET", "path": "/mcp/tools/notes/{id}", "description": "Get note"},
                    {"method": "POST", "path": "/mcp/tools/notes", "description": "Create note"},
                    {"method": "PATCH", "path": "/mcp/tools/notes/{id}", "description": "Update note"},
                    {"method": "DELETE", "path": "/mcp/tools/notes/{id}", "description": "Delete note"},
                ],
                "scopes": ["notes:read", "notes:write"],
            },
            {
                "name": "projects",
                "description": "Manage projects (create, read, update, delete)",
                "endpoints": [
                    {"method": "GET", "path": "/mcp/tools/projects", "description": "List projects"},
                    {"method": "GET", "path": "/mcp/tools/projects/{id}", "description": "Get project"},
                    {"method": "POST", "path": "/mcp/tools/projects", "description": "Create project"},
                    {"method": "PATCH", "path": "/mcp/tools/projects/{id}", "description": "Update project"},
                    {"method": "DELETE", "path": "/mcp/tools/projects/{id}", "description": "Delete project"},
                ],
                "scopes": ["projects:read", "projects:write"],
            },
        ],
        "oauth": {
            "authorization_endpoint": "/mcp/oauth/authorize",
            "token_endpoint": "/mcp/oauth/token",
            "revocation_endpoint": "/mcp/oauth/revoke",
            "scopes": [
                "tasks:read", "tasks:write",
                "notes:read", "notes:write",
                "projects:read", "projects:write",
                "profile:read",
            ],
        },
    }


@app.get("/mcp/schema")
async def get_schema():
    """Return OpenAPI schema for MCP endpoints."""
    return app.openapi()
