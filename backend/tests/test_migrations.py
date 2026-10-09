from pathlib import Path

import sqlalchemy as sa
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext

import app.models_registry  # noqa: F401
from app.core.db import Base

BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_migrations_build_the_same_schema_as_models(tmp_path: Path) -> None:
    db_path = (tmp_path / "migrated.db").as_posix()
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")

    command.upgrade(config, "head")

    engine = sa.create_engine(f"sqlite:///{db_path}")
    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"compare_type": False})
        diff = compare_metadata(context, Base.metadata)
    engine.dispose()
    assert diff == []
