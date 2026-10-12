from typing import Annotated

from fastapi import APIRouter, Form, Response, UploadFile

from app.assessment import attempts, tasks
from app.assessment.schemas import AttemptIn, AttemptOut, SubmitOut
from app.auth.deps import ActiveUser
from app.core.deps import AppSettings, AppStorage, DbSession
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
    text: Annotated[str | None, Form(max_length=20000)] = None,
    file: UploadFile | None = None,
) -> SubmitOut:
    return await tasks.submit(
        db, user, task_id, text=text, upload=file, storage=storage, settings=settings
    )


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
