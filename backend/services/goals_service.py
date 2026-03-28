"""
Goals service — create, update, and list goals rows.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from supabase._async.client import AsyncClient

_VALID_STATUSES = {"active", "completed", "dismissed"}


async def create_goal(user_id: str, action_id: str, db: AsyncClient) -> dict:
    """Insert a new goal with status='active' and return the created row."""
    data = {
        "user_id": user_id,
        "action_id": action_id,
        "status": "active",
    }

    response = await db.table("goals").insert(data).execute()
    return response.data[0]


async def update_goal(user_id: str, goal_id: str, status: str, db: AsyncClient) -> dict:
    """Update a goal's status and return the updated row.

    Raises:
        HTTPException(404): when the goal does not exist.
        HTTPException(403): when the goal belongs to a different user.
        HTTPException(400): when status is not a valid value.
    """
    if status not in _VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail={"error": f"invalid status '{status}'; must be one of {sorted(_VALID_STATUSES)}"},
        )

    fetch = await db.table("goals").select("*").eq("id", goal_id).execute()
    if not fetch.data:
        raise HTTPException(status_code=404, detail={"error": "goal_not_found"})

    goal = fetch.data[0]

    if goal["user_id"] != user_id:
        raise HTTPException(status_code=403, detail={"error": "forbidden"})

    update_data: dict = {"status": status}
    if status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()

    response = await db.table("goals").update(update_data).eq("id", goal_id).execute()
    return response.data[0]


async def list_goals(user_id: str, db: AsyncClient) -> list[dict]:
    """Return all goals for the user ordered by committed_at descending."""
    response = (
        await db.table("goals")
        .select("*")
        .eq("user_id", user_id)
        .order("committed_at", desc=True)
        .execute()
    )
    return response.data
