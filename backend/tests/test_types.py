from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.core.types import UTCDateTime


def test_utc_datetime_returns_aware_values() -> None:
    column_type = UTCDateTime()
    loaded = column_type.process_result_value(datetime(2026, 1, 1, 12, 0), None)  # type: ignore[arg-type]
    assert loaded == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def test_utc_datetime_converts_to_utc_on_save() -> None:
    tashkent = timezone(timedelta(hours=5))
    saved = UTCDateTime().process_bind_param(datetime(2026, 1, 1, 17, 0, tzinfo=tashkent), None)  # type: ignore[arg-type]
    assert saved == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def test_utc_datetime_rejects_naive_values() -> None:
    with pytest.raises(ValueError):
        UTCDateTime().process_bind_param(datetime(2026, 1, 1), None)  # type: ignore[arg-type]
