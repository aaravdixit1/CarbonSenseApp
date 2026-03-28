"""
Profile service — upsert and fetch habit_profiles rows.
"""

from __future__ import annotations

from fastapi import HTTPException
from supabase._async.client import AsyncClient

from backend.models import HabitProfile


async def upsert_profile(user_id: str, profile: HabitProfile, db: AsyncClient) -> dict:
    """Upsert a HabitProfile for the given user and return the saved row.

    Uses ON CONFLICT (user_id) DO UPDATE so that repeated PUT /profile calls
    replace the existing row rather than inserting a duplicate.
    """
    data = {
        "user_id": user_id,
        "transport_method": profile.transport_method,
        "car_type": profile.car_type,
        "diet_type": profile.diet_type,
        "meat_frequency": profile.meat_frequency,
        "home_energy_source": profile.home_energy_source,
        "household_size": profile.household_size,
        "shopping_frequency": profile.shopping_frequency,
        "flight_frequency": profile.flight_frequency,
    }

    response = (
        await db.table("habit_profiles")
        .upsert(data, on_conflict="user_id")
        .execute()
    )

    return response.data[0]


async def get_profile(user_id: str, db: AsyncClient) -> dict:
    """Fetch the habit profile for the given user.

    Raises:
        HTTPException(404): when no profile exists for the user.
    """
    response = (
        await db.table("habit_profiles")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail={"error": "profile_not_found"})

    return response.data[0]
