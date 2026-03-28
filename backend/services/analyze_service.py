"""
Analyze service — orchestrates footprint computation, AI recommendations,
caching, rate limiting, and persistence for POST /analyze.
"""

from __future__ import annotations

import uuid

from supabase._async.client import AsyncClient

from backend.models import AnalyzeResponse, HabitProfile
from backend.emissions_db import emissions_db
from backend.footprint_engine import compute_footprint
from backend.ai_pipeline import generate_recommendations
from backend.cache import AnalyzeCache
from backend.rate_limiter import RateLimiter


async def run_analyze(
    user_id: str,
    profile: HabitProfile,
    db: AsyncClient,
    cache: AnalyzeCache,
    rate_limiter: RateLimiter,
) -> AnalyzeResponse:
    """Run the full analyze pipeline for the authenticated user.

    Steps:
    1. Enforce rate limit (raises HTTP 429 if exceeded).
    2. Check cache — on hit skip computation, go to step 5.
    3. On miss: compute footprint and generate recommendations.
    4. Build AnalyzeResponse.
    5. Upsert footprint_results (one row per user, replace on conflict).
    6. Delete existing actions for user, then insert new ones.
    7. Store response in cache.
    8. Return AnalyzeResponse.
    """
    # Step 1: rate limit check
    rate_limiter.check(user_id)

    # Step 2: cache lookup
    cached = cache.get(profile)

    if cached is not None:
        response = cached
    else:
        # Step 3: compute
        db_version = emissions_db.get_active_version()
        footprint = compute_footprint(profile, db_version)
        actions, fallback_used = await generate_recommendations(profile, footprint, db_version)

        # Step 4: build response
        response = AnalyzeResponse(
            footprint=footprint,
            actions=actions,
            session_id=str(uuid.uuid4()),
            fallback_used=fallback_used,
        )

    # Step 5: upsert footprint_results (one row per user)
    footprint_data = {
        "user_id": user_id,
        "total_tco2e": response.footprint.total_tco2e,
        "db_version": response.footprint.db_version,
        "fallback_used": response.fallback_used,
        "breakdown": [b.model_dump() for b in response.footprint.breakdown],
        "factors_used": response.footprint.factors_used,
    }
    await db.table("footprint_results").upsert(footprint_data, on_conflict="user_id").execute()

    # Step 6: delete existing actions, then insert new ones
    await db.table("actions").delete().eq("user_id", user_id).execute()

    if response.actions:
        actions_data = [
            {
                "user_id": user_id,
                "description": action.description,
                "savings_tco2e": action.savings_tco2e,
                "impact_label": action.impact_label,
                "rank": action.rank,
                "composite_score": action.composite_score,
            }
            for action in response.actions
        ]
        await db.table("actions").insert(actions_data).execute()

    # Step 7: update cache
    cache.set(profile, response)

    # Step 8: return
    return response
