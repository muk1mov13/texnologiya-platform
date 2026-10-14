from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import UTCDateTime, utcnow


class News(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "news"

    title: Mapped[str] = mapped_column(String(300))
    slug: Mapped[str] = mapped_column(String(220), unique=True)
    body: Mapped[str] = mapped_column(Text, default="")
    cover: Mapped[str | None] = mapped_column(String(500))
    # NULL — qoralama; kelajakdagi sana — rejalashtirilgan (ochiq API'da hali ko'rinmaydi).
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)
    views: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)

    @property
    def has_cover(self) -> bool:
        return self.cover is not None


class FaqItem(IdMixin, Base):
    __tablename__ = "faq_items"

    question: Mapped[str] = mapped_column(String(500))
    answer: Mapped[str] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)


class ContactMessage(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "contact_messages"

    name: Mapped[str] = mapped_column(String(150))
    contact: Mapped[str] = mapped_column(String(150))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)


class SiteSetting(Base):
    """Kalit-qiymat sozlamalar; ruxsat etilgan kalitlar `cms/site.py` dagi `SITE_KEYS`."""

    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON)
