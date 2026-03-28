from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class GoalCreate(BaseModel):
    action_id: UUID


class GoalUpdate(BaseModel):
    status: Literal['active', 'completed', 'dismissed']


class GoalOut(BaseModel):
    id: UUID
    user_id: UUID
    action_id: UUID
    status: str
    committed_at: datetime
    completed_at: datetime | None
