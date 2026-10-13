"""AI xizmatlarini yig'ish va "AI yoqilganmi" tekshiruvi."""

from dataclasses import dataclass

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.models import AiDraft, AiSettings, DraftStatus
from app.ai.providers import (
    EmbeddingProvider,
    FakeProvider,
    GeminiProvider,
    LLMProvider,
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
    configured: bool  # Gemini kaliti bor yoki `AI_PROVIDER=fake`
    chat_model: str
    fast_model: str


def build_ai(settings: Settings, dialect_name: str) -> AiServices:
    """Kalit bo'lmasa ham obyekt yaratiladi (`FakeProvider` bilan), lekin `configured=False`
    bo'lgani uchun `ai_enabled` yolg'on qaytaradi va AI endpoint'lari 503 beradi."""
    vectors: VectorStore = PgVectorStore() if dialect_name == "postgresql" else SqliteVectorStore()
    llm: LLMProvider
    embedder: EmbeddingProvider
    if settings.ai_provider == "gemini" and settings.gemini_api_key:
        gemini = GeminiProvider(
            settings.gemini_api_key, settings.ai_embedding_model, TokenBucket(settings.ai_rpm)
        )
        llm, embedder = gemini, gemini
    else:
        fake = FakeProvider()
        llm, embedder = fake, fake
    return AiServices(
        llm=llm,
        embedder=embedder,
        vectors=vectors,
        configured=settings.ai_configured,
        chat_model=settings.ai_model_chat,
        fast_model=settings.ai_model_fast,
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
