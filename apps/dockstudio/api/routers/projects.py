import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from prisma import Prisma

from auth import verify_clerk_token
from db import get_db

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ── Pydantic schemas ──────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    templateType: str = "react-node"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class FileSave(BaseModel):
    path: str
    content: str
    language: Optional[str] = None
    task_id: Optional[str] = None


# ── Shared dependency: resolve Clerk JWT → DB User (auto-upsert) ──
async def get_current_user(
    payload: dict = Depends(verify_clerk_token),
    db: Prisma = Depends(get_db),
):
    clerk_id = payload["sub"]
    user = await db.user.find_unique(where={"clerkId": clerk_id})
    if not user:
        # Auto-create the user on first API call
        email = payload.get("email", payload.get("email_address", ""))
        name = payload.get("name", payload.get("first_name", ""))
        user = await db.user.create(
            data={
                "clerkId": clerk_id,
                "email": email if isinstance(email, str) else "",
                "name": name if isinstance(name, str) else "",
            }
        )
    return user


# ── CRUD routes ───────────────────────────────────────────────

@router.get("/")
async def list_projects(
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    return await db.project.find_many(
        where={"userId": user.id},
        order={"createdAt": "desc"},
    )


@router.post("/", status_code=201)
async def create_project(
    body: ProjectCreate,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    return await db.project.create(
        data={
            "userId": user.id,
            "name": body.name,
            "description": body.description,
            "templateType": body.templateType,
        }
    )


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    project = await db.project.find_first(
        where={"id": project_id, "userId": user.id}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Not found")
    return project


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    return await db.project.update(where={"id": project_id}, data=data)


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    await db.project.delete(where={"id": project_id})
    return {"success": True}


# ── File persistence (Phase 5) ───────────────────────────────

@router.put("/{project_id}/files")
async def save_file(
    project_id: str,
    body: FileSave,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    """Upsert a file and create a new version record."""
    content_hash = hashlib.md5(body.content.encode()).hexdigest()

    existing = await db.projectfile.find_first(
        where={"projectId": project_id, "path": body.path}
    )

    if existing:
        file = await db.projectfile.update(
            where={"id": existing.id},
            data={"contentHash": content_hash, "language": body.language},
        )
        version_count = await db.fileversion.count(
            where={"projectFileId": file.id}
        )
        version_number = version_count + 1
    else:
        file = await db.projectfile.create(
            data={
                "projectId": project_id,
                "path": body.path,
                "language": body.language,
                "contentHash": content_hash,
            }
        )
        version_number = 1

    version = await db.fileversion.create(
        data={
            "projectFileId": file.id,
            "taskId": body.task_id,
            "versionNumber": version_number,
            "content": body.content,
        }
    )

    return {"file": file, "version": version}


@router.get("/{project_id}/files")
async def list_files(
    project_id: str,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    return await db.projectfile.find_many(
        where={"projectId": project_id},
        include={"versions": {"order_by": {"version_number": "desc"}, "take": 1}},
    )
