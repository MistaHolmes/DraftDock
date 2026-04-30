from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from db import get_db, disconnect_db  # noqa: E402
from routers import users, projects, tasks  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect DB
    await get_db()
    yield
    # Shutdown: disconnect
    await disconnect_db()


app = FastAPI(title="DockStudio API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=(lambda: (
        # Default local dev origins
        [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:3004",
        ]
    ) + (
        # Append any comma-separated FRONTEND_URLS from environment (e.g. https://your-app.vercel.app)
        [u.strip() for u in os.getenv("FRONTEND_URLS", "").split(",") if u.strip()]
    ))(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)


@app.get("/health")
def health():
    return {"status": "ok"}
