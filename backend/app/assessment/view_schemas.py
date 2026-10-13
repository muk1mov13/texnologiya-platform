"""Talabaga ko'rinadigan sxemalar. Bu yerda to'g'ri javob maydonlari hech qachon bo'lmaydi.

`learning.student_schemas` shu modulni import qiladi, shuning uchun bu modul `learning`
sxemalarini import qilmaydi."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.assessment.models import ActivityType, SubmissionStatus, TaskType


class LayoutWord(BaseModel):
    number: int
    row: int
    col: int
    direction: Literal["across", "down"]
    length: int


class StudentLayoutWord(LayoutWord):
    clue: str


class StudentLayout(BaseModel):
    rows: int
    cols: int
    words: list[StudentLayoutWord]


class QuizItemView(BaseModel):
    text: str
    options: list[str]


class YesNoItemView(BaseModel):
    statement: str


class ActivityView(BaseModel):
    id: int
    type: ActivityType
    title: str
    items: list[QuizItemView | YesNoItemView]
    layout: StudentLayout | None
    best_percent: float | None
    attempts_count: int


class TaskView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    type: TaskType
    max_score: int
    rubric: str | None
    deadline: datetime | None


class SubmissionView(BaseModel):
    id: int
    status: SubmissionStatus
    text: str | None
    original_name: str | None
    file_url: str | None
    score: int | None
    feedback: str | None
    submitted_at: datetime
    graded_at: datetime | None
    is_late: bool
