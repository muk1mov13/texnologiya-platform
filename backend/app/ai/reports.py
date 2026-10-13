"""Haftalik AI tahlili: raqamlar SQL bilan hisoblanadi, LLM faqat xulosa va tavsiyalar yozadi."""

import json
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models import AiReport
from app.ai.providers import ChatMessage
from app.ai.services import AiServices, build_ai
from app.ai.usage import TASHKENT, today
from app.assessment.models import Activity, Attempt, Submission, SubmissionStatus, Task
from app.assessment.reports import topic_stats
from app.auth.models import Role, User
from app.core.config import Settings
from app.core.db import make_engine, make_sessionmaker
from app.gamification.models import XpEvent
from app.learning.models import Step, StepProgress, Subject, Topic, subject_teachers

PROMPT = {
    "uz": "Sen o'qituvchiga yordamchisan. Faqat berilgan statistika (JSON) asosida o'zbek tilida "
    "3–5 gaplik xulosa va 3 ta aniq tavsiya yoz. Raqamlarni o'zing hisoblama va o'ylab topma.",
    "ru": "Ты помощник преподавателя. Только на основе данной статистики (JSON) напиши на русском "
    "вывод из 3–5 предложений и 3 конкретные рекомендации. Не вычисляй и не придумывай числа.",
}
EMPTY = {
    "uz": "Bu hafta fan bo'yicha talabalar faolligi qayd etilmadi.",
    "ru": "На этой неделе активность студентов по предмету не зафиксирована.",
}


def week_bounds(week_start: date | None) -> tuple[date, date]:
    """Sukut: Tashkent bo'yicha o'tgan to'liq hafta (dushanba–yakshanba)."""
    if week_start is None:
        current = today()
        week_start = current - timedelta(days=current.weekday() + 7)
    if week_start.weekday() != 0:
        raise ValueError("--week-start dushanba bo'lishi kerak")
    return week_start, week_start + timedelta(days=6)


def _utc_range(start: date, end: date) -> tuple[datetime, datetime]:
    return (
        datetime.combine(start, time.min, TASHKENT),
        datetime.combine(end + timedelta(days=1), time.min, TASHKENT),
    )


async def subject_week_stats(
    db: AsyncSession, subject_id: int, start: date, end: date
) -> dict[str, Any]:
    lo, hi = _utc_range(start, end)
    attempts = list(
        await db.scalars(
            select(Attempt)
            .join(Activity, Activity.id == Attempt.activity_id)
            .join(Step, Step.id == Activity.step_id)
            .join(Topic, Topic.id == Step.topic_id)
            .join(User, User.id == Attempt.user_id)
            .where(
                Topic.subject_id == subject_id,
                User.role == Role.student,
                Attempt.created_at >= lo,
                Attempt.created_at < hi,
            )
        )
    )
    per_item: dict[str, list[bool]] = defaultdict(list)
    for attempt in attempts:
        for item in attempt.result:
            per_item[str(item.get("prompt", ""))].append(bool(item.get("is_correct")))
    scored = sorted(
        (round(100 * sum(v) / len(v)), len(v), prompt)
        for prompt, v in per_item.items()
        if len(v) >= 3
    )[:5]
    hardest = [
        {"prompt": prompt[:200], "correct_percent": percent, "answers": answers}
        for percent, answers, prompt in scored
    ]
    subs = (
        select(func.count())
        .select_from(Submission)
        .join(Task, Task.id == Submission.task_id)
        .join(Step, Step.id == Task.step_id)
        .join(Topic, Topic.id == Step.topic_id)
        .where(Topic.subject_id == subject_id)
    )
    submitted = await db.scalar(
        subs.where(Submission.submitted_at >= lo, Submission.submitted_at < hi)
    )
    graded = await db.scalar(
        subs.where(
            Submission.status == SubmissionStatus.graded,
            Submission.graded_at >= lo,
            Submission.graded_at < hi,
        )
    )
    learners = (
        select(StepProgress.user_id)
        .join(Step, Step.id == StepProgress.step_id)
        .join(Topic, Topic.id == Step.topic_id)
        .where(Topic.subject_id == subject_id)
        .distinct()
    )
    active = select(XpEvent.user_id).where(XpEvent.created_at >= hi - timedelta(days=7))
    inactive = await db.scalar(
        select(func.count()).select_from(
            learners.where(StepProgress.user_id.not_in(active)).subquery()
        )
    )
    return {
        "period": [start.isoformat(), end.isoformat()],
        "topics": [t.model_dump() for t in await topic_stats(db, subject_id)],
        "attempts": len(attempts),
        "hardest": hardest,
        "submitted": int(submitted or 0),
        "graded": int(graded or 0),
        "inactive_students": int(inactive or 0),
    }


async def _write_reports(
    db: AsyncSession,
    ai: AiServices,
    subject_id: int,
    start: date,
    end: date,
    stats: dict[str, Any],
) -> int:
    """Fanga biriktirilgan o'qituvchilarning har tili uchun bitta hisobot (upsert)."""
    locales = {
        loc.value
        for loc in await db.scalars(
            select(User.locale)
            .join(subject_teachers, subject_teachers.c.user_id == User.id)
            .where(subject_teachers.c.subject_id == subject_id)
        )
    } or {"uz"}
    quiet = stats["attempts"] == 0 and stats["submitted"] == 0
    for locale in sorted(locales):
        if quiet:
            content = EMPTY.get(locale, EMPTY["uz"])
        else:
            data = ChatMessage("user", json.dumps(stats, ensure_ascii=False))
            content = await ai.llm.generate(ai.fast_model, PROMPT.get(locale, PROMPT["uz"]), [data])
        report = await db.scalar(
            select(AiReport).where(
                AiReport.subject_id == subject_id,
                AiReport.locale == locale,
                AiReport.period_start == start,
            )
        )
        if report is None:
            db.add(
                AiReport(
                    subject_id=subject_id,
                    locale=locale,
                    period_start=start,
                    period_end=end,
                    stats=stats,
                    content=content,
                )
            )
        else:
            report.stats, report.content, report.period_end = stats, content, end
    await db.commit()
    return len(locales)


async def weekly_report(
    settings: Settings, week_start: date | None = None, subject_id: int | None = None
) -> int:
    """CLI va (4-bosqichda) arq cron uchun. Yaratilgan/yangilangan hisobotlar sonini qaytaradi."""
    if not settings.ai_configured:
        raise ValueError("AI sozlanmagan (GEMINI_API_KEY yoki AI_PROVIDER=fake kerak)")
    start, end = week_bounds(week_start)
    engine = make_engine(settings.database_url)
    ai = build_ai(settings, engine.dialect.name)
    count = 0
    try:
        async with make_sessionmaker(engine)() as db:
            stmt = select(Subject.id).where(Subject.is_published.is_(True))
            if subject_id is not None:
                stmt = select(Subject.id).where(Subject.id == subject_id)
            for sid in list(await db.scalars(stmt)):
                stats = await subject_week_stats(db, sid, start, end)
                count += await _write_reports(db, ai, sid, start, end, stats)
    finally:
        await engine.dispose()
    return count
