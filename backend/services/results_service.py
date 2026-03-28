"""
Results service — fetch footprint_results rows.
"""

from __future__ import annotations

from fastapi import HTTPException
from supabase._async.client import AsyncClient


async def get_results(user_id: str, db: AsyncClient) -> dict:
    """Fetch the most recent footprint result for the given user.

    Raises:
        HTTPException(404): when no result exists for the user.
    """
    response = (
        await db.table("footprint_results")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail={"error": "results_not_found"})

    return response.data[0]
