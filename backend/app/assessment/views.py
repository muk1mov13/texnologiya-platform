"""Talaba uchun bosqich ko'rinishi: faoliyatlar (to'g'ri javobsiz), vazifa va talabaning javobi."""

from collections.abc import Sequence
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.items import load_items
from app.assessment.models import (
    Activity,
    ActivityType,
    Attempt,
    QuizQuestion,
    Submission,
    Task,
    YesNoItem,
)
from app.assessment.options import option_order
from app.assessment.view_schemas import (
    ActivityView,
    QuizItemView,
    StudentLayout,
    StudentLayoutWord,
    SubmissionView,
    TaskView,
    YesNoItemView,
)

# Urinish foizi (0–100). Ikkala bazada ham haqiqiy son bo'lib hisoblanadi.
ATTEMPT_PERCENT = Attempt.score * 100.0 / Attempt.max_score


def is_late(submitted_at: datetime, deadline: datetime | None) -> bool:
    return deadline is not None and submitted_at > deadline


async def attempt_stats(
    db: AsyncSession, user_id: int, activity_ids: Sequence[int]
) -> dict[int, tuple[float, int]]:
    """Faoliyat bo'yicha (eng yaxshi foiz, urinishlar soni)."""
    if not activity_ids:
        return {}
    rows = await db.execute(
        select(
            Attempt.activity_id,
            func.max(ATTEMPT_PERCENT).label("best"),
            func.count().label("n"),
        )
        .where(Attempt.user_id == user_id, Attempt.activity_id.in_(activity_ids))
        .group_by(Attempt.activity_id)
    )
    return {row.activity_id: (round(float(row.best), 2), int(row.n)) for row in rows}


def student_layout(layout: dict[str, Any], clues: dict[int, str]) -> StudentLayout:
    return StudentLayout(
        rows=layout["rows"],
        cols=layout["cols"],
        words=[
            StudentLayoutWord(
                number=word["number"],
                row=word["row"],
                col=word["col"],
                direction=word["direction"],
                length=word["length"],
                clue=clues[word["word_id"]],
            )
            for word in layout["words"]
        ],
    )


async def activity_views(db: AsyncSession, user_id: int, step_id: int) -> list[ActivityView]:
    activities = list(
        await db.scalars(
            select(Activity)
            .where(Activity.step_id == step_id, Activity.is_published.is_(True))
            .order_by(Activity.order, Activity.id)
        )
    )
    if not activities:
        return []
    stats = await attempt_stats(db, user_id, [a.id for a in activities])
    items = await load_items(db, activities)
    views: list[ActivityView] = []
    for activity in activities:
        best, count = stats.get(activity.id, (None, 0))
        item_views: list[QuizItemView | YesNoItemView] = []
        clues: dict[int, str] = {}
        for item in items[activity.id]:
            if isinstance(item, QuizQuestion):
                order = option_order(user_id, item.id, len(item.options))
                options = [item.options[index] for index in order]
                item_views.append(QuizItemView(text=item.text, options=options))
            elif isinstance(item, YesNoItem):
                item_views.append(YesNoItemView(statement=item.statement))
            else:
                clues[item.id] = item.clue
        layout = (
            student_layout(activity.layout, clues)
            if activity.type == ActivityType.crossword and activity.layout
            else None
        )
        views.append(
            ActivityView(
                id=activity.id,
                type=activity.type,
                title=activity.title,
                items=item_views,
                layout=layout,
                best_percent=best,
                attempts_count=count,
            )
        )
    return views


def submission_view(submission: Submission, task: Task) -> SubmissionView:
    return SubmissionView(
        id=submission.id,
        status=submission.status,
        text=submission.text,
        original_name=submission.original_name,
        file_url=f"/api/submissions/{submission.id}/file" if submission.file else None,
        score=submission.score,
        feedback=submission.feedback,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at,
        is_late=is_late(submission.submitted_at, task.deadline),
    )


async def task_view(
    db: AsyncSession, user_id: int, step_id: int
) -> tuple[TaskView | None, SubmissionView | None]:
    task = await db.scalar(select(Task).where(Task.step_id == step_id))
    if task is None:
        return None, None
    submission = await db.scalar(
        select(Submission).where(Submission.task_id == task.id, Submission.user_id == user_id)
    )
    return (
        TaskView.model_validate(task),
        submission_view(submission, task) if submission is not None else None,
    )
