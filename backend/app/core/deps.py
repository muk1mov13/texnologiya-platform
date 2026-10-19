from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.services import AiServices
from app.core.config import Settings
from app.core.jobs import JobRunner
from app.core.ratelimit import InMemoryRateLimiter
from app.core.storage import Storage


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    async with request.app.state.sessionmaker() as session:
        yield session


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings  # type: ignore[no-any-return]


def get_storage(request: Request) -> Storage:
    return request.app.state.storage  # type: ignore[no-any-return]


def get_jobs(request: Request) -> JobRunner:
    return request.app.state.jobs  # type: ignore[no-any-return]


def get_login_limiter(request: Request) -> InMemoryRateLimiter:
    return request.app.state.login_limiter  # type: ignore[no-any-return]


def get_contact_limiter(request: Request) -> InMemoryRateLimiter:
    return request.app.state.contact_limiter  # type: ignore[no-any-return]


def get_support_limiter(request: Request) -> InMemoryRateLimiter:
    return request.app.state.support_limiter  # type: ignore[no-any-return]


def get_ai(request: Request) -> AiServices:
    return request.app.state.ai  # type: ignore[no-any-return]


DbSession = Annotated[AsyncSession, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]
AppStorage = Annotated[Storage, Depends(get_storage)]
Jobs = Annotated[JobRunner, Depends(get_jobs)]
LoginLimiter = Annotated[InMemoryRateLimiter, Depends(get_login_limiter)]
ContactLimiter = Annotated[InMemoryRateLimiter, Depends(get_contact_limiter)]
SupportLimiter = Annotated[InMemoryRateLimiter, Depends(get_support_limiter)]
Ai = Annotated[AiServices, Depends(get_ai)]
