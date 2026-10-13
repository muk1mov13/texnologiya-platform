"""AI API sxemalari."""

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.ai.constants import MAX_MESSAGE_CHARS
from app.ai.models import DraftKind, DraftStatus, MessageMode, MessageRole
from app.core.types import DbId, trimmed_str


class ChatIn(BaseModel):
    message: trimmed_str(max_length=MAX_MESSAGE_CHARS)  # type: ignore[valid-type]
    topic_id: DbId | None = None
    conversation_id: DbId | None = None


class Citation(BaseModel):
    n: int
    source_type: str
    source_id: int
    title: str
    page: int | None


class ConversationOut(BaseModel):
    id: int
    topic_id: int | None
    title: str
    updated_at: datetime


class MessageOut(BaseModel):
    id: int
    role: MessageRole
    content: str
    citations: list[Citation]
    mode: MessageMode | None
    created_at: datetime


class ConversationDetailOut(ConversationOut):
    messages: list[MessageOut]


class UsageOut(BaseModel):
    used: int
    limit: int | None  # o'qituvchi/admin uchun None (cheksiz)
    enabled: bool


class ChatMeta(BaseModel):
    """SSE `meta` hodisasi tanasi (javob oxirida, `done` dan oldin yuboriladi)."""

    conversation_id: int
    mode: MessageMode
    citations: list[Citation] = Field(default_factory=list)


def citations_out(raw: list[dict[str, Any]]) -> list[Citation]:
    return [Citation.model_validate(c) for c in raw]


class DraftCreateIn(BaseModel):
    step_id: DbId
    kind: DraftKind
    material_ids: list[DbId] = Field(min_length=1, max_length=3)
    count: int = Field(ge=1, le=15)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class DraftUpdateIn(BaseModel):
    payload: dict[str, Any]


class DraftOut(BaseModel):
    id: int
    topic_id: int
    step_id: int
    kind: DraftKind
    status: DraftStatus
    params: dict[str, Any]
    payload: dict[str, Any] | None
    error: str | None
    approved_ref: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class AiReportOut(BaseModel):
    id: int
    subject_id: int
    locale: str
    period_start: date
    period_end: date
    stats: dict[str, Any]
    content: str
    created_at: datetime
