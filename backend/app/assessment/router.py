from typing import Annotated

from fastapi import APIRouter, Form, Response, UploadFile

from app.ai import grading
from app.assessment import attempts, reports, tasks
from app.assessment.schemas import (
    AttemptDetailOut,
    AttemptIn,
    AttemptOut,
    SubjectResultsOut,
    SubmitOut,
)
from app.auth.deps import ActiveUser
from app.core.deps import Ai, AppSettings, AppStorage, DbSession, Jobs
from app.core.files import file_response
from app.core.types import DbIdPath

router = APIRouter(tags=["assessment"])


@router.post("/activities/{activity_id}/attempts", response_model=AttemptOut, status_code=201)
async def submit_attempt(
    activity_id: DbIdPath, data: AttemptIn, user: ActiveUser, db: DbSession
) -> AttemptOut:
    return await attempts.submit_attempt(db, user, activity_id, data)


@router.put("/tasks/{task_id}/submission", response_model=SubmitOut)
async def submit_task(
    task_id: DbIdPath,
    user: ActiveUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
    jobs: Jobs,
    ai: Ai,
    text: Annotated[str | None, Form(max_length=20000)] = None,
    file: UploadFile | None = None,
) -> SubmitOut:
    out = await tasks.submit(
        db, user, task_id, text=text, upload=file, storage=storage, settings=settings
    )
    await grading.queue_check(db, ai, jobs, out.submission.id)
    return out


@router.get("/submissions/{submission_id}/file", response_class=Response)
async def submission_file(
    submission_id: DbIdPath,
    user: ActiveUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Response:
    rel, filename = await tasks.own_submission_file(db, user, submission_id)
    return file_response(settings, storage, rel, filename)


@router.get("/me/results", response_model=list[SubjectResultsOut])
async def my_results(user: ActiveUser, db: DbSession) -> list[SubjectResultsOut]:
    return await reports.my_results(db, user)


@router.get("/me/attempts/{attempt_id}", response_model=AttemptDetailOut)
async def attempt_detail(attempt_id: DbIdPath, user: ActiveUser, db: DbSession) -> AttemptDetailOut:
    return await reports.attempt_detail(db, user, attempt_id)
