from fastapi import APIRouter, Response

from app.auth.deps import ActiveUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.files import file_response
from app.core.types import DbIdPath
from app.learning import progress, syllabus
from app.learning.student_schemas import (
    StepCompleteOut,
    StepContentOut,
    SubjectCard,
    SubjectDetailOut,
    TopicDetailOut,
)

router = APIRouter(tags=["learning"])


@router.get("/subjects", response_model=list[SubjectCard])
async def list_subjects(user: ActiveUser, db: DbSession) -> list[SubjectCard]:
    return await progress.list_subject_cards(db, user)


@router.get("/subjects/{slug}", response_model=SubjectDetailOut)
async def get_subject(slug: str, user: ActiveUser, db: DbSession) -> SubjectDetailOut:
    return await progress.subject_detail(db, user, slug)


@router.get("/subjects/{slug}/syllabus", response_class=Response)
async def get_syllabus(
    slug: str, user: ActiveUser, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    subject = await syllabus.syllabus_for_viewer(db, user, slug)
    assert subject.syllabus_pdf is not None and subject.syllabus_name is not None
    return file_response(settings, storage, subject.syllabus_pdf, subject.syllabus_name)


@router.get("/topics/{topic_id}", response_model=TopicDetailOut)
async def get_topic(topic_id: DbIdPath, user: ActiveUser, db: DbSession) -> TopicDetailOut:
    return await progress.topic_detail(db, user, topic_id)


@router.get("/steps/{step_id}", response_model=StepContentOut)
async def get_step(step_id: DbIdPath, user: ActiveUser, db: DbSession) -> StepContentOut:
    return await progress.step_content(db, user, step_id)


@router.post("/steps/{step_id}/complete", response_model=StepCompleteOut)
async def complete_step(step_id: DbIdPath, user: ActiveUser, db: DbSession) -> StepCompleteOut:
    return await progress.complete_step(db, user, step_id)
