from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import ACTIVITY_STEP_KINDS, Activity, Task
from app.learning.models import (
    FILE_STEP_KINDS,
    GlossaryTerm,
    LiteratureItem,
    Material,
    MaterialStatus,
    ProgressStatus,
    Step,
    StepKind,
    StepProgress,
)


@dataclass(frozen=True)
class StepInfo:
    id: int
    topic_id: int
    kind: StepKind
    order: int
    has_content: bool


async def load_step_infos(db: AsyncSession, topic_ids: Sequence[int]) -> dict[int, list[StepInfo]]:
    """Har bir mavzu uchun bosqichlar ro'yxati (tartib bo'yicha) va ularda kontent bor-yo'qligi."""
    result: dict[int, list[StepInfo]] = {topic_id: [] for topic_id in topic_ids}
    if not topic_ids:
        return result
    steps = (
        await db.execute(
            select(Step.id, Step.topic_id, Step.kind, Step.order)
            .where(Step.topic_id.in_(topic_ids))
            .order_by(Step.topic_id, Step.order)
        )
    ).all()
    step_ids = [row.id for row in steps]
    ready_steps = set(
        await db.scalars(
            select(Material.step_id)
            .where(Material.step_id.in_(step_ids), Material.status == MaterialStatus.ready)
            .distinct()
        )
    )
    glossary_topics = set(
        await db.scalars(
            select(GlossaryTerm.topic_id).where(GlossaryTerm.topic_id.in_(topic_ids)).distinct()
        )
    )
    literature_topics = set(
        await db.scalars(
            select(LiteratureItem.topic_id).where(LiteratureItem.topic_id.in_(topic_ids)).distinct()
        )
    )
    activity_steps = set(
        await db.scalars(
            select(Activity.step_id)
            .where(Activity.step_id.in_(step_ids), Activity.is_published.is_(True))
            .distinct()
        )
    )
    task_steps = set(await db.scalars(select(Task.step_id).where(Task.step_id.in_(step_ids))))
    for row in steps:
        kind = StepKind(row.kind)
        if kind in FILE_STEP_KINDS:
            has_content = row.id in ready_steps
        elif kind == StepKind.glossary:
            has_content = row.topic_id in glossary_topics
        elif kind == StepKind.literature:
            has_content = row.topic_id in literature_topics
        elif kind in ACTIVITY_STEP_KINDS:
            has_content = row.id in activity_steps
        else:  # StepKind.task
            has_content = row.id in task_steps
        result[row.topic_id].append(StepInfo(row.id, row.topic_id, kind, row.order, has_content))
    return result


async def load_progress(
    db: AsyncSession, user_id: int, step_ids: Sequence[int]
) -> dict[int, ProgressStatus]:
    if not step_ids:
        return {}
    rows = await db.execute(
        select(StepProgress.step_id, StepProgress.status).where(
            StepProgress.user_id == user_id, StepProgress.step_id.in_(step_ids)
        )
    )
    return {row.step_id: ProgressStatus(row.status) for row in rows}


def count_progress(
    infos: Sequence[StepInfo], progress: dict[int, ProgressStatus]
) -> tuple[int, int]:
    """(tugatilgan, jami) — faqat kontenti bor bosqichlar hisobga olinadi."""
    with_content = [info for info in infos if info.has_content]
    completed = sum(1 for info in with_content if progress.get(info.id) == ProgressStatus.completed)
    return completed, len(with_content)


def all_step_ids(infos: dict[int, list[StepInfo]]) -> list[int]:
    return [info.id for topic_infos in infos.values() for info in topic_infos]
