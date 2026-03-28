"""
Analyze controller — POST /analyze.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from supabase._async.client import AsyncClient

from backend.auth import get_current_user
from backend.db import get_db
from backend.cache import analyze_cache
from backend.rate_limiter import rate_limiter
from backend.models import AnalyzeResponse, HabitProfile
from backend.services.analyze_service import run_analyze

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    profile: HabitProfile,
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> AnalyzeResponse:
    """Compute footprint, generate recommendations, persist, and return AnalyzeResponse."""
    return await run_analyze(
        user_id=user_id,
        profile=profile,
        db=db,
        cache=analyze_cache,
        rate_limiter=rate_limiter,
    )
