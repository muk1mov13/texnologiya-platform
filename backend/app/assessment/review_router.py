from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.assessment import reports, review
from app.assessment.models import SubmissionStatus
from app.assessment.schemas import (
    GradeIn,
    ReturnIn,
    SubmissionDetailOut,
    SubmissionQueueItem,
    TeachSummaryOut,
    TopicStatsOut,
)
from app.auth.deps import StaffUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.errors import AppError
from app.core.files import file_response
from app.core.types import DB_ID_MAX, DbIdPath

router = APIRouter(prefix="/teach", tags=["teach"])


@router.get("/submissions", response_model=list[SubmissionQueueItem])
async def list_submissions(
    user: StaffUser,
    db: DbSession,
    status: SubmissionStatus = SubmissionStatus.submitted,
    subject_id: Annotated[int | None, Query(ge=1, le=DB_ID_MAX)] = None,
    limit: Annotated[int, Query(ge=1, le=review.QUEUE_LIMIT)] = 50,
    offset: Annotated[int, Query(ge=0, le=DB_ID_MAX)] = 0,
) -> list[SubmissionQueueItem]:
    return await review.list_queue(db, user, status, subject_id, limit=limit, offset=offset)


@router.get("/submissions/{submission_id}", response_model=SubmissionDetailOut)
async def get_submission(
    submission_id: DbIdPath, user: StaffUser, db: DbSession
) -> SubmissionDetailOut:
    return await review.submission_detail(db, user, submission_id)


@router.get("/submissions/{submission_id}/file", response_class=Response)
async def submission_file(
    submission_id: DbIdPath,
    user: StaffUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Response:
    submission = (await review.get_reviewable(db, user, submission_id))[0]
    if not submission.file:
        raise AppError(404, "SUBMISSION_NOT_FOUND", "Javob topilmadi")
    return file_response(settings, storage, submission.file, submission.original_name or "javob")


@router.post("/submissions/{submission_id}/grade", response_model=SubmissionDetailOut)
async def grade_submission(
    submission_id: DbIdPath, data: GradeIn, user: StaffUser, db: DbSession
) -> SubmissionDetailOut:
    return await review.grade(db, user, submission_id, data)


@router.post("/submissions/{submission_id}/return", response_model=SubmissionDetailOut)
async def return_submission(
    submission_id: DbIdPath, data: ReturnIn, user: StaffUser, db: DbSession
) -> SubmissionDetailOut:
    return await review.return_submission(db, user, submission_id, data.feedback)


@router.get("/summary", response_model=TeachSummaryOut)
async def teach_summary(user: StaffUser, db: DbSession) -> TeachSummaryOut:
    return TeachSummaryOut(pending_submissions=await review.pending_count(db, user))


@router.get("/stats", response_model=list[TopicStatsOut])
async def teach_stats(
    subject_id: Annotated[int, Query(ge=1, le=DB_ID_MAX)], user: StaffUser, db: DbSession
) -> list[TopicStatsOut]:
    return await reports.teach_stats(db, user, subject_id)
