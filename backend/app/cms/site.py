"""Sayt sozlamalari: kontaktlar, ijtimoiy tarmoqlar va "Biz haqimizda" (kalit → JSON)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cms.models import SiteSetting
from app.cms.schemas import SiteOut, SiteUpdate

SITE_KEYS = ("contacts", "socials", "about")


async def get_site(db: AsyncSession) -> SiteOut:
    rows = {s.key: s.value for s in await db.scalars(select(SiteSetting))}
    return SiteOut.model_validate({key: rows[key] for key in SITE_KEYS if key in rows})


async def update_site(db: AsyncSession, data: SiteUpdate) -> SiteOut:
    for key, value in data.model_dump(exclude_none=True).items():
        row = await db.get(SiteSetting, key)
        if row is None:
            db.add(SiteSetting(key=key, value=value))
        else:
            row.value = value
    await db.commit()
    return await get_site(db)
