from pydantic import BaseModel

from app.assessment.view_schemas import ActivityView, SubmissionView, TaskView
from app.gamification.schemas import ProfileOut, RewardsOut
from app.learning.models import LessonType, ProgressStatus, StepKind
from app.learning.schemas import GlossaryOut, LiteratureOut


class ProgressOut(BaseModel):
    completed: int
    total: int


class SubjectCard(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    cover: str | None
    topic_count: int
    # To'liq tugatilgan mavzular (kontentli barcha bosqichlari bajarilgan).
    topics_completed: int
    progress: ProgressOut


class TopicCard(BaseModel):
    id: int
    title: str
    summary: str
    order: int
    lesson_type: LessonType
    progress: ProgressOut


class SubjectDetailOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    cover: str | None
    syllabus_name: str | None
    topics: list[TopicCard]


class SubjectRef(BaseModel):
    id: int
    title: str
    slug: str


class StepBrief(BaseModel):
    id: int
    kind: StepKind
    order: int
    has_content: bool
    status: ProgressStatus | None


class StepCompleteOut(StepBrief):
    rewards: RewardsOut


class TopicDetailOut(BaseModel):
    id: int
    title: str
    summary: str
    lesson_type: LessonType
    subject: SubjectRef
    steps: list[StepBrief]
    progress: ProgressOut


class MaterialView(BaseModel):
    id: int
    title: str
    page_count: int | None
    file_url: str


class StepContentOut(BaseModel):
    id: int
    topic_id: int
    kind: StepKind
    order: int
    has_content: bool
    status: ProgressStatus | None
    materials: list[MaterialView]
    glossary: list[GlossaryOut]
    literature: list[LiteratureOut]
    activities: list[ActivityView] = []
    task: TaskView | None = None
    submission: SubmissionView | None = None


class ContinueOut(BaseModel):
    subject_id: int
    subject_slug: str
    subject_title: str
    topic_id: int
    topic_title: str
    step_id: int
    step_kind: StepKind


class DashboardOut(ProfileOut):
    continue_step: ContinueOut | None


class SubjectProgressOut(BaseModel):
    subject_id: int
    subject_title: str
    subject_slug: str
    progress: ProgressOut
