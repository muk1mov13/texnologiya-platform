from fastapi import FastAPI

from app.api import api_router
from app.core.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Texnologiya platformasi API",
        docs_url=None if settings.is_prod else "/api/docs",
        openapi_url=None if settings.is_prod else "/api/openapi.json",
        redoc_url=None,
    )
    app.state.settings = settings
    app.include_router(api_router)
    return app
