"""
Goals controller — POST /goals, PATCH /goals/{goal_id}, GET /goals.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from supabase._async.client import AsyncClient

from backend.auth import get_current_user
from backend.db import get_db
from backend.schemas.goals import GoalCreate, GoalUpdate
from backend.services.goals_service import create_goal, list_goals, update_goal

router = APIRouter()


@router.post("/goals", status_code=201)
async def post_goal(
    body: GoalCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> dict:
    """Create a new goal for the authenticated user."""
    return await create_goal(user_id, str(body.action_id), db)


@router.patch("/goals/{goal_id}")
async def patch_goal(
    goal_id: str,
    body: GoalUpdate,
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> dict:
    """Update the status of an existing goal."""
    return await update_goal(user_id, goal_id, body.status, db)


@router.get("/goals")
async def get_goals(
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> list:
    """Return all goals for the authenticated user ordered by committed_at desc."""
    return await list_goals(user_id, db)
