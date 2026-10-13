from fastapi import APIRouter, Response

from app.ai.constants import INDEX_GLOSSARY_JOB
from app.auth.deps import StaffUser
from app.core.deps import DbSession, Jobs
from app.core.types import DbIdPath
from app.learning import editing, topic_items
from app.learning.models import GlossaryTerm, LiteratureItem
from app.learning.schemas import (
    GlossaryIn,
    GlossaryOut,
    GlossaryUpdate,
    LiteratureIn,
    LiteratureOut,
    LiteratureUpdate,
)

router = APIRouter(prefix="/teach/topics/{topic_id}", tags=["teach"])


@router.get("/glossary", response_model=list[GlossaryOut])
async def list_glossary(topic_id: DbIdPath, user: StaffUser, db: DbSession) -> list[GlossaryTerm]:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return await topic_items.list_glossary(db, topic_id)


@router.post("/glossary", response_model=GlossaryOut, status_code=201)
async def add_glossary_term(
    topic_id: DbIdPath, data: GlossaryIn, user: StaffUser, db: DbSession, jobs: Jobs
) -> GlossaryTerm:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    term = await topic_items.add_glossary_term(db, topic_id, data)
    await jobs.enqueue(INDEX_GLOSSARY_JOB, topic_id=topic_id)
    return term


@router.patch("/glossary/{term_id}", response_model=GlossaryOut)
async def update_glossary_term(
    topic_id: DbIdPath,
    term_id: DbIdPath,
    data: GlossaryUpdate,
    user: StaffUser,
    db: DbSession,
    jobs: Jobs,
) -> GlossaryTerm:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    term = await topic_items.get_glossary_term(db, topic_id, term_id)
    term = await topic_items.update_glossary_term(db, term, data)
    await jobs.enqueue(INDEX_GLOSSARY_JOB, topic_id=topic_id)
    return term


@router.delete("/glossary/{term_id}", status_code=204)
async def delete_glossary_term(
    topic_id: DbIdPath, term_id: DbIdPath, user: StaffUser, db: DbSession, jobs: Jobs
) -> Response:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    await topic_items.delete_item(db, await topic_items.get_glossary_term(db, topic_id, term_id))
    await jobs.enqueue(INDEX_GLOSSARY_JOB, topic_id=topic_id)
    return Response(status_code=204)


@router.get("/literature", response_model=list[LiteratureOut])
async def list_literature(
    topic_id: DbIdPath, user: StaffUser, db: DbSession
) -> list[LiteratureItem]:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return await topic_items.list_literature(db, topic_id)


@router.post("/literature", response_model=LiteratureOut, status_code=201)
async def add_literature(
    topic_id: DbIdPath, data: LiteratureIn, user: StaffUser, db: DbSession
) -> LiteratureItem:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return await topic_items.add_literature(db, topic_id, data)


@router.patch("/literature/{item_id}", response_model=LiteratureOut)
async def update_literature(
    topic_id: DbIdPath, item_id: DbIdPath, data: LiteratureUpdate, user: StaffUser, db: DbSession
) -> LiteratureItem:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    item = await topic_items.get_literature_item(db, topic_id, item_id)
    return await topic_items.update_literature_item(db, item, data)


@router.delete("/literature/{item_id}", status_code=204)
async def delete_literature(
    topic_id: DbIdPath, item_id: DbIdPath, user: StaffUser, db: DbSession
) -> Response:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    await topic_items.delete_item(db, await topic_items.get_literature_item(db, topic_id, item_id))
    return Response(status_code=204)
