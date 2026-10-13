from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, utcnow


class XpEvent(IdMixin, CreatedAtMixin, Base):
    """Bitta XP hodisasi. Unique cheklov bir hodisa uchun XP ikki marta berilishini oldini oladi."""

    __tablename__ = "xp_events"
    __table_args__ = (UniqueConstraint("user_id", "reason", "ref_type", "ref_id"),)

    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(40))
    ref_type: Mapped[str] = mapped_column(String(20))
    ref_id: Mapped[int] = mapped_column(BigIntPK)


class Streak(Base):
    """Kunlik seriya. Sana Toshkent vaqti bo'yicha saqlanadi."""

    __tablename__ = "streaks"

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    current: Mapped[int] = mapped_column(Integer, default=0)
    longest: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date)


class Badge(IdMixin, Base):
    __tablename__ = "badges"

    code: Mapped[str] = mapped_column(String(40), unique=True)
    icon: Mapped[str] = mapped_column(String(16))
    title_uz: Mapped[str] = mapped_column(String(100))
    title_ru: Mapped[str] = mapped_column(String(100))
    description_uz: Mapped[str] = mapped_column(String(300))
    description_ru: Mapped[str] = mapped_column(String(300))


class UserBadge(IdMixin, Base):
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id"),)

    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    badge_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("badges.id", ondelete="CASCADE"), index=True
    )
    awarded_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
