from pydantic import BaseModel
from typing import Optional


class DailyLogCreate(BaseModel):
    date: str                        # YYYY-MM-DD
    completed_habit_ids: list[str]
    note: Optional[str] = None


class DailyLogResponse(BaseModel):
    date: str
    completed_habit_ids: list[str]
    note: Optional[str] = None
    total_savings_kg: float
