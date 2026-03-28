from typing import Literal, Optional
from pydantic import BaseModel


class HabitProfile(BaseModel):
    transport_method: Literal['car', 'transit', 'cycling', 'walking']
    car_type: Optional[Literal['gasoline', 'diesel', 'hybrid', 'electric']] = None
    diet_type: Literal['omnivore', 'flexitarian', 'vegetarian', 'vegan']
    meat_frequency: Literal['daily', 'few_per_week', 'weekly', 'rarely']
    home_energy_source: Literal['grid', 'natural_gas', 'renewables', 'mixed']
    household_size: int  # 1–10
    shopping_frequency: Literal['rarely', 'monthly', 'weekly', 'daily']
    flight_frequency: Literal['none', 'one_or_two', 'several', 'frequent']


class CategoryBreakdown(BaseModel):
    category: Literal['food', 'transport', 'home_energy', 'shopping']
    absolute_tco2e: float
    percentage: float
    substituted: bool


class FootprintResult(BaseModel):
    total_tco2e: float
    breakdown: list[CategoryBreakdown]
    db_version: str
    factors_used: dict[str, float]


class Action(BaseModel):
    id: str
    description: str
    savings_tco2e: float
    impact_label: str
    rank: int  # 1–3
    composite_score: float


class AnalyzeResponse(BaseModel):
    footprint: FootprintResult
    actions: list[Action]
    session_id: str
    fallback_used: bool
