from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.errors import AppError
from app.learning import progress
from app.learning.content import all_step_ids, load_progress, load_step_infos
from app.learning.models import Material, MaterialStatus, ProgressStatus, Step, StepProgress
from app.learning.student_schemas import ContinueOut, SubjectProgressOut


async def continue_target(db: AsyncSession, user: User) -> ContinueOut | None:
    """Oxirgi ochilgan mavzudan boshlab birinchi tugatilmagan, kontentli bosqichni topadi.
    Oxiriga yetsa boshidan aylanib qidiradi. Hammasi tugagan bo'lsa None qaytaradi."""
    subjects = await progress.published_subjects(db)
    subject_by_id = {s.id: s for s in subjects}
    topics = await progress.published_topics(db, list(subject_by_id))
    if not topics:
        return None
    subject_rank = {s.id: index for index, s in enumerate(subjects)}
    topics.sort(key=lambda t: (subject_rank[t.subject_id], t.order, t.id))

    infos = await load_step_infos(db, [t.id for t in topics])
    step_ids = all_step_ids(infos)
    status = await load_progress(db, user.id, step_ids)
    last_step_id = await db.scalar(
        select(StepProgress.step_id)
        .where(StepProgress.user_id == user.id, StepProgress.step_id.in_(step_ids))
        .order_by(StepProgress.updated_at.desc(), StepProgress.id.desc())
        .limit(1)
    )
    start = 0
    if last_step_id is not None:
        start = next(
            index
            for index, topic in enumerate(topics)
            if any(info.id == last_step_id for info in infos[topic.id])
        )

    for topic in topics[start:] + topics[:start]:
        for info in infos[topic.id]:
            if info.has_content and status.get(info.id) != ProgressStatus.completed:
                subject = subject_by_id[topic.subject_id]
                return ContinueOut(
                    subject_id=subject.id,
                    subject_slug=subject.slug,
                    subject_title=subject.title,
                    topic_id=topic.id,
                    topic_title=topic.title,
                    step_id=info.id,
                    step_kind=info.kind,
                )
    return None


async def progress_summary(db: AsyncSession, user: User) -> list[SubjectProgressOut]:
    return [
        SubjectProgressOut(
            subject_id=card.id,
            subject_title=card.title,
            subject_slug=card.slug,
            progress=card.progress,
        )
        for card in await progress.list_subject_cards(db, user)
    ]


async def material_for_viewer(db: AsyncSession, user: User, material_id: int) -> Material:
    material = await db.get(Material, material_id)
    if material is None or material.status != MaterialStatus.ready or material.pdf_file is None:
        raise AppError(404, "MATERIAL_NOT_FOUND", "Material topilmadi")
    step = await db.get(Step, material.step_id)
    if step is None:
        raise AppError(404, "MATERIAL_NOT_FOUND", "Material topilmadi")
    await progress.get_visible_topic(db, user, step.topic_id)
    return material
