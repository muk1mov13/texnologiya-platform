"""Bog'lanish formasi xabarlari va ularni admin ko'rishi."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cms.models import ContactMessage
from app.cms.schemas import ContactIn, MessageUpdate
from app.core.errors import AppError

ADMIN_LIST_LIMIT = 200


async def save_message(db: AsyncSession, data: ContactIn) -> None:
    db.add(ContactMessage(name=data.name, contact=data.contact, message=data.message))
    await db.commit()


async def get_message(db: AsyncSession, message_id: int) -> ContactMessage:
    message = await db.get(ContactMessage, message_id)
    if message is None:
        raise AppError(404, "MESSAGE_NOT_FOUND", "Xabar topilmadi")
    return message


async def admin_list(db: AsyncSession, *, unread_only: bool) -> list[ContactMessage]:
    stmt = select(ContactMessage)
    if unread_only:
        stmt = stmt.where(ContactMessage.is_read.is_(False))
    rows = await db.scalars(
        stmt.order_by(ContactMessage.created_at.desc(), ContactMessage.id.desc()).limit(
            ADMIN_LIST_LIMIT
        )
    )
    return list(rows)


async def update_message(
    db: AsyncSession, message: ContactMessage, data: MessageUpdate
) -> ContactMessage:
    message.is_read = data.is_read
    await db.commit()
    return message


async def delete_message(db: AsyncSession, message: ContactMessage) -> None:
    await db.delete(message)
    await db.commit()
