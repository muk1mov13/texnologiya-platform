from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, str_enum, utcnow


class StepKind(StrEnum):
    review = "review"
    lecture = "lecture"
    presentation = "presentation"
    practice = "practice"
    task = "task"
    glossary = "glossary"
    literature = "literature"


STEP_KINDS_IN_ORDER: tuple[StepKind, ...] = tuple(StepKind)
FILE_STEP_KINDS = frozenset({StepKind.lecture, StepKind.presentation})
SELF_COMPLETE_STEP_KINDS = frozenset(
    {StepKind.lecture, StepKind.presentation, StepKind.glossary, StepKind.literature}
)


class LessonType(StrEnum):
    """Mashg'ulot turi: fan sahifasida mavzular shu bo'yicha guruhlanadi."""

    lecture = "lecture"
    practical = "practical"
    seminar = "seminar"
    lab = "lab"


class MaterialStatus(StrEnum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class ProgressStatus(StrEnum):
    in_progress = "in_progress"
    completed = "completed"


subject_teachers = Table(
    "subject_teachers",
    Base.metadata,
    Column("subject_id", BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Subject(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "subjects"

    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    cover: Mapped[str | None] = mapped_column(String(500))
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)


class Topic(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "topics"

    subject_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(Text, default="")
    lesson_type: Mapped[LessonType] = mapped_column(
        str_enum(LessonType), default=LessonType.lecture, server_default=LessonType.lecture.value
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)


class Step(IdMixin, Base):
    __tablename__ = "steps"
    __table_args__ = (UniqueConstraint("topic_id", "kind"),)

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[StepKind] = mapped_column(str_enum(StepKind))
    order: Mapped[int] = mapped_column(Integer)


class Material(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "materials"

    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    original_file: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(255))
    pdf_file: Mapped[str | None] = mapped_column(String(500))
    page_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[MaterialStatus] = mapped_column(
        str_enum(MaterialStatus), default=MaterialStatus.processing
    )
    error: Mapped[str | None] = mapped_column(String(100))
    uploaded_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL")
    )


class GlossaryTerm(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "glossary_terms"

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    term: Mapped[str] = mapped_column(String(200))
    definition: Mapped[str] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)


class LiteratureItem(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "literature"

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    author: Mapped[str] = mapped_column(String(200), default="")
    year: Mapped[int | None] = mapped_column(Integer)
    url: Mapped[str | None] = mapped_column(String(500))
    order: Mapped[int] = mapped_column(Integer, default=0)


class StepProgress(IdMixin, Base):
    __tablename__ = "step_progress"
    __table_args__ = (UniqueConstraint("user_id", "step_id"),)

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[ProgressStatus] = mapped_column(
        str_enum(ProgressStatus), default=ProgressStatus.in_progress
    )
    best_score: Mapped[float | None] = mapped_column(Float)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)
