import os
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

import app.models_registry  # noqa: F401  (barcha jadvallarni Base.metadata'ga ro'yxatdan o'tkazadi)
from app.core.config import Settings
from app.core.db import Base
from app.main import create_app

TEST_SECRET = "test-secret-" + "x" * 32


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    database_url = os.environ.get("TEST_DATABASE_URL") or (
        f"sqlite+aiosqlite:///{(tmp_path / 'test.db').as_posix()}"
    )
    return Settings(
        env="test",
        database_url=database_url,
        jwt_secret=TEST_SECRET,
        media_root=str(tmp_path / "media"),
        login_rate_limit=3,
    )


@pytest.fixture
async def app(settings: Settings) -> AsyncIterator[FastAPI]:
    application = create_app(settings)
    async with application.state.engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield application
    jobs = getattr(application.state, "jobs", None)
    if jobs is not None:
        await jobs.drain()
    await application.state.engine.dispose()


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client


@pytest.fixture
async def db(app: FastAPI) -> AsyncIterator[AsyncSession]:
    async with app.state.sessionmaker() as session:
        yield session
