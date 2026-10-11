from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.gamification.models import Badge
from app.gamification.rules import BADGES, activity_xp, graded_xp, round_half_up
from app.gamification.service import sync_badges


def test_xp_rounding_is_half_up() -> None:
    assert round_half_up(2.5) == 3
    assert round_half_up(2.4) == 2
    assert activity_xp(4, 5) == 18
    assert activity_xp(0, 3) == 10
    assert activity_xp(1, 4) == 13  # 10 * 0.25 = 2.5 -> 3
    assert graded_xp(1, 4) == 8  # 30 * 0.25 = 7.5 -> 8
    assert graded_xp(0, 10) == 0


async def test_sync_badges_is_idempotent(db: AsyncSession) -> None:
    await sync_badges(db)
    await sync_badges(db)
    badges = list(await db.scalars(select(Badge)))
    assert len(badges) == 10
    assert sorted(b.code for b in badges) == sorted(rule.code for rule in BADGES)


async def test_sync_badges_restores_titles(db: AsyncSession) -> None:
    badge = await db.scalar(select(Badge).where(Badge.code == "first_step"))
    assert badge is not None
    badge.title_uz = "Eski nom"
    await db.commit()
    await sync_badges(db)
    await db.refresh(badge)
    assert badge.title_uz == "Birinchi qadam"
    assert badge.icon == "👣"
