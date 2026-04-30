from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from prisma import Json, Prisma

from auth import verify_clerk_token
from db import get_db
from services.ai import generate_plan, repair_error
from routers.projects import get_current_user

router = APIRouter(tags=["tasks"])


class TaskCreate(BaseModel):
    prompt: str


class RepairBody(BaseModel):
    error_log: str
    files: dict[str, str]


# ── POST /api/projects/{project_id}/tasks ─────────────────────
@router.post("/api/projects/{project_id}/tasks", status_code=201)
async def create_task(
    project_id: str,
    body: TaskCreate,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    # Verify project belongs to user
    project = await db.project.find_first(
        where={"id": project_id, "userId": user.id}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Create task in pending state
    task = await db.task.create(
        data={
            "projectId": project_id,
            "userId": user.id,
            "prompt": body.prompt,
            "status": "pending",
        }
    )

    # Call Claude to get a plan
    try:
        plan = generate_plan(body.prompt, project.templateType)
    except Exception as e:
        await db.task.update(where={"id": task.id}, data={"status": "failed"})
        raise HTTPException(
            status_code=500, detail=f"AI plan generation failed: {str(e)}"
        )

    # Save plan JSON to task
    task = await db.task.update(
        where={"id": task.id},
        data={"planJson": Json(plan), "status": "planned"},
    )

    # Create task steps for tracking
    for i, step in enumerate(plan.get("steps", [])):
        await db.taskstep.create(
            data={
                "taskId": task.id,
                "stepType": step.get("step_type", "create_file"),
                "title": step.get("title", f"Step {i + 1}"),
                "description": step.get("description", ""),
                "orderIndex": i,
            }
        )

    # Re-fetch with steps included
    task = await db.task.find_unique(
        where={"id": task.id}, include={"steps": True}
    )
    return task


# ── GET /api/projects/{project_id}/tasks ──────────────────────
@router.get("/api/projects/{project_id}/tasks")
async def list_tasks(
    project_id: str,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    return await db.task.find_many(
        where={"projectId": project_id},
        order={"createdAt": "desc"},
        include={"steps": True},
    )


# ── POST /api/tasks/{task_id}/approve ─────────────────────────
@router.post("/api/tasks/{task_id}/approve")
async def approve_task(
    task_id: str,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    task = await db.task.find_unique(where={"id": task_id})
    if not task or task.userId != user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.approval.create(
        data={
            "taskId": task_id,
            "userId": user.id,
            "approved": True,
            "approvedAt": datetime.now(timezone.utc),
        }
    )

    updated = await db.task.update(
        where={"id": task_id},
        data={"status": "approved"},
        include={"steps": True},
    )
    return updated


# ── GET /api/tasks/{task_id} ──────────────────────────────────
@router.get("/api/tasks/{task_id}")
async def get_task(
    task_id: str,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    task = await db.task.find_first(
        where={"id": task_id, "userId": user.id},
        include={"steps": True},
    )
    if not task:
        raise HTTPException(status_code=404, detail="Not found")
    return task


# ── DELETE /api/tasks/{task_id} ────────────────────────────
@router.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: str,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    task = await db.task.find_unique(where={"id": task_id})
    if not task or task.userId != user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete the task (tasksteps will be removed via cascade if configured).
    await db.task.delete(where={"id": task_id})

    return {"deleted": True}


# ── POST /api/tasks/{task_id}/repair (Phase 6) ───────────────
@router.post("/api/tasks/{task_id}/repair")
async def repair_task(
    task_id: str,
    body: RepairBody,
    user=Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    task = await db.task.find_unique(where={"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        repair_plan = repair_error(task.prompt, body.error_log, body.files)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"AI repair failed: {str(e)}"
        )

    new_task = await db.task.create(
        data={
            "projectId": task.projectId,
            "userId": user.id,
            "prompt": f"[AUTO-REPAIR] {task.prompt}",
            "planJson": Json(repair_plan),
            "status": "planned",
        }
    )

    for i, step in enumerate(repair_plan.get("steps", [])):
        await db.taskstep.create(
            data={
                "taskId": new_task.id,
                "stepType": step.get("step_type", "create_file"),
                "title": step.get("title", f"Step {i + 1}"),
                "description": step.get("description", ""),
                "orderIndex": i,
            }
        )

    new_task = await db.task.find_unique(
        where={"id": new_task.id}, include={"steps": True}
    )
    return new_task
