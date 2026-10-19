"""AI jadvallari (3-bosqich)."""

from datetime import date, datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    DDL,
    JSON,
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    event,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.ai.constants import EMBEDDING_DIM
from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, Vector, str_enum, utcnow


class ChunkSource(StrEnum):
    material = "material"
    glossary = "glossary"
    activity = "activity"
    task = "task"
    document = "document"  # 4-bosqich
    book = "book"  # 4-bosqich
    topic_info = "topic_info"  # mavzu nomi, atamalar, adabiyotlar (`source_id = topic_id`)


# Repetitor kontekstiga kiradigan manbalar. `activity`/`task` — faqat maslahat rejimi uchun.
CONTEXT_SOURCES = (ChunkSource.material, ChunkSource.glossary, ChunkSource.topic_info)
QUESTION_SOURCES = (ChunkSource.activity, ChunkSource.task)
# Kutubxona bo'laklari hech qaysi fan/mavzuga bog'lanmagan (`subject_id`, `topic_id` NULL):
# repetitor ularni faqat oxirgi (butun platforma) darajada qidiradi.
LIBRARY_SOURCES = (ChunkSource.document, ChunkSource.book)


class MessageRole(StrEnum):
    user = "user"
    assistant = "assistant"


class MessageMode(StrEnum):
    answer = "answer"
    hint = "hint"
    refusal = "refusal"
    canned = "canned"


class SupportMode(StrEnum):
    answer = "answer"
    canned = "canned"


class DraftKind(StrEnum):
    quiz = "quiz"
    yesno = "yesno"
    crossword = "crossword"
    glossary = "glossary"
    task = "task"


class DraftStatus(StrEnum):
    generating = "generating"
    draft = "draft"
    approved = "approved"
    rejected = "rejected"
    failed = "failed"


class DocChunk(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "doc_chunks"
    __table_args__ = (Index("ix_doc_chunks_source", "source_type", "source_id"),)

    source_type: Mapped[ChunkSource] = mapped_column(str_enum(ChunkSource))
    source_id: Mapped[int] = mapped_column(BigIntPK)
    subject_id: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    topic_id: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    page: Mapped[int | None] = mapped_column(Integer)
    chunk_index: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))
    embedding_model: Mapped[str] = mapped_column(String(100))


# pgvector kengaytmasi va HNSW indeksi faqat PostgreSQL'da. `create_all` (testlar) shu DDL'ni
# ishlatadi; migratsiya o'zi yaratadi. Alembic taqqoslashidan indeks `env.py` da chiqariladi.
HNSW_INDEX = "ix_doc_chunks_embedding_hnsw"
event.listen(
    DocChunk.__table__,
    "before_create",
    DDL("CREATE EXTENSION IF NOT EXISTS vector").execute_if(dialect="postgresql"),
)
event.listen(
    DocChunk.__table__,
    "after_create",
    DDL(
        f"CREATE INDEX {HNSW_INDEX} ON doc_chunks USING hnsw (embedding vector_cosine_ops)"
    ).execute_if(dialect="postgresql"),
)


class AiConversation(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_conversations"

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    topic_id: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="SET NULL")
    )
    title: Mapped[str] = mapped_column(String(80))
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class AiMessage(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_messages"

    conversation_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[MessageRole] = mapped_column(str_enum(MessageRole))
    content: Mapped[str] = mapped_column(Text)
    citations: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    mode: Mapped[MessageMode | None] = mapped_column(str_enum(MessageMode))


class AiDraft(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_drafts"

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"))
    requested_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL")
    )
    kind: Mapped[DraftKind] = mapped_column(str_enum(DraftKind))
    params: Mapped[dict[str, Any]] = mapped_column(JSON)
    status: Mapped[DraftStatus] = mapped_column(
        str_enum(DraftStatus), default=DraftStatus.generating
    )
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(String(500))
    approved_ref: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class AiReport(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_reports"
    __table_args__ = (UniqueConstraint("subject_id", "locale", "period_start"),)

    subject_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    locale: Mapped[str] = mapped_column(String(5))
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    stats: Mapped[dict[str, Any]] = mapped_column(JSON)
    content: Mapped[str] = mapped_column(Text)


class AiUsage(IdMixin, Base):
    __tablename__ = "ai_usage"
    __table_args__ = (UniqueConstraint("user_id", "day"),)

    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    # `date` emas: maydon nomi `datetime.date` tipini sinf ichida soya qilardi.
    day: Mapped[date] = mapped_column(Date)  # Asia/Tashkent sanasi
    requests: Mapped[int] = mapped_column(Integer, default=0)


class AiSettings(Base):
    """Bitta qator (`id=1`). Yo'q bo'lsa `services.get_ai_settings` yaratadi."""

    __tablename__ = "ai_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    student_daily_limit: Mapped[int] = mapped_column(Integer, default=30)
    # Ochiq saytdagi mehmonlar yordamchisi: butun sayt bo'yicha kunlik so'rovlar chegarasi.
    public_enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    public_daily_limit: Mapped[int] = mapped_column(Integer, default=300, server_default="300")
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class SupportMessage(IdMixin, CreatedAtMixin, Base):
    """Mehmon yordamchisidagi bitta savol-javob. IP, ism yoki email saqlanmaydi."""

    __tablename__ = "support_messages"

    session_key: Mapped[str] = mapped_column(String(36), index=True)  # brauzer yaratgan UUID
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    mode: Mapped[SupportMode] = mapped_column(str_enum(SupportMode))
    citations: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
