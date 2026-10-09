from fastapi import APIRouter, Response

from app.auth.deps import StaffUser
from app.core.deps import AppStorage, DbSession
from app.core.types import DbIdPath
from app.learning import editing
from app.learning.schemas import (
    TeachSubjectOut,
    TeachTopicBrief,
    TopicCreate,
    TopicEditorOut,
    TopicOrderIn,
    TopicUpdate,
)

router = APIRouter(prefix="/teach", tags=["teach"])


@router.get("/subjects", response_model=list[TeachSubjectOut])
async def my_subjects(user: StaffUser, db: DbSession) -> list[TeachSubjectOut]:
    return await editing.list_teach_subjects(db, user)


@router.post("/subjects/{subject_id}/topics", response_model=TopicEditorOut, status_code=201)
async def create_topic(
    subject_id: DbIdPath, data: TopicCreate, user: StaffUser, db: DbSession
) -> TopicEditorOut:
    await editing.ensure_can_edit_subject(db, user, subject_id)
    topic = await editing.create_topic(db, subject_id, data)
    return await editing.topic_editor_view(db, topic)


@router.put("/subjects/{subject_id}/topics/order", response_model=list[TeachTopicBrief])
async def reorder_topics(
    subject_id: DbIdPath, data: TopicOrderIn, user: StaffUser, db: DbSession
) -> list[TeachTopicBrief]:
    await editing.ensure_can_edit_subject(db, user, subject_id)
    topics = await editing.reorder_topics(db, subject_id, data.topic_ids)
    return [TeachTopicBrief.model_validate(t) for t in topics]


@router.get("/topics/{topic_id}", response_model=TopicEditorOut)
async def get_topic(topic_id: DbIdPath, user: StaffUser, db: DbSession) -> TopicEditorOut:
    topic = await editing.ensure_can_edit_topic(db, user, topic_id)
    return await editing.topic_editor_view(db, topic)


@router.patch("/topics/{topic_id}", response_model=TopicEditorOut)
async def update_topic(
    topic_id: DbIdPath, data: TopicUpdate, user: StaffUser, db: DbSession
) -> TopicEditorOut:
    topic = await editing.ensure_can_edit_topic(db, user, topic_id)
    topic = await editing.update_topic(db, topic, data)
    return await editing.topic_editor_view(db, topic)


@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(
    topic_id: DbIdPath, user: StaffUser, db: DbSession, storage: AppStorage
) -> Response:
    topic = await editing.ensure_can_edit_topic(db, user, topic_id)
    for path in await editing.delete_topic(db, topic):
        storage.delete(path)
    return Response(status_code=204)
