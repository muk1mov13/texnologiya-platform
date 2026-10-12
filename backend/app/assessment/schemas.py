from datetime import datetime
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints

from app.assessment.models import ActivityType, SubmissionStatus, TaskType
from app.assessment.view_schemas import LayoutWord, SubmissionView
from app.core.types import DbId, trimmed_str
from app.gamification.schemas import RewardsOut
from app.learning.student_schemas import StepBrief


class QuizItemIn(BaseModel):
    text: trimmed_str(max_length=1000)  # type: ignore[valid-type]
    options: list[trimmed_str(max_length=300)] = Field(  # type: ignore[valid-type]
        min_length=4, max_length=4
    )
    correct_index: int = Field(ge=0, le=3)
    explanation: str | None = Field(default=None, max_length=2000)


class YesNoItemIn(BaseModel):
    statement: trimmed_str(max_length=1000)  # type: ignore[valid-type]
    answer: bool
    explanation: str | None = Field(default=None, max_length=2000)


class CrosswordItemIn(BaseModel):
    word: trimmed_str(max_length=60)  # type: ignore[valid-type]
    clue: trimmed_str(max_length=300)  # type: ignore[valid-type]


class QuizActivityIn(BaseModel):
    type: Literal["quiz"]
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    items: list[QuizItemIn] = Field(min_length=1, max_length=50)


class YesNoActivityIn(BaseModel):
    type: Literal["yesno"]
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    items: list[YesNoItemIn] = Field(min_length=1, max_length=50)


class CrosswordActivityIn(BaseModel):
    type: Literal["crossword"]
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    items: list[CrosswordItemIn] = Field(min_length=3, max_length=20)


# Router'da `Body(discriminator="type")` bilan ishlatiladi.
ActivityIn = QuizActivityIn | YesNoActivityIn | CrosswordActivityIn


class ActivityPublishIn(BaseModel):
    is_published: bool


class ActivityOrderIn(BaseModel):
    ids: list[DbId] = Field(max_length=100)


class QuizItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    options: list[str]
    correct_index: int
    explanation: str | None


class YesNoItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    statement: str
    answer: bool
    explanation: str | None


class CrosswordItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    word: str
    clue: str


class TeachLayoutWord(LayoutWord):
    word_id: int
    cells: list[str]


class TeachLayout(BaseModel):
    rows: int
    cols: int
    words: list[TeachLayoutWord]


class ActivityTeachOut(BaseModel):
    id: int
    step_id: int
    type: ActivityType
    title: str
    order: int
    is_published: bool
    items: list[QuizItemOut | YesNoItemOut | CrosswordItemOut]
    layout: TeachLayout | None


AnswerText = Annotated[str, StringConstraints(max_length=100)]


class AttemptIn(BaseModel):
    """Javoblar talabaga yuborilgan elementlar tartibida: test — 0..3, ha/yo'q — bool,
    krossvord — so'z satri; javobsiz element — null."""

    answers: list[int | bool | AnswerText | None] = Field(max_length=50)


class ResultItem(BaseModel):
    prompt: str
    options: list[str] | None = None
    given: int | bool | str | None
    correct: int | bool | str
    is_correct: bool
    explanation: str | None = None


class AttemptOut(BaseModel):
    attempt_id: int
    activity_id: int
    score: int
    max_score: int
    result: list[ResultItem]
    rewards: RewardsOut
    step: StepBrief


class TaskIn(BaseModel):
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    description: trimmed_str(max_length=10000)  # type: ignore[valid-type]
    type: TaskType
    max_score: int = Field(ge=1, le=100)
    rubric: str | None = Field(default=None, max_length=5000)
    deadline: AwareDatetime | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    step_id: int
    title: str
    description: str
    type: TaskType
    max_score: int
    rubric: str | None
    deadline: datetime | None


class SubmitOut(BaseModel):
    submission: SubmissionView
    rewards: RewardsOut
    step: StepBrief


class SubmissionQueueItem(BaseModel):
    id: int
    status: SubmissionStatus
    student_name: str
    subject_id: int
    subject_title: str
    topic_id: int
    topic_title: str
    task_id: int
    task_title: str
    submitted_at: datetime
    is_late: bool


class SubmissionDetailOut(SubmissionQueueItem):
    task_description: str
    rubric: str | None
    max_score: int
    text: str | None
    original_name: str | None
    file_url: str | None
    score: int | None
    feedback: str | None
    graded_at: datetime | None


class GradeIn(BaseModel):
    # Oraliq (0..max_score) servisda tekshiriladi: SCORE_OUT_OF_RANGE.
    score: int = Field(ge=-1_000_000, le=1_000_000)
    feedback: str | None = Field(default=None, max_length=5000)


class ReturnIn(BaseModel):
    feedback: trimmed_str(max_length=5000)  # type: ignore[valid-type]


class TeachSummaryOut(BaseModel):
    pending_submissions: int
