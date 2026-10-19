"""AI API sxemalari."""

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.ai.constants import MAX_MESSAGE_CHARS, SUPPORT_MESSAGE_CHARS
from app.ai.models import DraftKind, DraftStatus, MessageMode, MessageRole, SupportMode
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


class SupportChatIn(BaseModel):
    message: trimmed_str(max_length=SUPPORT_MESSAGE_CHARS)  # type: ignore[valid-type]
    # Brauzer yaratgan UUID: bir mehmonning savollarini suhbatga bog'laydi.
    session_key: str = Field(
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    )
    lang: Literal["uz", "ru"] = "uz"


class SupportMeta(BaseModel):
    """Mehmon yordamchisining SSE `meta` hodisasi."""

    mode: SupportMode
    citations: list[Citation] = Field(default_factory=list)


class SupportStatusOut(BaseModel):
    enabled: bool


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


class AiSettingsOut(BaseModel):
    enabled: bool
    student_daily_limit: int
    public_enabled: bool
    public_daily_limit: int
    public_used_today: int
    configured: bool
    provider: str
    chat_model: str
    embedding_model: str


class AiSettingsUpdate(BaseModel):
    enabled: bool | None = None
    student_daily_limit: int | None = Field(default=None, ge=0, le=500)
    public_enabled: bool | None = None
    public_daily_limit: int | None = Field(default=None, ge=0, le=5000)


class AiUsageDay(BaseModel):
    day: date
    requests: int
    users: int


class AiUsageOut(BaseModel):
    days: list[AiUsageDay]
    chunks: int
    stale_chunks: int


class ReindexIn(BaseModel):
    all: bool = False


class SupportSessionOut(BaseModel):
    session_key: str
    first_question: str
    messages: int
    started_at: datetime
    last_at: datetime


class SupportSessionsPage(BaseModel):
    items: list[SupportSessionOut]
    total: int


class SupportMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question: str
    answer: str
    mode: SupportMode
    citations: list[Citation]
    created_at: datetime
