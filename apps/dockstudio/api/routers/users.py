from fastapi import APIRouter, Depends
from prisma import Prisma
from auth import verify_clerk_token
from db import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/sync")
async def sync_user(
    payload: dict = Depends(verify_clerk_token),
    db: Prisma = Depends(get_db),
):
    """Called by frontend after login to sync Clerk user → DB."""
    clerk_id = payload["sub"]
    # Clerk stores email in different claim fields depending on JWT template
    email = payload.get("email", payload.get("primary_email", f"{clerk_id}@clerk.local"))
    first = payload.get("first_name", "")
    last = payload.get("last_name", "")
    name = f"{first} {last}".strip() or None
    avatar_url = payload.get("image_url")

    user = await db.user.upsert(
        where={"clerkId": clerk_id},
        data={
            "create": {
                "clerkId": clerk_id,
                "email": email,
                "name": name,
                "avatarUrl": avatar_url,
            },
            "update": {
                "email": email,
                "name": name,
                "avatarUrl": avatar_url,
            },
        },
    )
    return user
