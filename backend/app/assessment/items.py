"""Faoliyat elementlarini (savollar, bayonotlar, so'zlar) yuklash."""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Activity, ActivityType, CrosswordWord, QuizQuestion, YesNoItem

ActivityItem = QuizQuestion | YesNoItem | CrosswordWord


async def _load[ItemT: (QuizQuestion, YesNoItem, CrosswordWord)](
    db: AsyncSession, model: type[ItemT], activity_ids: list[int]
) -> list[ItemT]:
    if not activity_ids:
        return []
    return list(
        await db.scalars(
            select(model)
            .where(model.activity_id.in_(activity_ids))
            .order_by(model.activity_id, model.order, model.id)
        )
    )


async def load_items(
    db: AsyncSession, activities: Sequence[Activity]
) -> dict[int, list[ActivityItem]]:
    """Har faoliyat uchun elementlar ro'yxati (tartib bo'yicha)."""
    result: dict[int, list[ActivityItem]] = {activity.id: [] for activity in activities}

    def ids_of(activity_type: ActivityType) -> list[int]:
        return [a.id for a in activities if a.type == activity_type]

    for question in await _load(db, QuizQuestion, ids_of(ActivityType.quiz)):
        result[question.activity_id].append(question)
    for statement in await _load(db, YesNoItem, ids_of(ActivityType.yesno)):
        result[statement.activity_id].append(statement)
    for word in await _load(db, CrosswordWord, ids_of(ActivityType.crossword)):
        result[word.activity_id].append(word)
    return result
