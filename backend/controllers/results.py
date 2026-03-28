"""
Results controller — GET /results.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from supabase._async.client import AsyncClient

from backend.auth import get_current_user
from backend.db import get_db
from backend.services.results_service import get_results

router = APIRouter()


@router.get("/results")
async def get_results_route(
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> dict:
    """Return the authenticated user's most recent footprint result."""
    return await get_results(user_id, db)
