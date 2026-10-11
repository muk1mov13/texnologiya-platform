from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.gamification.models import Badge
from app.gamification.rules import BADGES


async def sync_badges(db: AsyncSession) -> None:
    """Kodda ta'riflangan nishonlarni bazaga yozadi (qo'shadi yoki yangilaydi). Idempotent;
    ro'yxatda yo'q nishonlar o'chirilmaydi."""
    existing = {badge.code: badge for badge in await db.scalars(select(Badge))}
    for rule in BADGES:
        badge = existing.get(rule.code)
        if badge is None:
            badge = Badge(code=rule.code)
            db.add(badge)
        badge.icon = rule.icon
        badge.title_uz = rule.title_uz
        badge.title_ru = rule.title_ru
        badge.description_uz = rule.description_uz
        badge.description_ru = rule.description_ru
    await db.commit()
