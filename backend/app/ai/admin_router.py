"""Admin: AI sozlamalari, sarf statistikasi, indeksni qayta qurish va mehmon suhbatlari."""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Path, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import support
from app.ai.constants import REINDEX_JOB
from app.ai.models import AiSettings, AiUsage, DocChunk, SupportMessage
from app.ai.providers import FallbackProvider
from app.ai.schemas import (
    AiSettingsOut,
    AiSettingsUpdate,
    AiUsageDay,
    AiUsageOut,
    ReindexIn,
    SupportMessageOut,
    SupportSessionsPage,
)
from app.ai.services import AiServices, get_ai_settings, require_ai
from app.ai.usage import today
from app.auth.deps import AdminUser
from app.core.config import Settings
from app.core.deps import Ai, AppSettings, DbSession, Jobs

router = APIRouter(prefix="/admin/ai", tags=["admin-ai"])


def _fallback_name(settings: Settings) -> str:
    return "+gemini" if settings.ai_provider == "compat" else "+compat"


SessionKey = Annotated[str, Path(pattern=r"^[0-9a-f-]{36}$")]


async def _settings_out(
    db: AsyncSession, row: AiSettings, settings: Settings, ai: AiServices
) -> AiSettingsOut:
    """Kalitning o'zi hech qachon qaytarilmaydi — faqat sozlangan yoki yo'qligi."""
    return AiSettingsOut(
        enabled=row.enabled,
        student_daily_limit=row.student_daily_limit,
        public_enabled=row.public_enabled,
        public_daily_limit=row.public_daily_limit,
        public_used_today=await support.used_today(db),
        configured=ai.configured,
        provider=settings.ai_provider
        + (_fallback_name(settings) if isinstance(ai.llm, FallbackProvider) else ""),
        chat_model=ai.chat_model,
        embedding_model=ai.embedder.model_name,
    )


@router.get("/settings", response_model=AiSettingsOut)
async def get_ai_settings_(
    _: AdminUser, db: DbSession, settings: AppSettings, ai: Ai
) -> AiSettingsOut:
    row = await get_ai_settings(db)
    await db.commit()
    return await _settings_out(db, row, settings, ai)


@router.patch("/settings", response_model=AiSettingsOut)
async def update_ai_settings(
    data: AiSettingsUpdate, _: AdminUser, db: DbSession, settings: AppSettings, ai: Ai
) -> AiSettingsOut:
    row = await get_ai_settings(db)
    if data.enabled is not None:
        row.enabled = data.enabled
    if data.student_daily_limit is not None:
        row.student_daily_limit = data.student_daily_limit
    if data.public_enabled is not None:
        row.public_enabled = data.public_enabled
    if data.public_daily_limit is not None:
        row.public_daily_limit = data.public_daily_limit
    await db.commit()
    return await _settings_out(db, row, settings, ai)


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


@router.get("/support", response_model=SupportSessionsPage)
async def support_sessions(
    _: AdminUser,
    db: DbSession,
    page: Annotated[int, Query(ge=1, le=10000)] = 1,
    size: Annotated[int, Query(ge=1, le=50)] = 20,
) -> SupportSessionsPage:
    return await support.sessions_page(db, page=page, size=size)


@router.get("/support/{session_key}", response_model=list[SupportMessageOut])
async def support_session(
    session_key: SessionKey, _: AdminUser, db: DbSession
) -> list[SupportMessage]:
    return await support.session_messages(db, session_key)


@router.delete("/support/{session_key}", status_code=204)
async def delete_support_session(session_key: SessionKey, _: AdminUser, db: DbSession) -> Response:
    await support.delete_session(db, session_key)
    return Response(status_code=204)
