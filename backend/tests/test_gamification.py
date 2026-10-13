from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.gamification import service as gamification_service
from app.gamification.models import Badge, Streak, XpEvent
from app.gamification.rules import BADGES, XpReason, activity_xp, graded_xp, round_half_up
from app.gamification.service import award, sync_badges, xp_total
from tests.factories import make_user

NOON = datetime(2026, 10, 11, 7, 0, tzinfo=UTC)  # Toshkentda 12:00


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


async def test_award_writes_each_event_once(db: AsyncSession) -> None:
    user = await make_user(db)
    first = await award(
        db, user.id, XpReason.activity_completed, ref_type="activity", ref_id=1, amount=18, now=NOON
    )
    second = await award(
        db, user.id, XpReason.activity_completed, ref_type="activity", ref_id=1, amount=18, now=NOON
    )
    await db.commit()
    assert first.xp == 18
    assert second.xp == 0 and second.new_badges == []
    assert await xp_total(db, user.id) == 18
    rows = list(await db.scalars(select(XpEvent).where(XpEvent.user_id == user.id)))
    assert len(rows) == 1


async def test_first_step_badge_is_awarded_once(db: AsyncSession) -> None:
    user = await make_user(db)
    first = await award(
        db, user.id, XpReason.step_completed, ref_type="step", ref_id=5, amount=10, now=NOON
    )
    again = await award(
        db, user.id, XpReason.step_completed, ref_type="step", ref_id=6, amount=10, now=NOON
    )
    assert [b.code for b in first.new_badges] == ["first_step"]
    assert again.new_badges == []


async def test_streak_grows_on_consecutive_days_and_awards_badge(db: AsyncSession) -> None:
    user = await make_user(db)
    rewards = []
    for day in range(3):
        rewards.append(
            await award(
                db,
                user.id,
                XpReason.step_completed,
                ref_type="step",
                ref_id=day + 1,
                amount=10,
                now=NOON + timedelta(days=day),
            )
        )
    await db.commit()
    streak = await db.get(Streak, user.id)
    assert streak is not None
    assert (streak.current, streak.longest) == (3, 3)
    assert [b.code for b in rewards[2].new_badges] == ["streak_3"]


async def test_streak_uses_tashkent_day_boundary(db: AsyncSession) -> None:
    user = await make_user(db)
    late = datetime(2026, 10, 11, 18, 59, tzinfo=UTC)  # Toshkentda 23:59
    await award(
        db, user.id, XpReason.step_completed, ref_type="step", ref_id=1, amount=10, now=late
    )
    await award(
        db,
        user.id,
        XpReason.step_completed,
        ref_type="step",
        ref_id=2,
        amount=10,
        now=late + timedelta(minutes=1),  # Toshkentda ertasi kun 00:00
    )
    streak = await db.get(Streak, user.id)
    assert streak is not None and streak.current == 2


async def test_streak_same_day_unchanged_and_resets_after_gap(db: AsyncSession) -> None:
    user = await make_user(db)
    moments = [NOON, NOON + timedelta(hours=3), NOON + timedelta(days=1), NOON + timedelta(days=4)]
    for index, moment in enumerate(moments, start=1):
        await award(
            db,
            user.id,
            XpReason.step_completed,
            ref_type="step",
            ref_id=index,
            amount=10,
            now=moment,
        )
    streak = await db.get(Streak, user.id)
    assert streak is not None
    assert (streak.current, streak.longest) == (1, 2)


async def test_zero_xp_event_does_not_touch_streak(db: AsyncSession) -> None:
    user = await make_user(db)
    rewards = await award(
        db, user.id, XpReason.task_graded, ref_type="submission", ref_id=1, amount=0, now=NOON
    )
    assert rewards.xp == 0
    assert await db.get(Streak, user.id) is None


async def test_topic_badges_follow_completed_topics(db: AsyncSession) -> None:
    user = await make_user(db)
    codes: list[str] = []
    for topic_id in range(1, 6):
        rewards = await award(
            db,
            user.id,
            XpReason.topic_completed,
            ref_type="topic",
            ref_id=topic_id,
            amount=50,
            now=NOON,
        )
        codes += [b.code for b in rewards.new_badges]
    assert codes == ["first_topic", "topics_5"]


async def test_sync_badges_survives_concurrent_insert(
    db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Bir nechta worker bir vaqtda ishga tushganda boshqa jarayon nishonlarni allaqachon
    qo'shgan bo'ladi: unique to'qnashuv ishga tushishni buzmasligi kerak."""
    badge = await db.scalar(select(Badge).where(Badge.code == "first_step"))
    assert badge is not None
    badge.title_uz = "Eski nom"
    await db.commit()

    async def nothing_seen(_db: AsyncSession) -> dict[str, Any]:
        return {}

    monkeypatch.setattr(gamification_service, "_existing_badges", nothing_seen)
    await sync_badges(db)

    badges = list(await db.scalars(select(Badge)))
    assert len(badges) == 10
    await db.refresh(badge)
    assert badge.title_uz == "Birinchi qadam"


async def test_award_does_not_hide_other_integrity_errors(db: AsyncSession) -> None:
    """Faqat takroriy hodisa jim o'tadi; boshqa xato (mavjud bo'lmagan foydalanuvchi, FK)
    yashirilmasligi kerak."""
    with pytest.raises(IntegrityError):
        await award(
            db,
            999_999,
            XpReason.step_completed,
            ref_type="step",
            ref_id=1,
            amount=10,
            now=NOON,
        )
