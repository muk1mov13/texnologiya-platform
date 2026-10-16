"""AI xizmatlarini yig'ish va "AI yoqilganmi" tekshiruvi."""

from dataclasses import dataclass

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.local_embed import LocalEmbeddingProvider
from app.ai.models import AiDraft, AiSettings, DraftStatus
from app.ai.providers import (
    EmbeddingProvider,
    FakeProvider,
    FallbackProvider,
    GeminiProvider,
    LLMProvider,
    OpenAICompatProvider,
    TeiEmbeddingProvider,
    TokenBucket,
)
from app.ai.vectors import PgVectorStore, SqliteVectorStore, VectorStore
from app.assessment.models import AiCheckStatus, Submission
from app.core.config import Settings
from app.core.errors import AppError


@dataclass(frozen=True)
class AiServices:
    llm: LLMProvider
    embedder: EmbeddingProvider
    vectors: VectorStore
    configured: bool  # asosiy provayder kaliti va embedding bor yoki `AI_PROVIDER=fake`
    chat_model: str
    fast_model: str


def build_ai(settings: Settings, dialect_name: str) -> AiServices:
    """Kalit bo'lmasa ham obyekt yaratiladi (`FakeProvider` bilan), lekin `configured=False`
    bo'lgani uchun `ai_enabled` yolg'on qaytaradi va AI endpoint'lari 503 beradi."""
    vectors: VectorStore = PgVectorStore() if dialect_name == "postgresql" else SqliteVectorStore()
    fake = FakeProvider()
    gemini = (
        GeminiProvider(
            settings.gemini_api_key,
            settings.gemini_embedding_model,
            TokenBucket(settings.gemini_rpm),
        )
        if settings.gemini_api_key and settings.ai_provider != "fake"
        else None
    )
    compat = (
        OpenAICompatProvider(
            settings.llm_base_url, settings.llm_api_key, TokenBucket(settings.llm_rpm)
        )
        if settings.llm_api_key and settings.ai_provider != "fake"
        else None
    )
    gemini_models = (settings.gemini_model_chat, settings.gemini_model_fast)
    compat_models = (settings.llm_model_chat, settings.llm_model_fast)
    # Asosiy provayder band bo'lsa (429/5xx), matn ikkinchisida yaratiladi.
    llm: LLMProvider = fake
    models = gemini_models
    if settings.ai_provider == "compat" and compat is not None:
        llm, models = _with_fallback(compat, gemini, compat_models, gemini_models), compat_models
    elif settings.ai_provider == "gemini" and gemini is not None:
        llm, models = _with_fallback(gemini, compat, gemini_models, compat_models), gemini_models
    # Embedding matn provayderidan mustaqil; model nomi chunk'larda saqlanadi, shuning uchun
    # almashtirilsa eski chunk'lar "eskirgan" bo'ladi va admin ularni qayta indekslaydi.
    embedder: EmbeddingProvider = fake
    if settings.ai_provider != "fake" and settings.embedding_provider == "tei":
        embedder = TeiEmbeddingProvider(settings.tei_url, settings.tei_model)
    elif settings.ai_provider != "fake" and settings.embedding_provider == "local":
        embedder = local_embedder(settings)
    elif gemini is not None:
        embedder = gemini
    return AiServices(
        llm=llm,
        embedder=embedder,
        vectors=vectors,
        configured=settings.ai_configured,
        chat_model=models[0],
        fast_model=models[1],
    )


def local_embedder(settings: Settings) -> LocalEmbeddingProvider:
    return LocalEmbeddingProvider(
        settings.local_embed_repo,
        settings.local_embed_file,
        settings.local_embed_cache,
        settings.local_embed_threads,
    )


def _with_fallback(
    primary: LLMProvider,
    secondary: LLMProvider | None,
    primary_models: tuple[str, str],
    secondary_models: tuple[str, str],
) -> LLMProvider:
    if secondary is None:
        return primary
    return FallbackProvider(
        primary,
        secondary,
        dict(zip(primary_models, secondary_models, strict=True)),
        secondary_models[0],
    )


async def get_ai_settings(db: AsyncSession) -> AiSettings:
    """Yo'q bo'lsa yaratadi va `flush` qiladi — chaqiruvchi keyin commit qilishi kerak."""
    row = await db.get(AiSettings, 1)
    if row is None:
        row = AiSettings(id=1, enabled=True, student_daily_limit=30)
        db.add(row)
        await db.flush()
    return row


async def ai_enabled(db: AsyncSession, ai: AiServices) -> bool:
    return ai.configured and (await get_ai_settings(db)).enabled


async def require_ai(db: AsyncSession, ai: AiServices) -> None:
    if not await ai_enabled(db, ai):
        raise AppError(503, "AI_DISABLED", "AI yordamchisi hozircha o'chirilgan")


async def recover_interrupted_ai(sessionmaker: async_sessionmaker[AsyncSession]) -> None:
    """Inline job'lar saqlanmaydi: server qayta ishga tushganda yarim qolganlar `failed` bo'ladi."""
    async with sessionmaker() as db:
        await db.execute(
            update(AiDraft)
            .where(AiDraft.status == DraftStatus.generating)
            .values(status=DraftStatus.failed, error="INTERRUPTED")
        )
        await db.execute(
            update(Submission)
            .where(Submission.ai_status == AiCheckStatus.pending)
            .values(ai_status=AiCheckStatus.failed)
        )
        await db.commit()
