from datetime import datetime
from enum import StrEnum

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, str_enum


class Role(StrEnum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class UserStatus(StrEnum):
    pending = "pending"
    active = "active"
    blocked = "blocked"


class Locale(StrEnum):
    uz = "uz"
    ru = "ru"


class User(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(32))
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))
    role: Mapped[Role] = mapped_column(str_enum(Role), default=Role.student)
    status: Mapped[UserStatus] = mapped_column(str_enum(UserStatus), default=UserStatus.pending)
    locale: Mapped[Locale] = mapped_column(str_enum(Locale), default=Locale.uz)
    last_seen_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class RefreshSession(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "refresh_sessions"

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    user_agent: Mapped[str | None] = mapped_column(String(255))
