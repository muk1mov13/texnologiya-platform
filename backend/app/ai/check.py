"""`ai-check` CLI: sozlangan har bir AI provayderiga bittadan qisqa so'rov yuboradi.

Fallback orqali emas, har provayder alohida tekshiriladi — qaysi biri ishlamayotgani
aniq ko'rinadi. Prompt va javob matni chiqarilmaydi, faqat holat, uzunlik va vaqt.
"""

import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from app.ai.constants import EMBEDDING_DIM
from app.ai.providers import (
    ChatMessage,
    EmbeddingProvider,
    GeminiProvider,
    LLMProvider,
    OpenAICompatProvider,
    ProviderBusy,
    TeiEmbeddingProvider,
    TokenBucket,
)
from app.ai.services import local_embedder
from app.core.config import Settings

_SYSTEM = "Qisqa javob ber."
_PROMPT = [ChatMessage(role="user", text="Salom! Bir so'z bilan javob ber: 2+2 nechaga teng?")]


@dataclass(frozen=True)
class CheckResult:
    name: str
    ok: bool
    detail: str
    seconds: float


async def _timed(name: str, call: Callable[[], Awaitable[str]]) -> CheckResult:
    start = time.monotonic()
    try:
        detail = await call()
        ok = True
    except ProviderBusy as exc:
        ok, detail = False, f"AI_BUSY ({exc.__cause__ or exc})"
    except Exception as exc:  # noqa: BLE001 — har qanday xato hisobotga tushadi
        ok, detail = False, f"{type(exc).__name__}: {exc}"
    return CheckResult(name, ok, detail, time.monotonic() - start)


def _text_check(provider: LLMProvider, model: str) -> Callable[[], Awaitable[str]]:
    async def call() -> str:
        answer = await provider.generate(model, _SYSTEM, _PROMPT)
        if not answer.strip():
            raise ValueError("bo'sh javob")
        return f"{len(answer)} belgi"

    return call


def _embed_check(embedder: EmbeddingProvider) -> Callable[[], Awaitable[str]]:
    async def call() -> str:
        vectors = await embedder.embed(["Texnologiya darsi"], "query")
        dim = len(vectors[0])
        if dim != EMBEDDING_DIM:
            raise ValueError(f"o'lcham {dim}, kutilgan {EMBEDDING_DIM}")
        return f"o'lcham {dim}"

    return call


async def run_checks(settings: Settings) -> list[CheckResult]:
    """Kaliti bor provayderlarni tekshiradi; `AI_PROVIDER=fake` bo'lsa hech narsa yubormaydi."""
    if settings.ai_provider == "fake":
        return []
    checks: list[tuple[str, Callable[[], Awaitable[str]]]] = []
    if settings.llm_api_key:
        compat = OpenAICompatProvider(
            settings.llm_base_url, settings.llm_api_key, TokenBucket(settings.llm_rpm)
        )
        for model in dict.fromkeys((settings.llm_model_chat, settings.llm_model_fast)):
            checks.append((f"compat {model}", _text_check(compat, model)))
    gemini = (
        GeminiProvider(
            settings.gemini_api_key,
            settings.gemini_embedding_model,
            TokenBucket(settings.gemini_rpm),
        )
        if settings.gemini_api_key
        else None
    )
    if gemini is not None:
        for model in dict.fromkeys((settings.gemini_model_chat, settings.gemini_model_fast)):
            checks.append((f"gemini {model}", _text_check(gemini, model)))
    embedder: EmbeddingProvider | None = gemini
    if settings.embedding_provider == "tei":
        embedder = TeiEmbeddingProvider(settings.tei_url, settings.tei_model)
    elif settings.embedding_provider == "local":
        embedder = local_embedder(settings)
    if embedder is not None:
        checks.append((f"embedding {embedder.model_name}", _embed_check(embedder)))
    return [await _timed(name, call) for name, call in checks]
