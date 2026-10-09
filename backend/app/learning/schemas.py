from pydantic import BaseModel, ConfigDict, Field

from app.core.types import DbId, Order31, trimmed_str
from app.learning.models import MaterialStatus, StepKind

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
URL_PATTERN = r"^https?://\S+$"


class SubjectCreate(BaseModel):
    title: trimmed_str(min_length=2, max_length=200)  # type: ignore[valid-type]
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    description: str = Field(default="", max_length=5000)
    order: Order31 = 0
    is_published: bool = False


class SubjectUpdate(BaseModel):
    title: trimmed_str(min_length=2, max_length=200) | None = None  # type: ignore[valid-type]
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    description: str | None = Field(default=None, max_length=5000)
    order: Order31 | None = None
    is_published: bool | None = None


class SubjectAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    description: str
    cover: str | None
    order: int
    is_published: bool
    teacher_ids: list[int] = []


class TeachersIn(BaseModel):
    teacher_ids: list[DbId] = Field(max_length=50)


class TopicCreate(BaseModel):
    title: trimmed_str(min_length=2, max_length=200)  # type: ignore[valid-type]
    summary: str = Field(default="", max_length=5000)
    is_published: bool = False


class TopicUpdate(BaseModel):
    title: trimmed_str(min_length=2, max_length=200) | None = None  # type: ignore[valid-type]
    summary: str | None = Field(default=None, max_length=5000)
    is_published: bool | None = None


class TopicOrderIn(BaseModel):
    topic_ids: list[DbId]


class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    step_id: int
    title: str
    original_name: str
    page_count: int | None
    status: MaterialStatus
    error: str | None


class GlossaryIn(BaseModel):
    term: trimmed_str(min_length=1, max_length=200)  # type: ignore[valid-type]
    definition: trimmed_str(min_length=1, max_length=5000)  # type: ignore[valid-type]


class GlossaryUpdate(BaseModel):
    term: trimmed_str(min_length=1, max_length=200) | None = None  # type: ignore[valid-type]
    definition: trimmed_str(min_length=1, max_length=5000) | None = None  # type: ignore[valid-type]


class GlossaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    term: str
    definition: str
    order: int


class LiteratureIn(BaseModel):
    title: trimmed_str(min_length=1, max_length=300)  # type: ignore[valid-type]
    author: str = Field(default="", max_length=200)
    year: int | None = Field(default=None, ge=1900, le=2100)
    url: str | None = Field(default=None, max_length=500, pattern=URL_PATTERN)


class LiteratureUpdate(BaseModel):
    title: trimmed_str(min_length=1, max_length=300) | None = None  # type: ignore[valid-type]
    author: str | None = Field(default=None, max_length=200)
    year: int | None = Field(default=None, ge=1900, le=2100)
    url: str | None = Field(default=None, max_length=500, pattern=URL_PATTERN)


class LiteratureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    year: int | None
    url: str | None
    order: int


class StepEditorOut(BaseModel):
    id: int
    kind: StepKind
    order: int
    materials: list[MaterialOut]


class TopicEditorOut(BaseModel):
    id: int
    subject_id: int
    title: str
    summary: str
    order: int
    is_published: bool
    steps: list[StepEditorOut]
    glossary: list[GlossaryOut]
    literature: list[LiteratureOut]


class TeachTopicBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    order: int
    is_published: bool


class TeachSubjectOut(BaseModel):
    id: int
    title: str
    slug: str
    is_published: bool
    topics: list[TeachTopicBrief]
