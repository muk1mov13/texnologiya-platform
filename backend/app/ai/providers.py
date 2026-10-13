"""AI provayder adapteri: Gemini va sinov uchun `FakeProvider`.

Boshqa modullar faqat `LLMProvider` / `EmbeddingProvider` protokollarini biladi.
"""

import asyncio
import hashlib
import logging
import math
import re
import time
from collections.abc import AsyncIterator, Awaitable, Callable, Sequence
from dataclasses import dataclass
from typing import Any, Literal, Protocol, TypeVar

from pydantic import BaseModel

from app.ai.constants import EMBED_BATCH, EMBEDDING_DIM

logger = logging.getLogger(__name__)

EmbedTask = Literal["document", "query"]
ModelT = TypeVar("ModelT", bound=BaseModel)


@dataclass(frozen=True)
class ChatMessage:
    role: Literal["user", "assistant"]
    text: str


class ProviderBusy(Exception):
    """Provayder javob bermadi (limit, 5xx, tarmoq yoki rad etilgan so'rov) — `AI_BUSY`."""


def normalize(vec: Sequence[float]) -> list[float]:
    """L2 bo'yicha normallashtiradi: shunda cosine o'xshashlik = skalyar ko'paytma."""
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return [1.0 / math.sqrt(len(vec))] * len(vec)
    return [x / norm for x in vec]


class TokenBucket:
    """Provayderga umumiy so'rovlar oqimi (`AI_RPM`). Bitta jarayon uchun; 4-bosqichda Redis."""

    def __init__(self, per_minute: int, clock: Callable[[], float] = time.monotonic) -> None:
        self.capacity = float(per_minute)
        self.rate = per_minute / 60.0
        self.tokens = float(per_minute)
        self._clock = clock
        self.updated = clock()
        self._lock = asyncio.Lock()

    async def acquire(self, max_wait: float = 20.0) -> None:
        """Token bo'shaguncha kutadi; `max_wait` soniyadan ko'p kerak bo'lsa `ProviderBusy`."""
        deadline = self._clock() + max_wait
        while True:
            async with self._lock:
                now = self._clock()
                self.tokens = min(self.capacity, self.tokens + (now - self.updated) * self.rate)
                self.updated = now
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                wait = (1 - self.tokens) / self.rate
            if self._clock() + wait > deadline:
                raise ProviderBusy("rate limit")
            await asyncio.sleep(wait)


class LLMProvider(Protocol):
    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str: ...

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT: ...

    def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]: ...


class EmbeddingProvider(Protocol):
    model_name: str

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]: ...


_TOKEN = re.compile(r"\w+")


class FakeProvider:
    """Internetsiz, deterministik provayder (testlar va `AI_PROVIDER=fake`).

    Embedding — so'zlarni hash bo'yicha savatlarga sanash: umumiy so'zlari ko'p matnlar o'xshash.
    JSON javobi — sxemaning `fake_sample()` klass-metodi.
    """

    model_name = "fake-embedding"

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]:
        result = []
        for text in texts:
            vec = [0.0] * EMBEDDING_DIM
            for token in _TOKEN.findall(text.lower()):
                digest = hashlib.md5(token.encode(), usedforsecurity=False).digest()
                vec[int.from_bytes(digest[:4], "big") % EMBEDDING_DIM] += 1.0
            result.append(normalize(vec))
        return result

    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str:
        return "Bu sinov javobi [1]."

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT:
        sample: Any = getattr(schema, "fake_sample", None)
        if sample is None:
            raise NotImplementedError(f"{schema.__name__}.fake_sample yo'q")
        return schema.model_validate(sample())

    async def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]:
        for part in ("Bu sinov ", "javobi [1]."):
            yield part


RETRY_DELAYS = (1.0, 2.0, 4.0)


def _retryable(exc: BaseException) -> bool:
    from google.genai import errors

    if isinstance(exc, errors.APIError):
        return exc.code == 429 or (exc.code or 0) >= 500
    return isinstance(exc, TimeoutError | ConnectionError)


async def with_retry[T](call: Callable[[], Awaitable[T]]) -> T:
    """429/5xx/tarmoq xatosida 1, 2, 4 s kutib 3 marta qayta urinadi; bo'lmasa `ProviderBusy`.

    Boshqa API xatolari (masalan, noto'g'ri kalit yoki model nomi) darhol `ProviderBusy` bo'ladi:
    foydalanuvchiga ichki tafsilot ko'rsatilmaydi, sababi esa logga yoziladi.
    """
    from google.genai import errors

    for delay in (*RETRY_DELAYS, None):
        try:
            return await call()
        except Exception as exc:
            if delay is not None and _retryable(exc):
                await asyncio.sleep(delay)
                continue
            if isinstance(exc, errors.APIError) or _retryable(exc):
                logger.warning(
                    "AI provider error: %s %s", type(exc).__name__, getattr(exc, "code", "")
                )
                raise ProviderBusy(type(exc).__name__) from exc
            raise
    raise AssertionError("unreachable")


class GeminiProvider:
    def __init__(self, api_key: str, embedding_model: str, limiter: TokenBucket) -> None:
        from google import genai

        self._client = genai.Client(api_key=api_key)
        self.model_name = embedding_model
        self._limiter = limiter

    @staticmethod
    def _contents(messages: Sequence[ChatMessage]) -> list[Any]:
        from google.genai import types

        return [
            types.Content(
                role="model" if m.role == "assistant" else "user",
                parts=[types.Part.from_text(text=m.text)],
            )
            for m in messages
        ]

    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str:
        from google.genai import types

        await self._limiter.acquire()
        response = await with_retry(
            lambda: self._client.aio.models.generate_content(
                model=model,
                contents=self._contents(messages),
                config=types.GenerateContentConfig(system_instruction=system),
            )
        )
        return response.text or ""

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT:
        """Sxemaga mos kelmasa `pydantic.ValidationError` — chaqiruvchi qayta so'raydi."""
        from google.genai import types

        await self._limiter.acquire()
        response = await with_retry(
            lambda: self._client.aio.models.generate_content(
                model=model,
                contents=self._contents(messages),
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
        )
        return schema.model_validate_json(response.text or "{}")

    async def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]:
        from google.genai import errors, types

        async def start() -> tuple[AsyncIterator[Any], Any]:
            # HTTP xatosi birinchi bo'lakni o'qishda chiqadi, shuning uchun u ham retry ichida.
            chunks = await self._client.aio.models.generate_content_stream(
                model=model,
                contents=self._contents(messages),
                config=types.GenerateContentConfig(system_instruction=system),
            )
            iterator = aiter(chunks)
            return iterator, await anext(iterator, None)

        await self._limiter.acquire()
        iterator, first = await with_retry(start)
        if first is None:
            return
        if first.text:
            yield first.text
        try:
            async for chunk in iterator:
                if chunk.text:
                    yield chunk.text
        except errors.APIError as exc:  # oqim o'rtasida qayta urinib bo'lmaydi
            logger.warning("AI provider stream error: %s %s", type(exc).__name__, exc.code)
            raise ProviderBusy(type(exc).__name__) from exc

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]:
        from google.genai import types

        task_type = "RETRIEVAL_QUERY" if task == "query" else "RETRIEVAL_DOCUMENT"
        config = types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM, task_type=task_type)
        result: list[list[float]] = []
        for start in range(0, len(texts), EMBED_BATCH):
            batch = list(texts[start : start + EMBED_BATCH])
            await self._limiter.acquire()
            response = await with_retry(
                lambda batch=batch: self._client.aio.models.embed_content(  # type: ignore[misc]
                    model=self.model_name, contents=batch, config=config
                )
            )
            result.extend(normalize(list(e.values or [])) for e in response.embeddings or [])
        return result
