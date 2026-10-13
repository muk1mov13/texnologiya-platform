import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection

import app.models_registry  # noqa: F401
from app.ai.models import HNSW_INDEX
from app.core.config import get_settings
from app.core.db import Base, make_engine
from app.core.types import Vector

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def _include_object(obj, name, type_, reflected, compare_to):  # type: ignore[no-untyped-def]
    # HNSW indeksi modelda yo'q (faqat PostgreSQL'da DDL bilan yaratiladi) — taqqoslanmaydi.
    return not (type_ == "index" and name == HNSW_INDEX)


def _compare_type(context, inspected_column, metadata_column, inspected_type, metadata_type):  # type: ignore[no-untyped-def]  # noqa: E501
    # pgvector ustuni reflektsiyada boshqa tip bo'lib ko'rinadi; o'lcham migratsiyada qat'iy.
    if isinstance(metadata_type, Vector):
        return False
    return None  # qolgan ustunlar uchun Alembic'ning standart taqqoslashi


def database_url() -> str:
    return config.get_main_option("sqlalchemy.url") or get_settings().database_url


def run_migrations_offline() -> None:
    url = database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=url.startswith("sqlite"),
        compare_type=_compare_type,
        include_object=_include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    is_sqlite = connection.dialect.name == "sqlite"
    if is_sqlite:
        # render_as_batch'da SQLite ustun turi/cheklovini o'zgartirish jadvalni
        # to'liq qayta yaratadi (yangi jadval, ko'chirish, eskisini DROP qilish).
        # foreign_keys=ON bo'lsa, eski jadvalni DROP qilish ON DELETE CASCADE
        # orqali bola qatorlarni ham o'chirib yuboradi. PRAGMA faqat tranzaksiya
        # ochiq bo'lmaganda ta'sir qiladi, shu sababli avval ochiq tranzaksiyani
        # yopamiz.
        if connection.in_transaction():
            connection.commit()
        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
        # `exec_driver_sql` avtomatik ravishda yangi tranzaksiyani boshlab
        # yuboradi (SQLAlchemy "autobegin"); keyinroq Alembic'ning o'z
        # `begin_transaction()`'i tranzaksiyani boshlab, oxirida committ
        # qilishi uchun ulanish tozalanishi kerak, aks holda Alembic uni
        # o'zi boshlamagani uchun commit qilmay qoladi.
        if connection.in_transaction():
            connection.commit()
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=is_sqlite,
        compare_type=_compare_type,
        include_object=_include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    engine = make_engine(database_url())
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
