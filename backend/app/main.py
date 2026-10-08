from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import Settings, get_settings
from app.core.db import make_engine, make_sessionmaker
from app.core.errors import install_error_handlers
from app.core.middleware import install_request_id


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Texnologiya platformasi API",
        docs_url=None if settings.is_prod else "/api/docs",
        openapi_url=None if settings.is_prod else "/api/openapi.json",
        redoc_url=None,
    )
    engine = make_engine(settings.database_url)
    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = make_sessionmaker(engine)

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
