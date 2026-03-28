"""
Profile controller — PUT /profile and GET /profile.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from supabase._async.client import AsyncClient

from backend.auth import get_current_user
from backend.db import get_db
from backend.models import HabitProfile
from backend.services.profile_service import get_profile, upsert_profile

router = APIRouter()


@router.put("/profile")
async def put_profile(
    profile: HabitProfile,
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> dict:
    """Upsert the authenticated user's habit profile and return the saved row."""
    return await upsert_profile(user_id, profile, db)


@router.get("/profile")
async def get_profile_route(
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> dict:
    """Return the authenticated user's stored habit profile."""
    return await get_profile(user_id, db)
