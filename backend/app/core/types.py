from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import BigInteger, DateTime, Dialect, Enum, Integer
from sqlalchemy.types import TypeDecorator

# PostgreSQL'da BIGINT, SQLite'da INTEGER (SQLite autoincrement faqat INTEGER PK bilan ishlaydi).
BigIntPK = BigInteger().with_variant(Integer(), "sqlite")


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
