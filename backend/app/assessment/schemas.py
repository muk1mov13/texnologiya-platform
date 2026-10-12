from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.assessment.models import ActivityType
from app.assessment.view_schemas import LayoutWord
from app.core.types import DbId, trimmed_str


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
