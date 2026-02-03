from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from api.config import get_settings
from api.schemas.orm.user import User
from api.schemas.orm.category import Category
from api.schemas.orm.task import Task
from api.schemas.orm.note import Note
from api.routes import auth, categories, tasks, notes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[User, Category, Task, Note],
    )
    yield
    # Shutdown
    client.close()


app = FastAPI(
    title="Track API",
    description="Task tracking application API",
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
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(tasks.router)
app.include_router(notes.router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/schema")
async def get_schema():
    return app.openapi()
