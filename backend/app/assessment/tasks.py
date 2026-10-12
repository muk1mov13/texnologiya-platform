from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment import views
from app.assessment.models import Submission, SubmissionStatus, Task, TaskType
from app.assessment.schemas import SubmitOut, TaskIn
from app.auth.models import User
from app.core.config import Settings
from app.core.errors import AppError
from app.core.files import signature_matches
from app.core.storage import Storage
from app.core.types import utcnow
from app.gamification import rules
from app.gamification.rules import XpReason
from app.gamification.service import rewards_out
from app.learning import editing, progress
from app.learning.models import ProgressStatus, Step, StepKind, Topic
from app.learning.student_schemas import StepBrief

ALLOWED_SUBMISSION_EXT = frozenset(
    {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png"}
)


def _task_not_found() -> AppError:
    return AppError(404, "TASK_NOT_FOUND", "Vazifa topilmadi")


# --- o'qituvchi -----------------------------------------------------------------------------


async def task_step(db: AsyncSession, user: User, step_id: int) -> Step:
    step, _topic = await editing.ensure_can_edit_step(db, user, step_id)
    if step.kind != StepKind.task:
        raise AppError(400, "TASK_WRONG_STEP", "Vazifa faqat vazifa bosqichiga qo'shiladi")
    return step


async def get_step_task(db: AsyncSession, step_id: int) -> Task | None:
    return await db.scalar(select(Task).where(Task.step_id == step_id))


async def upsert_task(db: AsyncSession, step: Step, data: TaskIn) -> Task:
    task = await get_step_task(db, step.id)
    if task is None:
        candidate = Task(
            step_id=step.id,
            title=data.title,
            description=data.description,
            type=data.type,
            max_score=data.max_score,
        )
        try:
            async with db.begin_nested():
                db.add(candidate)
                await db.flush()
            task = candidate
        except IntegrityError:
            # Parallel so'rov vazifani shu orada yaratgan: uni yangilaymiz (500 o'rniga).
            task = await get_step_task(db, step.id)
            if task is None:
                raise
    top_score = await db.scalar(
        select(func.max(Submission.score)).where(
            Submission.task_id == task.id, Submission.status == SubmissionStatus.graded
        )
    )
    if top_score is not None and data.max_score < top_score:
        raise AppError(
            409,
            "MAX_SCORE_BELOW_GRADED",
            "Maksimal ball baholangan javoblardagi baldan kam bo'lishi mumkin emas",
            {"max_graded_score": top_score},
        )
    task.title = data.title
    task.description = data.description
    task.type = data.type
    task.max_score = data.max_score
    task.rubric = (data.rubric or "").strip() or None
    task.deadline = data.deadline
    await db.commit()
    return task


async def ensure_can_edit_task(db: AsyncSession, user: User, task_id: int) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise _task_not_found()
    await editing.ensure_can_edit_step(db, user, task.step_id)
    return task


async def delete_task(db: AsyncSession, task: Task) -> list[str]:
    """Vazifani javoblari bilan o'chiradi va diskdan o'chiriladigan fayllarni qaytaradi."""
    paths = [
        path
        for path in await db.scalars(
            select(Submission.file).where(
                Submission.task_id == task.id, Submission.file.is_not(None)
            )
        )
        if path
    ]
    await db.delete(task)
    await db.commit()
    return paths


# --- talaba ---------------------------------------------------------------------------------


async def _find_submission(db: AsyncSession, task_id: int, user_id: int) -> Submission | None:
    return await db.scalar(
        select(Submission).where(Submission.task_id == task_id, Submission.user_id == user_id)
    )


def _ensure_editable(submission: Submission) -> None:
    if submission.status == SubmissionStatus.graded:
        raise AppError(409, "SUBMISSION_GRADED", "Baholangan javobni o'zgartirib bo'lmaydi")


async def get_submittable_task(
    db: AsyncSession, user: User, task_id: int
) -> tuple[Task, Step, Topic]:
    task = await db.get(Task, task_id)
    if task is None:
        raise _task_not_found()
    step = await db.get(Step, task.step_id)
    if step is None:
        raise _task_not_found()
    topic = await progress.visible_topic_or(db, user, step.topic_id, _task_not_found())
    return task, step, topic


def _check_fields(task: Task, text: str | None, has_file: bool, existing_file: bool) -> None:
    if task.type == TaskType.text and has_file:
        raise AppError(
            422, "SUBMISSION_FIELD_NOT_ALLOWED", "Bu vazifaga fayl yuklanmaydi", {"field": "file"}
        )
    if task.type == TaskType.file and text:
        raise AppError(
            422, "SUBMISSION_FIELD_NOT_ALLOWED", "Bu vazifaga matn yozilmaydi", {"field": "text"}
        )
    any_file = has_file or existing_file
    missing = (
        (task.type == TaskType.text and not text)
        or (task.type == TaskType.file and not any_file)
        or (task.type == TaskType.both and not text and not any_file)
    )
    if missing:
        raise AppError(422, "SUBMISSION_EMPTY", "Javob bo'sh")


async def submit(
    db: AsyncSession,
    user: User,
    task_id: int,
    *,
    text: str | None,
    upload: UploadFile | None,
    storage: Storage,
    settings: Settings,
) -> SubmitOut:
    task, step, topic = await get_submittable_task(db, user, task_id)
    clean_text = (text or "").strip() or None
    has_file = upload is not None and bool(upload.filename)
    submission = await _find_submission(db, task.id, user.id)
    if submission is not None:
        _ensure_editable(submission)
    _check_fields(task, clean_text, has_file, existing_file=bool(submission and submission.file))

    new_file: str | None = None
    original_name: str | None = None
    if upload is not None and has_file:
        new_file, original_name = await storage.save_upload(
            upload,
            "submissions",
            allowed_ext=ALLOWED_SUBMISSION_EXT,
            max_bytes=settings.max_submission_mb * 1024 * 1024,
        )
        if not signature_matches(storage.path(new_file), Path(new_file).suffix.lower()):
            storage.delete(new_file)
            raise AppError(
                400, "UNSUPPORTED_FILE_TYPE", "Fayl mazmuni e'lon qilingan turga mos emas"
            )

    now = utcnow()
    old_file: str | None = None
    try:
        if submission is None:
            candidate = Submission(
                task_id=task.id,
                user_id=user.id,
                status=SubmissionStatus.submitted,
                submitted_at=now,
            )
            try:
                async with db.begin_nested():
                    db.add(candidate)
                    await db.flush()
                submission = candidate
            except IntegrityError:
                # Parallel so'rov (masalan, tugma ikki marta bosilgan) javobni shu orada
                # yaratgan: 500 o'rniga uni tahrir sifatida davom ettiramiz.
                submission = await _find_submission(db, task.id, user.id)
                if submission is None:
                    raise
                _ensure_editable(submission)
        submission.status = SubmissionStatus.submitted
        submission.submitted_at = now
        submission.text = clean_text
        if new_file is not None:
            old_file = submission.file
            submission.file = new_file
            submission.original_name = original_name
        await db.flush()
        rewards = await progress.reward(
            db,
            user,
            XpReason.task_submitted,
            ref_type="task",
            ref_id=task.id,
            amount=rules.TASK_SUBMITTED_XP,
            now=now,
        )
        row = await progress.get_or_create_progress(db, user.id, step.id)
        rewards += await progress.mark_step_completed(db, user, row, topic.id, now)
        await db.commit()
    except BaseException:
        storage.delete(new_file)
        raise
    storage.delete_quietly([old_file])
    return SubmitOut(
        submission=views.submission_view(submission, task),
        rewards=rewards_out(rewards),
        step=StepBrief(
            id=step.id,
            kind=step.kind,
            order=step.order,
            has_content=True,
            status=ProgressStatus.completed,
        ),
    )


async def own_submission_file(db: AsyncSession, user: User, submission_id: int) -> tuple[str, str]:
    """(nisbiy yo'l, fayl nomi) — faqat javob egasi uchun."""
    submission = await db.get(Submission, submission_id)
    if submission is None or submission.user_id != user.id or not submission.file:
        raise AppError(404, "SUBMISSION_NOT_FOUND", "Javob topilmadi")
    return submission.file, submission.original_name or Path(submission.file).name
