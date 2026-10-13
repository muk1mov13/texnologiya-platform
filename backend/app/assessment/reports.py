from collections import defaultdict
from statistics import mean

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Activity, Attempt, Submission, SubmissionStatus, Task
from app.assessment.schemas import (
    ActivityResultOut,
    AttemptDetailOut,
    ResultItem,
    SubjectResultsOut,
    TaskResultOut,
    TopicResultsOut,
    TopicStatsOut,
)
from app.assessment.views import ATTEMPT_PERCENT, is_late
from app.auth.models import Role, User
from app.core.errors import AppError
from app.learning import editing
from app.learning.content import load_step_infos
from app.learning.models import ProgressStatus, Step, StepProgress, Subject, Topic


async def my_results(db: AsyncSession, user: User) -> list[SubjectResultsOut]:
    """Talabaning urinishlari va javoblari, fan va mavzu bo'yicha guruhlangan."""
    stats = {
        row.activity_id: row
        for row in await db.execute(
            select(
                Attempt.activity_id,
                func.max(ATTEMPT_PERCENT).label("best"),
                func.count().label("n"),
                func.max(Attempt.id).label("last_id"),
                func.max(Attempt.created_at).label("last_at"),
            )
            .where(Attempt.user_id == user.id)
            .group_by(Attempt.activity_id)
        )
    }
    subjects: dict[int, Subject] = {}
    topics: dict[int, Topic] = {}
    activities_by_topic: dict[int, list[ActivityResultOut]] = defaultdict(list)
    tasks_by_topic: dict[int, list[TaskResultOut]] = defaultdict(list)

    if stats:
        activity_rows = await db.execute(
            select(Activity, Topic, Subject)
            .join(Step, Activity.step_id == Step.id)
            .join(Topic, Step.topic_id == Topic.id)
            .join(Subject, Topic.subject_id == Subject.id)
            .where(Activity.id.in_(list(stats)))
            .order_by(Step.order, Activity.order, Activity.id)
        )
        for activity, topic, subject in activity_rows:
            stat = stats[activity.id]
            subjects[subject.id] = subject
            topics[topic.id] = topic
            activities_by_topic[topic.id].append(
                ActivityResultOut(
                    activity_id=activity.id,
                    title=activity.title,
                    type=activity.type,
                    best_percent=round(float(stat.best), 2),
                    attempts_count=int(stat.n),
                    last_attempt_id=int(stat.last_id),
                    last_attempt_at=stat.last_at,
                )
            )

    submission_rows = await db.execute(
        select(Submission, Task, Topic, Subject)
        .join(Task, Submission.task_id == Task.id)
        .join(Step, Task.step_id == Step.id)
        .join(Topic, Step.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .where(Submission.user_id == user.id)
    )
    for submission, task, topic, subject in submission_rows:
        subjects[subject.id] = subject
        topics[topic.id] = topic
        tasks_by_topic[topic.id].append(
            TaskResultOut(
                task_id=task.id,
                title=task.title,
                status=submission.status,
                score=submission.score,
                max_score=task.max_score,
                feedback=submission.feedback,
                is_late=is_late(submission.submitted_at, task.deadline),
                submitted_at=submission.submitted_at,
            )
        )

    result = []
    for subject in sorted(subjects.values(), key=lambda s: (s.order, s.id)):
        subject_topics = sorted(
            (t for t in topics.values() if t.subject_id == subject.id),
            key=lambda t: (t.order, t.id),
        )
        result.append(
            SubjectResultsOut(
                subject_id=subject.id,
                subject_title=subject.title,
                subject_slug=subject.slug,
                topics=[
                    TopicResultsOut(
                        topic_id=t.id,
                        topic_title=t.title,
                        activities=activities_by_topic[t.id],
                        tasks=tasks_by_topic[t.id],
                    )
                    for t in subject_topics
                ],
            )
        )
    return result


async def attempt_detail(db: AsyncSession, user: User, attempt_id: int) -> AttemptDetailOut:
    row = (
        await db.execute(
            select(Attempt, Activity)
            .join(Activity, Attempt.activity_id == Activity.id)
            .where(Attempt.id == attempt_id, Attempt.user_id == user.id)
        )
    ).first()
    if row is None:
        raise AppError(404, "ATTEMPT_NOT_FOUND", "Urinish topilmadi")
    attempt, activity = row
    return AttemptDetailOut(
        id=attempt.id,
        activity_id=activity.id,
        activity_title=activity.title,
        activity_type=activity.type,
        score=attempt.score,
        max_score=attempt.max_score,
        result=[ResultItem.model_validate(entry) for entry in attempt.result],
        created_at=attempt.created_at,
    )


async def teach_stats(db: AsyncSession, user: User, subject_id: int) -> list[TopicStatsOut]:
    """Mavzular bo'yicha statistika (faqat talabalar hisobga olinadi)."""
    await editing.ensure_can_edit_subject(db, user, subject_id)
    topics = list(
        await db.scalars(
            select(Topic).where(Topic.subject_id == subject_id).order_by(Topic.order, Topic.id)
        )
    )
    if not topics:
        return []
    topic_ids = [t.id for t in topics]
    infos = await load_step_infos(db, topic_ids)
    step_topic = {info.id: tid for tid, topic_infos in infos.items() for info in topic_infos}
    content_steps = {
        tid: {info.id for info in topic_infos if info.has_content}
        for tid, topic_infos in infos.items()
    }

    started: dict[int, set[int]] = defaultdict(set)
    completed_steps: dict[tuple[int, int], set[int]] = defaultdict(set)
    progress_rows = await db.execute(
        select(StepProgress.user_id, StepProgress.step_id, StepProgress.status)
        .join(User, StepProgress.user_id == User.id)
        .where(StepProgress.step_id.in_(list(step_topic)), User.role == Role.student)
    )
    for row in progress_rows:
        tid = step_topic[row.step_id]
        started[tid].add(row.user_id)
        if row.status == ProgressStatus.completed:
            completed_steps[(tid, row.user_id)].add(row.step_id)

    bests: dict[int, list[float]] = defaultdict(list)
    best_rows = await db.execute(
        select(Step.topic_id, func.max(ATTEMPT_PERCENT).label("best"))
        .select_from(Attempt)
        .join(Activity, Attempt.activity_id == Activity.id)
        .join(Step, Activity.step_id == Step.id)
        .join(User, Attempt.user_id == User.id)
        .where(Step.topic_id.in_(topic_ids), User.role == Role.student)
        .group_by(Step.topic_id, Attempt.user_id, Attempt.activity_id)
    )
    for best_row in best_rows:
        bests[best_row.topic_id].append(float(best_row.best))

    pending = {
        row.topic_id: int(row.n)
        for row in await db.execute(
            select(Step.topic_id, func.count().label("n"))
            .select_from(Submission)
            .join(Task, Submission.task_id == Task.id)
            .join(Step, Task.step_id == Step.id)
            .where(Step.topic_id.in_(topic_ids), Submission.status == SubmissionStatus.submitted)
            .group_by(Step.topic_id)
        )
    }

    return [
        TopicStatsOut(
            topic_id=topic.id,
            topic_title=topic.title,
            started=len(started[topic.id]),
            completed=sum(
                1
                for uid in started[topic.id]
                if content_steps[topic.id]
                and content_steps[topic.id] <= completed_steps[(topic.id, uid)]
            ),
            avg_best_percent=round(mean(bests[topic.id]), 1) if bests[topic.id] else None,
            pending_submissions=pending.get(topic.id, 0),
        )
        for topic in topics
    ]
