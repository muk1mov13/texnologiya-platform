from enum import StrEnum

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, str_enum


class LibrarySection(StrEnum):
    metodik = "metodik"
    huquqiy = "huquqiy"


class Folder(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "folders"

    # RESTRICT: bo'sh bo'lmagan papka o'chirilmaydi (kod ham 409 bilan tekshiradi).
    parent_id: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("folders.id", ondelete="RESTRICT"), index=True
    )
    section: Mapped[LibrarySection] = mapped_column(str_enum(LibrarySection), index=True)
    title: Mapped[str] = mapped_column(String(200))
    order: Mapped[int] = mapped_column(Integer, default=0)


class Document(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "documents"

    folder_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("folders.id", ondelete="RESTRICT"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    file: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)


class Book(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "books"

    category: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(300))
    author: Mapped[str] = mapped_column(String(200), default="")
    cover: Mapped[str | None] = mapped_column(String(500))
    file: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    uploaded_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL"), index=True
    )

    @property
    def has_cover(self) -> bool:
        return self.cover is not None
