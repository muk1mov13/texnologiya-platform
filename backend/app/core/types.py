from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated

from fastapi import Path
from pydantic import Field
from sqlalchemy import BigInteger, DateTime, Dialect, Enum, Integer
from sqlalchemy.types import TypeDecorator

# PostgreSQL'da BIGINT, SQLite'da INTEGER (SQLite autoincrement faqat INTEGER PK bilan ishlaydi).
BigIntPK = BigInteger().with_variant(Integer(), "sqlite")

# BigIntPK bilan mos: PostgreSQL BIGINT'ning maksimal qiymati. Bundan katta `id`
# so'rovlari (yoki ro'yxatlar ichidagi ID'lar) DB darajasida xato (500) bermasdan,
# 422 bilan rad etiladi.
DB_ID_MAX = 2**63 - 1

# Pydantic model maydonlari (masalan ro'yxat elementlari) uchun.
DbId = Annotated[int, Field(ge=1, le=DB_ID_MAX)]

# FastAPI path parametrlari uchun.
DbIdPath = Annotated[int, Path(ge=1, le=DB_ID_MAX)]

# PostgreSQL INTEGER (4-bayt, signed) ustunlariga mos "order" kabi maydonlar uchun.
Order31 = Annotated[int, Field(ge=0, le=2**31 - 1)]


def utcnow() -> datetime:
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator[datetime]):
    """Har ikki bazada ham timezone-aware (UTC) qaytadigan datetime."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("naive datetime is not allowed")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


def str_enum(enum_cls: type[StrEnum], length: int = 20) -> Enum:
    """Enum'ni VARCHAR sifatida saqlaydi (SQLite va PostgreSQL'da bir xil)."""
    return Enum(
        enum_cls,
        native_enum=False,
        length=length,
        values_callable=lambda members: [m.value for m in members],
        validate_strings=True,
    )
