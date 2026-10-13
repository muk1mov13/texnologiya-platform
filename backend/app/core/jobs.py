import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Protocol

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.core.storage import Storage

if TYPE_CHECKING:  # import tsikli bo'lmasligi uchun faqat tip tekshiruvida
    from app.ai.services import AiServices

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class JobContext:
    sessionmaker: async_sessionmaker[AsyncSession]
    settings: Settings
    storage: Storage
    ai: "AiServices | None" = None


JobFunc = Callable[..., Awaitable[None]]
JOB_REGISTRY: dict[str, JobFunc] = {}


def job(name: str) -> Callable[[JobFunc], JobFunc]:
    """Fon ishini nom bilan ro'yxatdan o'tkazadi. Funksiya `(ctx, **kwargs)` qabul qiladi."""

    def register(func: JobFunc) -> JobFunc:
        if name in JOB_REGISTRY:
            raise ValueError(f"Job already registered: {name}")
        JOB_REGISTRY[name] = func
        return func

    return register


class JobRunner(Protocol):
    async def enqueue(self, name: str, **kwargs: Any) -> None: ...


class InlineJobRunner:
    """Ishlarni API jarayoni ichida asyncio task sifatida bajaradi (lokal muhit).

    Prod'da xuddi shu `enqueue()` imzosiga ega arq runner ishlatiladi.
    """

    def __init__(self, ctx: JobContext) -> None:
        self.ctx = ctx
        self._tasks: set[asyncio.Task[None]] = set()

    async def enqueue(self, name: str, **kwargs: Any) -> None:
        func = JOB_REGISTRY.get(name)
        if func is None:
            raise ValueError(f"Unknown job: {name}")
        task = asyncio.create_task(self._run(name, func, kwargs))
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _run(self, name: str, func: JobFunc, kwargs: dict[str, Any]) -> None:
        try:
            await func(self.ctx, **kwargs)
        except Exception:
            logger.exception("Job %s failed", name)

    async def drain(self) -> None:
        while self._tasks:
            await asyncio.gather(*list(self._tasks))
