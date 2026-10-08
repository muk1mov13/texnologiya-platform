from pathlib import Path

import pytest
from sqlalchemy import select

from app.auth.models import Role, User, UserStatus
from app.cli import create_admin, main
from app.core.config import Settings
from app.core.db import Base, make_engine, make_sessionmaker
from app.core.security import verify_password


async def test_create_admin_creates_then_updates(tmp_path: Path) -> None:
    settings = Settings(
        env="test",
        jwt_secret="c" * 40,
        database_url=f"sqlite+aiosqlite:///{(tmp_path / 'cli.db').as_posix()}",
    )
    engine = make_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    assert await create_admin(settings, "Boss@Mail.uz", "parol1234", "Boss") == "created"
    assert await create_admin(settings, "boss@mail.uz", "yangiparol1", "Boss") == "updated"

    async with make_sessionmaker(engine)() as db:
        user = await db.scalar(select(User).where(User.email == "boss@mail.uz"))
    await engine.dispose()
    assert user is not None
    assert (user.role, user.status) == (Role.admin, UserStatus.active)
    assert verify_password("yangiparol1", user.password_hash)


async def test_create_admin_rejects_short_password(tmp_path: Path) -> None:
    settings = Settings(env="test", jwt_secret="c" * 40)
    with pytest.raises(ValueError):
        await create_admin(settings, "boss@mail.uz", "123", "Boss")


def test_main_reports_error_for_short_password() -> None:
    assert main(["create-admin", "--email", "boss@mail.uz", "--password", "123"]) == 1
