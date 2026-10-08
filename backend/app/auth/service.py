from datetime import timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshSession, User, UserStatus
from app.auth.schemas import RegisterIn
from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    hash_password,
    hash_token,
    new_refresh_token,
    verify_password,
)
from app.core.types import utcnow


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    return await db.scalar(select(User).where(User.email == normalize_email(email)))


async def register_user(db: AsyncSession, data: RegisterIn) -> User:
    if await get_user_by_email(db, data.email) is not None:
        raise AppError(409, "EMAIL_TAKEN", "Bu email bilan allaqachon ro'yxatdan o'tilgan")
    user = User(
        email=normalize_email(data.email),
        phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name.strip(),
        locale=data.locale,
    )
    db.add(user)
    await db.commit()
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise AppError(401, "INVALID_CREDENTIALS", "Email yoki parol noto'g'ri")
    if user.status == UserStatus.blocked:
        raise AppError(403, "ACCOUNT_BLOCKED", "Akkaunt bloklangan")
    return user


async def issue_tokens(
    db: AsyncSession, user: User, settings: Settings, user_agent: str | None
) -> tuple[str, str]:
    """Yangi refresh sessiya yaratadi va (access_token, raw_refresh_token) qaytaradi."""
    raw = new_refresh_token()
    db.add(
        RefreshSession(
            user_id=user.id,
            token_hash=hash_token(raw),
            expires_at=utcnow() + timedelta(days=settings.refresh_token_days),
            user_agent=(user_agent or "")[:255] or None,
        )
    )
    user.last_seen_at = utcnow()
    await db.commit()
    return create_access_token(user.id, user.role, settings), raw


async def revoke_all_sessions(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == user_id, RefreshSession.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )


async def rotate_refresh(
    db: AsyncSession, raw: str, settings: Settings, user_agent: str | None
) -> tuple[User, str, str]:
    session = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_token(raw))
    )
    if session is None:
        raise AppError(401, "INVALID_REFRESH_TOKEN", "Sessiya topilmadi")
    if session.revoked_at is not None:
        # Bekor qilingan token qayta ishlatildi: o'g'irlangan bo'lishi mumkin,
        # hamma sessiyalarni yopamiz.
        await revoke_all_sessions(db, session.user_id)
        await db.commit()
        raise AppError(401, "REFRESH_REUSED", "Sessiya bekor qilingan")
    if session.expires_at <= utcnow():
        raise AppError(401, "REFRESH_EXPIRED", "Sessiya muddati tugagan")
    user = await db.get(User, session.user_id)
    if user is None or user.status == UserStatus.blocked:
        raise AppError(403, "ACCOUNT_BLOCKED", "Akkaunt bloklangan")
    session.revoked_at = utcnow()
    access, new_raw = await issue_tokens(db, user, settings, user_agent)
    return user, access, new_raw


async def revoke_refresh(db: AsyncSession, raw: str) -> None:
    session = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_token(raw))
    )
    if session is not None and session.revoked_at is None:
        session.revoked_at = utcnow()
        await db.commit()


async def change_password(db: AsyncSession, user: User, current: str, new: str) -> None:
    if not verify_password(current, user.password_hash):
        raise AppError(400, "WRONG_PASSWORD", "Joriy parol noto'g'ri")
    user.password_hash = hash_password(new)
    await revoke_all_sessions(db, user.id)
    await db.commit()
