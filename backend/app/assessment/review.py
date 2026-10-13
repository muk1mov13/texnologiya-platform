from sqlalchemy import Row, Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Submission, SubmissionStatus, Task
from app.assessment.schemas import (
    AiFeedbackOut,
    GradeIn,
    SubmissionDetailOut,
    SubmissionQueueItem,
)
from app.assessment.views import is_late
from app.auth.models import Role, User
from app.core.errors import AppError
from app.core.types import utcnow
from app.gamification import rules
from app.gamification.rules import XpReason
from app.learning import progress
from app.learning.models import Step, Subject, Topic, subject_teachers

QUEUE_LIMIT = 200  # bitta sahifadagi eng ko'p javoblar soni

ReviewRow = tuple[Submission, Task, Topic, Subject, str]


def _base_query(user: User) -> Select[Submission, Task, Topic, Subject, str]:
    """Foydalanuvchi tekshira oladigan javoblar: admin — hammasi, o'qituvchi — biriktirilgan
    fanlar."""
    stmt = (
        select(Submission, Task, Topic, Subject, User.full_name)
        .join(Task, Submission.task_id == Task.id)
        .join(Step, Task.step_id == Step.id)
        .join(Topic, Step.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .join(User, Submission.user_id == User.id)
    )
    if user.role != Role.admin:
        stmt = stmt.join(subject_teachers, subject_teachers.c.subject_id == Subject.id).where(
            subject_teachers.c.user_id == user.id
        )
    return stmt


def _as_review_row(row: Row[Submission, Task, Topic, Subject, str]) -> ReviewRow:
    submission, task, topic, subject, student_name = row
    return submission, task, topic, subject, student_name


def _queue_item(row: ReviewRow) -> SubmissionQueueItem:
    submission, task, topic, subject, student_name = row
    return SubmissionQueueItem(
        id=submission.id,
        status=submission.status,
        student_name=student_name,
        subject_id=subject.id,
        subject_title=subject.title,
        topic_id=topic.id,
        topic_title=topic.title,
        task_id=task.id,
        task_title=task.title,
        submitted_at=submission.submitted_at,
        is_late=is_late(submission.submitted_at, task.deadline),
    )


def _detail(row: ReviewRow) -> SubmissionDetailOut:
    submission, task, *_ = row
    return SubmissionDetailOut(
        **_queue_item(row).model_dump(),
        task_description=task.description,
        rubric=task.rubric,
        max_score=task.max_score,
        text=submission.text,
        original_name=submission.original_name,
        file_url=f"/api/teach/submissions/{submission.id}/file" if submission.file else None,
        score=submission.score,
        feedback=submission.feedback,
        graded_at=submission.graded_at,
        ai_status=submission.ai_status,
        ai_score=submission.ai_score,
        ai_feedback=AiFeedbackOut.model_validate(submission.ai_feedback)
        if submission.ai_feedback
        else None,
    )


async def list_queue(
    db: AsyncSession,
    user: User,
    status: SubmissionStatus,
    subject_id: int | None,
    *,
    limit: int,
    offset: int,
) -> list[SubmissionQueueItem]:
    stmt = _base_query(user).where(Submission.status == status)
    if subject_id is not None:
        stmt = stmt.where(Subject.id == subject_id)
    stmt = stmt.order_by(Submission.submitted_at, Submission.id).limit(limit).offset(offset)
    return [_queue_item(_as_review_row(row)) for row in await db.execute(stmt)]


async def get_reviewable(db: AsyncSession, user: User, submission_id: int) -> ReviewRow:
    """Ruxsat bo'lmasa ham 404 qaytadi: javobning borligi oshkor qilinmaydi."""
    row = (await db.execute(_base_query(user).where(Submission.id == submission_id))).first()
    if row is None:
        raise AppError(404, "SUBMISSION_NOT_FOUND", "Javob topilmadi")
    return _as_review_row(row)


async def submission_detail(
    db: AsyncSession, user: User, submission_id: int
) -> SubmissionDetailOut:
    return _detail(await get_reviewable(db, user, submission_id))


def _ensure_submitted(submission: Submission) -> None:
    if submission.status != SubmissionStatus.submitted:
        raise AppError(
            409, "SUBMISSION_NOT_SUBMITTED", "Faqat tekshiruvdagi javob bilan ishlash mumkin"
        )


async def grade(
    db: AsyncSession, user: User, submission_id: int, data: GradeIn
) -> SubmissionDetailOut:
    row = await get_reviewable(db, user, submission_id)
    submission, task, *_ = row
    _ensure_submitted(submission)
    if not 0 <= data.score <= task.max_score:
        raise AppError(
            422,
            "SCORE_OUT_OF_RANGE",
            "Ball 0 va maksimal ball oralig'ida bo'lishi kerak",
            {"max_score": task.max_score},
        )
    now = utcnow()
    submission.status = SubmissionStatus.graded
    submission.score = data.score
    submission.feedback = (data.feedback or "").strip() or None
    submission.graded_by = user.id
    submission.graded_at = now
    author = await db.get(User, submission.user_id)
    if author is not None:
        await progress.reward(
            db,
            author,
            XpReason.task_graded,
            ref_type="submission",
            ref_id=submission.id,
            amount=rules.graded_xp(data.score, task.max_score),
            now=now,
        )
    await db.commit()
    return _detail(row)


async def return_submission(
    db: AsyncSession, user: User, submission_id: int, feedback: str
) -> SubmissionDetailOut:
    row = await get_reviewable(db, user, submission_id)
    submission = row[0]
    _ensure_submitted(submission)
    submission.status = SubmissionStatus.returned
    submission.feedback = feedback
    await db.commit()
    return _detail(row)


async def pending_count(db: AsyncSession, user: User) -> int:
    subquery = _base_query(user).where(Submission.status == SubmissionStatus.submitted).subquery()
    return int(await db.scalar(select(func.count()).select_from(subquery)) or 0)
