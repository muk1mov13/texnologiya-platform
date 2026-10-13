from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.services import build_ai, recover_interrupted_ai
from app.api import api_router
from app.core.config import Settings, get_settings
from app.core.db import make_engine, make_sessionmaker
from app.core.errors import install_error_handlers
from app.core.jobs import InlineJobRunner, JobContext
from app.core.middleware import install_request_id
from app.core.ratelimit import InMemoryRateLimiter
from app.core.storage import Storage
from app.gamification.service import sync_badges
from app.learning.materials import recover_interrupted_conversions


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    # InlineJobRunner fon ishlarini faqat xotirada saqlaydi: jarayon qulab tushganda
    # "processing" holatidagi materiallar abadiy shu holatda qolib ketadi. Prod'dagi
    # tashqi navbat runner uchun bu kerak emas (ishlar navbatda saqlanadi).
    if isinstance(app.state.jobs, InlineJobRunner):
        await recover_interrupted_conversions(app.state.sessionmaker)
        await recover_interrupted_ai(app.state.sessionmaker)
    async with app.state.sessionmaker() as session:
        await sync_badges(session)
    yield


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Texnologiya platformasi API",
        docs_url=None if settings.is_prod else "/api/docs",
        openapi_url=None if settings.is_prod else "/api/openapi.json",
        redoc_url=None,
        lifespan=_lifespan,
    )
    engine = make_engine(settings.database_url)
    sessionmaker = make_sessionmaker(engine)
    storage = Storage(Path(settings.media_root))
    ai = build_ai(settings, engine.dialect.name)

    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = sessionmaker
    app.state.storage = storage
    app.state.ai = ai
    app.state.jobs = InlineJobRunner(
        JobContext(sessionmaker=sessionmaker, settings=settings, storage=storage, ai=ai)
    )
    app.state.login_limiter = InMemoryRateLimiter(
        settings.login_rate_limit, settings.login_rate_window_seconds
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    install_request_id(app)
    install_error_handlers(app)
    app.include_router(api_router)
    return app
