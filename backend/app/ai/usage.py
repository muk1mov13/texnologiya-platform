"""Talabaning kunlik AI so'rovlari (Asia/Tashkent sanasi bo'yicha).

O'qituvchi va admin limitga tushmaydi va hisoblanmaydi.
"""

from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models import AiUsage
from app.ai.services import get_ai_settings
from app.auth.models import Role, User
from app.core.errors import AppError
from app.core.types import utcnow

TASHKENT = ZoneInfo("Asia/Tashkent")


def today(now: datetime | None = None) -> date:
    return (now or utcnow()).astimezone(TASHKENT).date()


async def used_today(db: AsyncSession, user_id: int) -> int:
    value = await db.scalar(
        select(AiUsage.requests).where(AiUsage.user_id == user_id, AiUsage.day == today())
    )
    return int(value or 0)


async def ensure_within_limit(db: AsyncSession, user: User) -> None:
    if user.role != Role.student:
        return
    limit = (await get_ai_settings(db)).student_daily_limit
    if await used_today(db, user.id) >= limit:
        raise AppError(
            429, "AI_LIMIT_REACHED", "Bugungi AI so'rovlari limiti tugadi", {"limit": limit}
        )


async def _increment(db: AsyncSession, user_id: int, day: date) -> int:
    result = await db.execute(
        update(AiUsage)
        .where(AiUsage.user_id == user_id, AiUsage.day == day)
        .values(requests=AiUsage.requests + 1)
    )
    return int(result.rowcount)  # type: ignore[attr-defined]


async def record_request(db: AsyncSession, user: User) -> None:
    """Atomik +1. Commit qilmaydi — chaqiruvchi commit qiladi."""
    if user.role != Role.student:
        return
    day = today()
    if await _increment(db, user.id, day):
        return
    try:
        async with db.begin_nested():
            db.add(AiUsage(user_id=user.id, day=day, requests=1))
    except IntegrityError:  # parallel so'rov qatorni yaratib ulgurgan
        await _increment(db, user.id, day)
