from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.ai import support, tutor, usage
from app.ai.models import AiConversation, AiMessage
from app.ai.schemas import (
    ChatIn,
    ConversationDetailOut,
    ConversationOut,
    MessageOut,
    SupportChatIn,
    SupportStatusOut,
    UsageOut,
    citations_out,
)
from app.ai.services import ai_enabled, get_ai_settings
from app.auth.deps import ActiveUser
from app.auth.models import Role
from app.core.deps import Ai, AppSettings, DbSession, SupportLimiter
from app.core.errors import AppError
from app.core.types import DbIdPath

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_class=StreamingResponse)
async def chat(
    data: ChatIn,
    user: ActiveUser,
    db: DbSession,
    ai: Ai,
    settings: AppSettings,
    request: Request,
) -> StreamingResponse:
    prepared = await tutor.prepare(db, ai, settings, user, data)
    await db.commit()  # get_ai_settings qatorni yaratgan bo'lishi mumkin
    return StreamingResponse(
        tutor.stream(prepared, ai, user, request.app.state.sessionmaker),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/support/status", response_model=SupportStatusOut)
async def support_status(db: DbSession, ai: Ai) -> SupportStatusOut:
    enabled = await support.public_enabled(db, ai)
    await db.commit()
    return SupportStatusOut(enabled=enabled)


@router.post("/support/chat", response_class=StreamingResponse)
async def support_chat(
    data: SupportChatIn,
    db: DbSession,
    ai: Ai,
    settings: AppSettings,
    limiter: SupportLimiter,
    request: Request,
) -> StreamingResponse:
    """Mehmon yordamchisi (login talab qilinmaydi), IP bo'yicha cheklangan."""
    key = request.client.host if request.client else "-"
    if limiter.is_blocked(key):
        raise AppError(
            429, "SUPPORT_RATE_LIMITED", "Juda ko'p savol yuborildi. Birozdan so'ng urinib ko'ring"
        )
    limiter.record_failure(key)  # har bir savol sanaladi (contact formadagi kabi)
    prepared = await support.prepare(db, ai, settings, data)
    await db.commit()  # get_ai_settings qatorni yaratgan bo'lishi mumkin
    return StreamingResponse(
        support.stream(prepared, ai, request.app.state.sessionmaker),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/usage", response_model=UsageOut)
async def my_usage(user: ActiveUser, db: DbSession, ai: Ai) -> UsageOut:
    limit = (await get_ai_settings(db)).student_daily_limit
    enabled = await ai_enabled(db, ai)
    used = await usage.used_today(db, user.id)
    await db.commit()
    return UsageOut(used=used, limit=limit if user.role == Role.student else None, enabled=enabled)


@router.get("/conversations", response_model=list[ConversationOut])
async def conversations(user: ActiveUser, db: DbSession) -> list[AiConversation]:
    return list(
        await db.scalars(
            select(AiConversation)
            .where(AiConversation.user_id == user.id)
            .order_by(AiConversation.updated_at.desc())
            .limit(50)
        )
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailOut)
async def conversation(
    conversation_id: DbIdPath, user: ActiveUser, db: DbSession
) -> ConversationDetailOut:
    conv = await tutor.own_conversation(db, user, conversation_id)
    messages = await db.scalars(
        select(AiMessage).where(AiMessage.conversation_id == conv.id).order_by(AiMessage.id)
    )
    return ConversationDetailOut(
        id=conv.id,
        topic_id=conv.topic_id,
        title=conv.title,
        updated_at=conv.updated_at,
        messages=[
            MessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                citations=citations_out(m.citations),
                mode=m.mode,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: DbIdPath, user: ActiveUser, db: DbSession
) -> Response:
    await db.delete(await tutor.own_conversation(db, user, conversation_id))
    await db.commit()
    return Response(status_code=204)
