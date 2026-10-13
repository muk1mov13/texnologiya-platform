"""Admin: AI sozlamalari, sarf statistikasi va indeksni qayta qurish."""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.ai.constants import REINDEX_JOB
from app.ai.models import AiSettings, AiUsage, DocChunk
from app.ai.providers import FallbackProvider
from app.ai.schemas import AiSettingsOut, AiSettingsUpdate, AiUsageDay, AiUsageOut, ReindexIn
from app.ai.services import AiServices, get_ai_settings, require_ai
from app.ai.usage import today
from app.auth.deps import AdminUser
from app.core.config import Settings
from app.core.deps import Ai, AppSettings, DbSession, Jobs

router = APIRouter(prefix="/admin/ai", tags=["admin-ai"])


def _settings_out(row: AiSettings, settings: Settings, ai: AiServices) -> AiSettingsOut:
    """Kalitning o'zi hech qachon qaytarilmaydi — faqat sozlangan yoki yo'qligi."""
    return AiSettingsOut(
        enabled=row.enabled,
        student_daily_limit=row.student_daily_limit,
        configured=ai.configured,
        provider=settings.ai_provider + ("+groq" if isinstance(ai.llm, FallbackProvider) else ""),
        chat_model=settings.ai_model_chat,
        embedding_model=ai.embedder.model_name,
    )


@router.get("/settings", response_model=AiSettingsOut)
async def get_ai_settings_(
    _: AdminUser, db: DbSession, settings: AppSettings, ai: Ai
) -> AiSettingsOut:
    row = await get_ai_settings(db)
    await db.commit()
    return _settings_out(row, settings, ai)


@router.patch("/settings", response_model=AiSettingsOut)
async def update_ai_settings(
    data: AiSettingsUpdate, _: AdminUser, db: DbSession, settings: AppSettings, ai: Ai
) -> AiSettingsOut:
    row = await get_ai_settings(db)
    if data.enabled is not None:
        row.enabled = data.enabled
    if data.student_daily_limit is not None:
        row.student_daily_limit = data.student_daily_limit
    await db.commit()
    return _settings_out(row, settings, ai)


@router.get("/usage", response_model=AiUsageOut)
async def ai_usage(
    _: AdminUser, db: DbSession, ai: Ai, days: Annotated[int, Query(ge=1, le=90)] = 30
) -> AiUsageOut:
    since = today() - timedelta(days=days - 1)
    rows = await db.execute(
        select(AiUsage.day, func.sum(AiUsage.requests), func.count(AiUsage.user_id))
        .where(AiUsage.day >= since)
        .group_by(AiUsage.day)
        .order_by(AiUsage.day)
    )
    chunks = await db.scalar(select(func.count()).select_from(DocChunk))
    stale = await db.scalar(
        select(func.count())
        .select_from(DocChunk)
        .where(DocChunk.embedding_model != ai.embedder.model_name)
    )
    return AiUsageOut(
        days=[AiUsageDay(day=d, requests=int(r), users=int(u)) for d, r, u in rows],
        chunks=int(chunks or 0),
        stale_chunks=int(stale or 0),
    )


@router.post("/reindex", status_code=202)
async def reindex(
    data: ReindexIn, _: AdminUser, db: DbSession, ai: Ai, jobs: Jobs
) -> dict[str, bool]:
    await require_ai(db, ai)
    await jobs.enqueue(REINDEX_JOB, everything=data.all)
    return {"queued": True}
