"""AI provayder adapteri: Gemini, OpenAI'ga mos API va sinov uchun `FakeProvider`.

Boshqa modullar faqat `LLMProvider` / `EmbeddingProvider` protokollarini biladi.
"""

import asyncio
import hashlib
import json
import logging
import math
import re
import time
from collections.abc import AsyncIterator, Awaitable, Callable, Sequence
from dataclasses import dataclass
from typing import Any, Literal, Protocol, TypeVar

import httpx
from pydantic import BaseModel

from app.ai.constants import EMBED_BATCH, EMBEDDING_DIM

logger = logging.getLogger(__name__)

GEMINI_TIMEOUT_MS = 60_000

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


def _status(exc: BaseException) -> int | None:
    """Gemini (`APIError.code`) yoki httpx (`HTTPStatusError`) xatosining HTTP kodi."""
    from google.genai import errors

    if isinstance(exc, errors.APIError):
        return exc.code or 0
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code
    return None


def _retryable(exc: BaseException) -> bool:
    status = _status(exc)
    if status is not None:
        return status == 429 or status >= 500
    return isinstance(exc, TimeoutError | ConnectionError | httpx.TransportError)


async def with_retry[T](call: Callable[[], Awaitable[T]]) -> T:
    """429/5xx/tarmoq xatosida 1, 2, 4 s kutib 3 marta qayta urinadi; bo'lmasa `ProviderBusy`.

    Boshqa API xatolari (masalan, noto'g'ri kalit yoki model nomi) darhol `ProviderBusy` bo'ladi:
    foydalanuvchiga ichki tafsilot ko'rsatilmaydi, sababi esa logga yoziladi.
    """
    for delay in (*RETRY_DELAYS, None):
        try:
            return await call()
        except Exception as exc:
            if delay is not None and _retryable(exc):
                await asyncio.sleep(delay)
                continue
            if _status(exc) is not None or _retryable(exc):
                logger.warning("AI provider error: %s %s", type(exc).__name__, _status(exc) or "")
                raise ProviderBusy(type(exc).__name__) from exc
            raise
    raise AssertionError("unreachable")


class GeminiProvider:
    def __init__(self, api_key: str, embedding_model: str, limiter: TokenBucket) -> None:
        from google import genai
        from google.genai import types

        # Timeout'siz band model (503) javobini daqiqalab kutib qolishi mumkin.
        self._client = genai.Client(
            api_key=api_key, http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS)
        )
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


TEI_BATCH = 32  # TEI `--max-client-batch-size` default qiymati
E5_PREFIX: dict[EmbedTask, str] = {"query": "query: ", "document": "passage: "}


class TeiEmbeddingProvider:
    """Lokal embedding: HuggingFace text-embeddings-inference (`POST /embed`) konteyneri.

    `multilingual-e5` modellari savol va matnni `query: ` / `passage: ` prefikslari bilan
    farqlaydi. Uzun matnni TEI o'zi kesadi (`truncate`).
    """

    def __init__(self, url: str, model_name: str) -> None:
        self._url = url.rstrip("/") + "/embed"
        self.model_name = model_name
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0))

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]:
        result: list[list[float]] = []
        for start in range(0, len(texts), TEI_BATCH):
            body = {
                "inputs": [E5_PREFIX[task] + t for t in texts[start : start + TEI_BATCH]],
                "normalize": True,
                "truncate": True,
            }

            async def call(body: dict[str, Any] = body) -> list[list[float]]:
                response = await self._client.post(self._url, json=body)
                response.raise_for_status()
                return list(response.json())

            for vec in await with_retry(call):
                if len(vec) != EMBEDDING_DIM:
                    raise ValueError(f"Embedding o'lchami {len(vec)}, kutilgan {EMBEDDING_DIM}")
                result.append(normalize(vec))
        return result


class OpenAICompatProvider:
    """OpenAI'ga mos `/chat/completions` API (Groq, Cerebras, OpenRouter...) — faqat matn."""

    def __init__(self, base_url: str, api_key: str, limiter: TokenBucket) -> None:
        self._url = base_url.rstrip("/") + "/chat/completions"
        self._client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=httpx.Timeout(60.0, connect=10.0),
        )
        self._limiter = limiter

    @staticmethod
    def _messages(system: str, messages: Sequence[ChatMessage]) -> list[dict[str, str]]:
        return [{"role": "system", "content": system}] + [
            {"role": m.role, "content": m.text} for m in messages
        ]

    async def _complete(self, body: dict[str, Any]) -> str:
        async def call() -> str:
            response = await self._client.post(self._url, json=body)
            response.raise_for_status()
            return str(response.json()["choices"][0]["message"].get("content") or "")

        await self._limiter.acquire()
        return await with_retry(call)

    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str:
        return await self._complete({"model": model, "messages": self._messages(system, messages)})

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT:
        """Sxemaga mos kelmasa `pydantic.ValidationError` — chaqiruvchi qayta so'raydi."""
        text = await self._complete(
            {
                "model": model,
                "messages": self._messages(system, messages),
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": schema.__name__,
                        "schema": schema.model_json_schema(),
                        "strict": False,
                    },
                },
            }
        )
        return schema.model_validate_json(text or "{}")

    async def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]:
        body = {"model": model, "messages": self._messages(system, messages), "stream": True}

        async def start() -> httpx.Response:
            request = self._client.build_request("POST", self._url, json=body)
            response = await self._client.send(request, stream=True)
            if response.is_error:
                await response.aclose()
                response.raise_for_status()
            return response

        await self._limiter.acquire()
        response = await with_retry(start)
        try:
            async for line in response.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                choices = json.loads(data).get("choices") or []
                piece = choices[0].get("delta", {}).get("content") if choices else None
                if piece:
                    yield piece
        except httpx.HTTPError as exc:  # oqim o'rtasida qayta urinib bo'lmaydi
            logger.warning("AI provider stream error: %s", type(exc).__name__)
            raise ProviderBusy(type(exc).__name__) from exc
        finally:
            await response.aclose()


class FallbackProvider:
    """Asosiy provayder `ProviderBusy` bersa, so'rovni zaxira provayderga o'tkazadi.

    Model nomi `model_map` orqali zaxira provayder modeliga almashtiriladi. Oqim faqat birinchi
    bo'lakdan oldin yiqilsa o'tkaziladi, aks holda ikki javob aralashib ketadi.
    """

    def __init__(
        self,
        primary: LLMProvider,
        secondary: LLMProvider,
        model_map: dict[str, str],
        default_model: str,
    ) -> None:
        self.primary = primary
        self.secondary = secondary
        self._model_map = model_map
        self._default_model = default_model

    def _fallback_model(self, model: str) -> str:
        logger.warning("AI fallback: asosiy provayder band, zaxira provayder ishlatiladi")
        return self._model_map.get(model, self._default_model)

    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str:
        try:
            return await self.primary.generate(model, system, messages)
        except ProviderBusy:
            return await self.secondary.generate(self._fallback_model(model), system, messages)

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT:
        try:
            return await self.primary.generate_json(model, system, messages, schema)
        except ProviderBusy:
            return await self.secondary.generate_json(
                self._fallback_model(model), system, messages, schema
            )

    async def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]:
        started = False
        try:
            async for piece in self.primary.stream(model, system, messages):
                started = True
                yield piece
            return
        except ProviderBusy:
            if started:
                raise
        async for piece in self.secondary.stream(self._fallback_model(model), system, messages):
            yield piece
