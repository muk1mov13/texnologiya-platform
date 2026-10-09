import shutil
from pathlib import Path

import sqlalchemy as sa
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory

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


def test_sqlite_batch_migration_does_not_cascade_delete_children(tmp_path: Path) -> None:
    """render_as_batch'da SQLite'da ustun qo'shish jadvalni qayta yaratadi: eski
    jadval DROP qilinadi, va foreign_keys=ON bo'lsa bu CASCADE orqali bola
    qatorlarni ham o'chirib yuboradi. Migratsiya paytida FK pragma OFF bo'lishi
    kerak, aks holda ma'lumot yo'qoladi."""
    script_location = tmp_path / "alembic"
    shutil.copytree(
        BACKEND_DIR / "alembic", script_location, ignore=shutil.ignore_patterns("__pycache__")
    )
    db_path = (tmp_path / "batch.db").as_posix()
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(script_location))
    config.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")

    command.upgrade(config, "head")
    head_rev = ScriptDirectory.from_config(config).get_current_head()

    extra_revision = script_location / "versions" / "zzzz_add_test_column.py"
    extra_revision.write_text(
        f'''"""test column (batch add)"""
from alembic import op
import sqlalchemy as sa

revision = "zzzz_add_test_column"
down_revision = {head_rev!r}
branch_labels = None
depends_on = None


def upgrade() -> None:
    # recreate="always" o'chirishni qarorsiz majburlaydi (masalan ustun turini
    # o'zgartirish kabi real migratsiyalar ham SQLite'da shunday ishlaydi).
    with op.batch_alter_table("topics", recreate="always") as batch_op:
        batch_op.add_column(sa.Column("test_flag", sa.Boolean(), nullable=True))


def downgrade() -> None:
    pass
''',
        encoding="utf-8",
    )

    engine = sa.create_engine(f"sqlite:///{db_path}")
    with engine.begin() as connection:
        connection.execute(sa.text("PRAGMA foreign_keys=ON"))
        connection.execute(
            sa.text(
                "INSERT INTO subjects (title, slug, description, `order`, is_published, "
                "created_at) VALUES ('Fan', 'fan', '', 0, 0, '2026-01-01T00:00:00+00:00')"
            )
        )
        connection.execute(
            sa.text(
                "INSERT INTO topics (subject_id, `order`, title, summary, is_published, "
                "created_at) VALUES (1, 1, 'Mavzu', '', 0, '2026-01-01T00:00:00+00:00')"
            )
        )
        connection.execute(
            sa.text("INSERT INTO steps (topic_id, kind, `order`) VALUES (1, 'lecture', 1)")
        )
    engine.dispose()

    command.upgrade(config, "head")

    engine = sa.create_engine(f"sqlite:///{db_path}")
    with engine.connect() as connection:
        step_count = connection.execute(sa.text("SELECT COUNT(*) FROM steps")).scalar_one()
        topic_count = connection.execute(sa.text("SELECT COUNT(*) FROM topics")).scalar_one()
    engine.dispose()
    assert (topic_count, step_count) == (1, 1)
