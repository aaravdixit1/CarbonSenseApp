"""
Daily logs controller — POST /daily-logs, GET /daily-logs
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from supabase._async.client import AsyncClient

from backend.auth import get_current_user
from backend.db import get_db
from backend.schemas.daily_logs import DailyLogCreate, DailyLogResponse
from backend.services.daily_logs_service import upsert_daily_log, get_daily_logs

router = APIRouter()


@router.post("/daily-logs", response_model=DailyLogResponse, status_code=201)
async def post_daily_log(
    body: DailyLogCreate,
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> DailyLogResponse:
    """Upsert today's habit log for the authenticated user."""
    return await upsert_daily_log(user_id, body, db)


@router.get("/daily-logs", response_model=list[DailyLogResponse])
async def list_daily_logs(
    limit: int = Query(default=30, ge=1, le=90),
    user_id: str = Depends(get_current_user),
    db: AsyncClient = Depends(get_db),
) -> list[DailyLogResponse]:
    """Return the last N daily logs for the authenticated user."""
    return await get_daily_logs(user_id, db, limit=limit)
