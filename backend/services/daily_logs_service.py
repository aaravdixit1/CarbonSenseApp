"""
Daily logs service — upsert and retrieve daily habit logs.
"""

from __future__ import annotations

from supabase._async.client import AsyncClient

from backend.schemas.daily_logs import DailyLogCreate, DailyLogResponse

# kg CO2e savings per habit_id — mirrors src/lib/dailyHabits.ts
HABIT_SAVINGS_KG: dict[str, float] = {
    "no_car_today": 3.2,
    "carpooled": 1.6,
    "short_trip_walk": 0.8,
    "no_meat_today": 2.5,
    "local_meal": 0.9,
    "no_food_waste": 0.5,
    "shorter_shower": 0.4,
    "lights_off": 0.2,
    "lower_thermostat": 0.6,
    "no_new_purchase": 1.2,
    "secondhand": 2.0,
}


def _total_savings(habit_ids: list[str]) -> float:
    return round(sum(HABIT_SAVINGS_KG.get(h, 0.0) for h in habit_ids), 2)


async def upsert_daily_log(
    user_id: str,
    body: DailyLogCreate,
    db: AsyncClient,
) -> DailyLogResponse:
    data = {
        "user_id": user_id,
        "date": body.date,
        "completed_habit_ids": body.completed_habit_ids,
        "note": body.note,
        "total_savings_kg": _total_savings(body.completed_habit_ids),
    }
    await db.table("daily_logs").upsert(data, on_conflict="user_id,date").execute()
    return DailyLogResponse(
        date=body.date,
        completed_habit_ids=body.completed_habit_ids,
        note=body.note,
        total_savings_kg=data["total_savings_kg"],
    )


async def get_daily_logs(
    user_id: str,
    db: AsyncClient,
    limit: int = 30,
) -> list[DailyLogResponse]:
    result = (
        await db.table("daily_logs")
        .select("date, completed_habit_ids, note, total_savings_kg")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .limit(limit)
        .execute()
    )
    return [
        DailyLogResponse(
            date=row["date"],
            completed_habit_ids=row["completed_habit_ids"],
            note=row.get("note"),
            total_savings_kg=row["total_savings_kg"],
        )
        for row in (result.data or [])
    ]
