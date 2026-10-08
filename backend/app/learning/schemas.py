from pydantic import BaseModel, ConfigDict, Field

from app.learning.models import MaterialStatus, StepKind

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
URL_PATTERN = r"^https?://\S+$"


class SubjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    description: str = Field(default="", max_length=5000)
    order: int = 0
    is_published: bool = False


class SubjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    description: str | None = Field(default=None, max_length=5000)
    order: int | None = None
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
    teacher_ids: list[int] = Field(max_length=50)


class TopicCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    summary: str = Field(default="", max_length=5000)
    is_published: bool = False


class TopicUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    summary: str | None = Field(default=None, max_length=5000)
    is_published: bool | None = None


class TopicOrderIn(BaseModel):
    topic_ids: list[int]


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
    term: str = Field(min_length=1, max_length=200)
    definition: str = Field(min_length=1, max_length=5000)


class GlossaryUpdate(BaseModel):
    term: str | None = Field(default=None, min_length=1, max_length=200)
    definition: str | None = Field(default=None, min_length=1, max_length=5000)


class GlossaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    term: str
    definition: str
    order: int


class LiteratureIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    author: str = Field(default="", max_length=200)
    year: int | None = Field(default=None, ge=1900, le=2100)
    url: str | None = Field(default=None, max_length=500, pattern=URL_PATTERN)


class LiteratureUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
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
