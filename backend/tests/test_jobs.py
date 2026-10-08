from pathlib import Path
from typing import Any

import pytest

from app.core.config import Settings
from app.core.jobs import JOB_REGISTRY, InlineJobRunner, JobContext, job
from app.core.storage import Storage


def _runner(tmp_path: Path) -> InlineJobRunner:
    ctx = JobContext(
        sessionmaker=None,  # type: ignore[arg-type]
        settings=Settings(env="test", jwt_secret="j" * 40),
        storage=Storage(tmp_path),
    )
    return InlineJobRunner(ctx)


async def test_enqueued_job_runs_and_drain_waits(tmp_path: Path) -> None:
    calls: list[int] = []

    @job("test_record")
    async def record(ctx: JobContext, value: int) -> None:
        calls.append(value)

    try:
        runner = _runner(tmp_path)
        await runner.enqueue("test_record", value=42)
        await runner.drain()
        assert calls == [42]
    finally:
        JOB_REGISTRY.pop("test_record")


async def test_failing_job_is_logged_not_raised(tmp_path: Path, caplog: Any) -> None:
    @job("test_fail")
    async def fail(ctx: JobContext) -> None:
        raise RuntimeError("boom")

    try:
        runner = _runner(tmp_path)
        await runner.enqueue("test_fail")
        await runner.drain()
        assert "Job test_fail failed" in caplog.text
    finally:
        JOB_REGISTRY.pop("test_fail")


async def test_unknown_job_name_is_rejected(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        await _runner(tmp_path).enqueue("does_not_exist")


async def test_duplicate_job_name_is_rejected() -> None:
    @job("test_dup")
    async def first(ctx: JobContext) -> None:
        pass

    try:
        with pytest.raises(ValueError):
            @job("test_dup")
            async def second(ctx: JobContext) -> None:
                pass
    finally:
        JOB_REGISTRY.pop("test_dup")
