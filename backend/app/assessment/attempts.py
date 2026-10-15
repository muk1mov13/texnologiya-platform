from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment import crossword
from app.assessment.items import ActivityItem, load_items
from app.assessment.models import (
    Activity,
    ActivityType,
    Attempt,
    CrosswordWord,
    QuizQuestion,
    YesNoItem,
)
from app.assessment.options import option_order
from app.assessment.schemas import AttemptIn, AttemptOut, ResultItem
from app.assessment.views import attempt_stats
from app.auth.models import User
from app.core.errors import AppError
from app.core.types import utcnow
from app.gamification import rules
from app.gamification.rules import XpReason
from app.gamification.service import Rewards, rewards_out
from app.learning import progress
from app.learning.models import ProgressStatus, Step, Topic
from app.learning.student_schemas import StepBrief

Answer = int | bool | str | None


def _invalid() -> AppError:
    return AppError(422, "ATTEMPT_INVALID_ANSWERS", "Javoblar faoliyat savollariga mos emas")


def _not_found() -> AppError:
    return AppError(404, "ACTIVITY_NOT_FOUND", "Faoliyat topilmadi")


async def get_attemptable_activity(
    db: AsyncSession, user: User, activity_id: int
) -> tuple[Activity, Step, Topic]:
    """Nashr qilingan, talabaga ko'rinadigan mavzudagi faoliyat. Aks holda 404 (borligi oshkor
    qilinmaydi)."""
    activity = await db.get(Activity, activity_id)
    if activity is None or not activity.is_published:
        raise _not_found()
    step = await db.get(Step, activity.step_id)
    if step is None:
        raise _not_found()
    topic = await progress.visible_topic_or(db, user, step.topic_id, _not_found())
    return activity, step, topic


def _grade_crossword(
    activity: Activity, items: list[ActivityItem], answers: list[Answer]
) -> list[dict[str, Any]]:
    words = {item.id: item for item in items if isinstance(item, CrosswordWord)}
    placed: list[dict[str, Any]] = (activity.layout or {}).get("words", [])
    if len(answers) != len(placed):
        raise _invalid()
    result = []
    for entry, answer in zip(placed, answers, strict=True):
        if answer is not None and not isinstance(answer, str):
            raise _invalid()
        word = words[entry["word_id"]]
        given = answer or ""
        result.append(
            {
                "prompt": word.clue,
                "options": None,
                "given": given,
                "correct": word.word,
                "is_correct": crossword.word_matches(given, entry["cells"]),
                "explanation": None,
            }
        )
    return result


def grade(
    activity: Activity, items: list[ActivityItem], answers: list[Answer], user_id: int
) -> list[dict[str, Any]]:
    """Har element bo'yicha natija (urinish ichida nusxa sifatida saqlanadi). Test javobi —
    talabaga ko'rsatilgan (aralashtirilgan) tartibdagi indeks; natija ham shu tartibda."""
    if activity.type == ActivityType.crossword:
        return _grade_crossword(activity, items, answers)
    if len(answers) != len(items):
        raise _invalid()
    result: list[dict[str, Any]] = []
    for item, answer in zip(items, answers, strict=True):
        if isinstance(item, QuizQuestion):
            order = option_order(user_id, item.id, len(item.options))
            if answer is not None and (
                isinstance(answer, bool)
                or not isinstance(answer, int)
                or not 0 <= answer < len(order)
            ):
                raise _invalid()
            correct = order.index(item.correct_index)
            result.append(
                {
                    "prompt": item.text,
                    "options": [item.options[index] for index in order],
                    "given": answer,
                    "correct": correct,
                    "is_correct": answer is not None and answer == correct,
                    "explanation": item.explanation,
                }
            )
        elif isinstance(item, YesNoItem):
            if answer is not None and not isinstance(answer, bool):
                raise _invalid()
            result.append(
                {
                    "prompt": item.statement,
                    "options": None,
                    "given": answer,
                    "correct": item.answer,
                    "is_correct": answer is not None and answer == item.answer,
                    "explanation": item.explanation,
                }
            )
    return result


async def refresh_activity_step(
    db: AsyncSession, user: User, step: Step, topic: Topic
) -> tuple[StepBrief, Rewards]:
    """`best_score`ni qayta hisoblaydi; nashr qilingan har faoliyatda urinish bo'lsa, bosqichni
    tugatadi va mavzu tugaganini tekshiradi."""
    now = utcnow()
    published = list(
        await db.scalars(
            select(Activity.id).where(Activity.step_id == step.id, Activity.is_published.is_(True))
        )
    )
    stats = await attempt_stats(db, user.id, published)
    best = {activity_id: percent for activity_id, (percent, _count) in stats.items()}
    row = await progress.get_or_create_progress(db, user.id, step.id)
    row.best_score = round(sum(best.values()) / len(best), 2) if best else None
    row.updated_at = now
    rewards = Rewards()
    if row.status != ProgressStatus.completed and published and all(a in best for a in published):
        rewards = await progress.mark_step_completed(db, user, row, topic.id, now)
    brief = StepBrief(
        id=step.id,
        kind=step.kind,
        order=step.order,
        has_content=bool(published),
        status=row.status,
    )
    return brief, rewards


async def submit_attempt(
    db: AsyncSession, user: User, activity_id: int, data: AttemptIn
) -> AttemptOut:
    activity, step, topic = await get_attemptable_activity(db, user, activity_id)
    items = (await load_items(db, [activity]))[activity.id]
    result = grade(activity, items, data.answers, user.id)
    score = sum(1 for entry in result if entry["is_correct"])
    max_score = len(result)
    now = utcnow()
    attempt = Attempt(
        activity_id=activity.id,
        user_id=user.id,
        score=score,
        max_score=max_score,
        result=result,
        created_at=now,
    )
    db.add(attempt)
    await db.flush()
    rewards = await progress.reward(
        db,
        user,
        XpReason.activity_completed,
        ref_type="activity",
        ref_id=activity.id,
        amount=rules.activity_xp(score, max_score),
        now=now,
    )
    if score == max_score:
        rewards += await progress.reward(
            db,
            user,
            XpReason.activity_perfect,
            ref_type="activity",
            ref_id=activity.id,
            amount=rules.ACTIVITY_PERFECT_XP,
            now=now,
        )
    brief, step_rewards = await refresh_activity_step(db, user, step, topic)
    rewards += step_rewards
    await db.commit()
    return AttemptOut(
        attempt_id=attempt.id,
        activity_id=activity.id,
        score=score,
        max_score=max_score,
        result=[ResultItem.model_validate(entry) for entry in result],
        rewards=rewards_out(rewards),
        step=brief,
    )
