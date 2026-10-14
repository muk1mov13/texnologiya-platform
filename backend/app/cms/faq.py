"""Ko'p so'raladigan savollar."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cms.models import FaqItem
from app.cms.schemas import FaqIn, FaqUpdate
from app.core.errors import AppError


async def get_item(db: AsyncSession, item_id: int) -> FaqItem:
    item = await db.get(FaqItem, item_id)
    if item is None:
        raise AppError(404, "FAQ_NOT_FOUND", "Savol topilmadi")
    return item


async def public_list(db: AsyncSession) -> list[FaqItem]:
    rows = await db.scalars(
        select(FaqItem).where(FaqItem.is_published.is_(True)).order_by(FaqItem.order, FaqItem.id)
    )
    return list(rows)


async def admin_list(db: AsyncSession) -> list[FaqItem]:
    return list(await db.scalars(select(FaqItem).order_by(FaqItem.order, FaqItem.id)))


async def create_item(db: AsyncSession, data: FaqIn) -> FaqItem:
    item = FaqItem(**data.model_dump())
    db.add(item)
    await db.commit()
    return item


async def update_item(db: AsyncSession, item: FaqItem, data: FaqUpdate) -> FaqItem:
    for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(item, key, value)
    await db.commit()
    return item


async def delete_item(db: AsyncSession, item: FaqItem) -> None:
    await db.delete(item)
    await db.commit()
