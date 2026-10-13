from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import JSON, Boolean, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, str_enum, utcnow
from app.learning.models import StepKind


class ActivityType(StrEnum):
    quiz = "quiz"
    yesno = "yesno"
    crossword = "crossword"


class TaskType(StrEnum):
    text = "text"
    file = "file"
    both = "both"


class SubmissionStatus(StrEnum):
    submitted = "submitted"
    graded = "graded"
    returned = "returned"


ACTIVITY_STEP_KINDS = frozenset({StepKind.review, StepKind.practice})


class Activity(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "activities"

    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[ActivityType] = mapped_column(str_enum(ActivityType))
    title: Mapped[str] = mapped_column(String(200))
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    # Faqat krossvordda: server qurgan to'r (crossword.layout_to_json).
    layout: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class QuizQuestion(IdMixin, Base):
    __tablename__ = "quiz_questions"

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str]] = mapped_column(JSON)
    correct_index: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str | None] = mapped_column(Text)


class YesNoItem(IdMixin, Base):
    __tablename__ = "yesno_items"

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    statement: Mapped[str] = mapped_column(Text)
    answer: Mapped[bool] = mapped_column(Boolean)
    explanation: Mapped[str | None] = mapped_column(Text)


class CrosswordWord(IdMixin, Base):
    __tablename__ = "crossword_words"

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    word: Mapped[str] = mapped_column(String(80))  # normallashtirilgan (crossword.normalize_word)
    clue: Mapped[str] = mapped_column(String(300))


class Attempt(IdMixin, CreatedAtMixin, Base):
    """Bitta urinish. `result` — har element bo'yicha natija nusxasi, shuning uchun faoliyat
    keyin tahrirlansa ham eski urinish to'g'ri ko'rinadi."""

    __tablename__ = "attempts"
    __table_args__ = (Index("ix_attempts_user_id_activity_id", "user_id", "activity_id"),)

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    score: Mapped[int] = mapped_column(Integer)
    max_score: Mapped[int] = mapped_column(Integer)
    result: Mapped[list[dict[str, Any]]] = mapped_column(JSON)


class Task(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "tasks"

    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), unique=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    type: Mapped[TaskType] = mapped_column(str_enum(TaskType))
    max_score: Mapped[int] = mapped_column(Integer)
    rubric: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[datetime | None] = mapped_column(UTCDateTime)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class Submission(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "submissions"
    __table_args__ = (UniqueConstraint("task_id", "user_id"),)

    task_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("tasks.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str | None] = mapped_column(Text)
    file: Mapped[str | None] = mapped_column(String(500))
    original_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[SubmissionStatus] = mapped_column(
        str_enum(SubmissionStatus), default=SubmissionStatus.submitted, index=True
    )
    score: Mapped[int | None] = mapped_column(Integer)
    feedback: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(UTCDateTime)
    graded_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL")
    )
    graded_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
