from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.ai import drafts, grading
from app.ai.models import AiDraft, AiReport
from app.ai.schemas import AiReportOut, DraftCreateIn, DraftOut, DraftUpdateIn
from app.ai.services import require_ai
from app.assessment import review
from app.auth.deps import StaffUser
from app.core.deps import Ai, DbSession, Jobs
from app.core.types import DB_ID_MAX, DbIdPath
from app.learning import editing

router = APIRouter(prefix="/teach", tags=["teach-ai"])

TopicQuery = Annotated[int, Query(ge=1, le=DB_ID_MAX)]


@router.post("/ai/drafts", response_model=DraftOut, status_code=201)
async def create_draft(
    data: DraftCreateIn, user: StaffUser, db: DbSession, ai: Ai, jobs: Jobs
) -> AiDraft:
    await require_ai(db, ai)
    return await drafts.create_draft(db, user, data, jobs)


@router.get("/ai/drafts", response_model=list[DraftOut])
async def list_drafts(topic_id: TopicQuery, user: StaffUser, db: DbSession) -> list[AiDraft]:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return list(
        await db.scalars(
            select(AiDraft)
            .where(AiDraft.topic_id == topic_id)
            .order_by(AiDraft.id.desc())
            .limit(50)
        )
    )


@router.get("/ai/drafts/{draft_id}", response_model=DraftOut)
async def get_draft(draft_id: DbIdPath, user: StaffUser, db: DbSession) -> AiDraft:
    return await drafts.get_editable_draft(db, user, draft_id)


@router.put("/ai/drafts/{draft_id}", response_model=DraftOut)
async def update_draft(
    draft_id: DbIdPath, data: DraftUpdateIn, user: StaffUser, db: DbSession
) -> AiDraft:
    draft = await drafts.get_editable_draft(db, user, draft_id)
    return await drafts.update_draft(db, draft, data.payload)


@router.post("/ai/drafts/{draft_id}/approve", response_model=DraftOut)
async def approve_draft(draft_id: DbIdPath, user: StaffUser, db: DbSession, jobs: Jobs) -> AiDraft:
    draft = await drafts.get_editable_draft(db, user, draft_id)
    return await drafts.approve_draft(db, draft, jobs)


@router.post("/ai/drafts/{draft_id}/reject", response_model=DraftOut)
async def reject_draft(draft_id: DbIdPath, user: StaffUser, db: DbSession) -> AiDraft:
    draft = await drafts.get_editable_draft(db, user, draft_id)
    return await drafts.reject_draft(db, draft)


@router.post("/submissions/{submission_id}/ai-check", status_code=202)
async def rerun_ai_check(
    submission_id: DbIdPath, user: StaffUser, db: DbSession, ai: Ai, jobs: Jobs
) -> dict[str, str]:
    await review.get_reviewable(db, user, submission_id)
    await require_ai(db, ai)
    await grading.queue_check(db, ai, jobs, submission_id)
    return {"ai_status": "pending"}


@router.get("/ai/reports", response_model=list[AiReportOut])
async def reports(subject_id: TopicQuery, user: StaffUser, db: DbSession) -> list[AiReport]:
    """O'qituvchi tilidagi oxirgi 4 ta haftalik tahlil."""
    await editing.ensure_can_edit_subject(db, user, subject_id)
    return list(
        await db.scalars(
            select(AiReport)
            .where(AiReport.subject_id == subject_id, AiReport.locale == user.locale.value)
            .order_by(AiReport.period_start.desc())
            .limit(4)
        )
    )
