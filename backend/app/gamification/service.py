from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.types import utcnow
from app.gamification.models import Badge, Streak, UserBadge, XpEvent
from app.gamification.rules import BADGES, BadgeRule, XpReason
from app.gamification.schemas import BadgeBrief, BadgeOut, ProfileOut, RewardsOut, StreakOut

# O'zbekistonda 1992 yildan beri yozgi vaqt yo'q: doimiy UTC+5.
TASHKENT = timezone(timedelta(hours=5), "Asia/Tashkent")


@dataclass
class Rewards:
    xp: int = 0
    new_badges: list[Badge] = field(default_factory=list)

    def __add__(self, other: "Rewards") -> "Rewards":
        return Rewards(self.xp + other.xp, [*self.new_badges, *other.new_badges])


def rewards_out(rewards: Rewards) -> RewardsOut:
    return RewardsOut(
        xp=rewards.xp, new_badges=[BadgeBrief.model_validate(b) for b in rewards.new_badges]
    )


def local_date(moment: datetime) -> date:
    return moment.astimezone(TASHKENT).date()


async def _existing_badges(db: AsyncSession) -> dict[str, Badge]:
    return {badge.code: badge for badge in await db.scalars(select(Badge))}


def _apply_rule(badge: Badge, rule: BadgeRule) -> None:
    badge.icon = rule.icon
    badge.title_uz = rule.title_uz
    badge.title_ru = rule.title_ru
    badge.description_uz = rule.description_uz
    badge.description_ru = rule.description_ru


async def sync_badges(db: AsyncSession) -> None:
    """Kodda ta'riflangan nishonlarni bazaga yozadi (qo'shadi yoki yangilaydi). Idempotent;
    ro'yxatda yo'q nishonlar o'chirilmaydi. Bir nechta jarayon bir vaqtda ishga tushsa ham
    xavfsiz: boshqa jarayon shu orada qo'shgan nishon qayta o'qilib yangilanadi."""
    existing = await _existing_badges(db)
    for rule in BADGES:
        badge = existing.get(rule.code)
        if badge is None:
            candidate = Badge(code=rule.code)
            _apply_rule(candidate, rule)
            try:
                async with db.begin_nested():
                    db.add(candidate)
                    await db.flush()
                continue
            except IntegrityError:
                badge = await db.scalar(select(Badge).where(Badge.code == rule.code))
                if badge is None:
                    raise
        _apply_rule(badge, rule)
    await db.commit()


async def award(
    db: AsyncSession,
    user_id: int,
    reason: XpReason,
    *,
    ref_type: str,
    ref_id: int,
    amount: int,
    now: datetime | None = None,
) -> Rewards:
    """XP hodisasini yozadi, seriyani yangilaydi va nishonlarni tekshiradi. Hodisa avval
    yozilgan bo'lsa (unique cheklov), hech narsa o'zgarmaydi. Commit qilmaydi."""
    moment = now or utcnow()
    event = XpEvent(
        user_id=user_id,
        amount=amount,
        reason=reason.value,
        ref_type=ref_type,
        ref_id=ref_id,
        created_at=moment,
    )
    try:
        async with db.begin_nested():
            db.add(event)
            await db.flush()
    except IntegrityError:
        return Rewards()
    if amount > 0:
        await _touch_streak(db, user_id, local_date(moment))
    return Rewards(xp=amount, new_badges=await _award_badges(db, user_id, moment))


async def _touch_streak(db: AsyncSession, user_id: int, today: date) -> None:
    streak = await db.get(Streak, user_id)
    if streak is None:
        candidate = Streak(user_id=user_id, current=0, longest=0)
        try:
            async with db.begin_nested():
                db.add(candidate)
                await db.flush()
            streak = candidate
        except IntegrityError:
            streak = await db.get(Streak, user_id)
            if streak is None:
                raise
    if streak.last_active_date == today:
        return
    if streak.last_active_date == today - timedelta(days=1):
        streak.current += 1
    else:
        streak.current = 1
    streak.longest = max(streak.longest, streak.current)
    streak.last_active_date = today
    await db.flush()


async def _award_badges(db: AsyncSession, user_id: int, moment: datetime) -> list[Badge]:
    owned = set(await db.scalars(select(UserBadge.badge_id).where(UserBadge.user_id == user_id)))
    badges = {badge.code: badge for badge in await db.scalars(select(Badge))}
    counts: dict[str, int] = {
        row.reason: int(row.n)
        for row in await db.execute(
            select(XpEvent.reason, func.count().label("n"))
            .where(XpEvent.user_id == user_id)
            .group_by(XpEvent.reason)
        )
    }
    streak = await db.get(Streak, user_id)
    current_streak = streak.current if streak is not None else 0
    new: list[Badge] = []
    for rule in BADGES:
        badge = badges.get(rule.code)
        if badge is None or badge.id in owned:
            continue
        if rule.reasons:
            value = sum(counts.get(reason.value, 0) for reason in rule.reasons)
        else:
            value = current_streak
        if value < rule.threshold:
            continue
        try:
            async with db.begin_nested():
                db.add(UserBadge(user_id=user_id, badge_id=badge.id, awarded_at=moment))
                await db.flush()
        except IntegrityError:
            continue
        new.append(badge)
    return new


async def xp_total(db: AsyncSession, user_id: int) -> int:
    total = await db.scalar(
        select(func.coalesce(func.sum(XpEvent.amount), 0)).where(XpEvent.user_id == user_id)
    )
    return int(total or 0)


async def profile(db: AsyncSession, user_id: int, now: datetime) -> ProfileOut:
    """XP, seriya va nishonlar. Seriya kechadan eski bo'lsa, `current` 0 deb ko'rsatiladi."""
    today = local_date(now)
    streak = await db.get(Streak, user_id)
    current = longest = 0
    active_today = False
    if streak is not None:
        longest = streak.longest
        last = streak.last_active_date
        if last is not None and last >= today - timedelta(days=1):
            current = streak.current
        active_today = last == today
    owned = {
        row.badge_id: row.awarded_at
        for row in await db.execute(
            select(UserBadge.badge_id, UserBadge.awarded_at).where(UserBadge.user_id == user_id)
        )
    }
    by_code = {badge.code: badge for badge in await db.scalars(select(Badge))}
    badges = [
        BadgeOut(
            code=badge.code,
            icon=badge.icon,
            title_uz=badge.title_uz,
            title_ru=badge.title_ru,
            description_uz=badge.description_uz,
            description_ru=badge.description_ru,
            awarded_at=owned.get(badge.id),
        )
        for rule in BADGES
        if (badge := by_code.get(rule.code)) is not None
    ]
    return ProfileOut(
        xp_total=await xp_total(db, user_id),
        streak=StreakOut(current=current, longest=longest, active_today=active_today),
        badges=badges,
    )
