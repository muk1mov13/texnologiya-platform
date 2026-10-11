from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BadgeBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    icon: str
    title_uz: str
    title_ru: str


class RewardsOut(BaseModel):
    xp: int = 0
    new_badges: list[BadgeBrief] = []


class BadgeOut(BadgeBrief):
    description_uz: str
    description_ru: str
    awarded_at: datetime | None


class StreakOut(BaseModel):
    current: int
    longest: int
    active_today: bool


class ProfileOut(BaseModel):
    xp_total: int
    streak: StreakOut
    badges: list[BadgeOut]
