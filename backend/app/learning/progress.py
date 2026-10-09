from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.errors import AppError
from app.core.types import utcnow
from app.learning import editing, topic_items
from app.learning.content import all_step_ids, count_progress, load_progress, load_step_infos
from app.learning.models import (
    FILE_STEP_KINDS,
    SELF_COMPLETE_STEP_KINDS,
    Material,
    MaterialStatus,
    ProgressStatus,
    StepKind,
    StepProgress,
    Subject,
    Topic,
)
from app.learning.schemas import GlossaryOut, LiteratureOut
from app.learning.student_schemas import (
    MaterialView,
    ProgressOut,
    StepBrief,
    StepContentOut,
    SubjectCard,
    SubjectDetailOut,
    SubjectRef,
    TopicCard,
    TopicDetailOut,
)


async def published_subjects(db: AsyncSession) -> list[Subject]:
    return list(
        await db.scalars(
            select(Subject)
            .where(Subject.is_published.is_(True))
            .order_by(Subject.order, Subject.id)
        )
    )


async def published_topics(db: AsyncSession, subject_ids: list[int]) -> list[Topic]:
    if not subject_ids:
        return []
    return list(
        await db.scalars(
            select(Topic)
            .where(Topic.subject_id.in_(subject_ids), Topic.is_published.is_(True))
            .order_by(Topic.order, Topic.id)
        )
    )


async def get_visible_topic(db: AsyncSession, user: User, topic_id: int) -> tuple[Topic, Subject]:
    """Mavzu talabaga ko'rinadi, agar mavzu ham, fan ham nashr qilingan bo'lsa.
    Fanga biriktirilgan o'qituvchi va admin esa nashr qilinmaganini ham ko'radi (preview)."""
    topic = await db.get(Topic, topic_id)
    if topic is not None:
        subject = await db.get(Subject, topic.subject_id)
        if subject is not None and (
            (topic.is_published and subject.is_published)
            or await editing.can_edit_subject(db, user, subject.id)
        ):
            return topic, subject
    raise AppError(404, "TOPIC_NOT_FOUND", "Mavzu topilmadi")


async def list_subject_cards(db: AsyncSession, user: User) -> list[SubjectCard]:
    subjects = await published_subjects(db)
    topics = await published_topics(db, [s.id for s in subjects])
    infos = await load_step_infos(db, [t.id for t in topics])
    progress = await load_progress(db, user.id, all_step_ids(infos))
    cards = []
    for subject in subjects:
        subject_topics = [t for t in topics if t.subject_id == subject.id]
        completed = total = 0
        for topic in subject_topics:
            done, count = count_progress(infos[topic.id], progress)
            completed += done
            total += count
        cards.append(
            SubjectCard(
                id=subject.id,
                title=subject.title,
                slug=subject.slug,
                description=subject.description,
                cover=subject.cover,
                topic_count=len(subject_topics),
                progress=ProgressOut(completed=completed, total=total),
            )
        )
    return cards


async def subject_detail(db: AsyncSession, user: User, slug: str) -> SubjectDetailOut:
    subject = await db.scalar(select(Subject).where(Subject.slug == slug))
    can_edit = subject is not None and await editing.can_edit_subject(db, user, subject.id)
    if subject is None or (not subject.is_published and not can_edit):
        raise AppError(404, "SUBJECT_NOT_FOUND", "Fan topilmadi")
    stmt = select(Topic).where(Topic.subject_id == subject.id).order_by(Topic.order, Topic.id)
    if not can_edit:
        stmt = stmt.where(Topic.is_published.is_(True))
    topics = list(await db.scalars(stmt))
    infos = await load_step_infos(db, [t.id for t in topics])
    progress = await load_progress(db, user.id, all_step_ids(infos))
    cards = []
    for topic in topics:
        done, total = count_progress(infos[topic.id], progress)
        cards.append(
            TopicCard(
                id=topic.id,
                title=topic.title,
                summary=topic.summary,
                order=topic.order,
                progress=ProgressOut(completed=done, total=total),
            )
        )
    return SubjectDetailOut(
        id=subject.id,
        title=subject.title,
        slug=subject.slug,
        description=subject.description,
        cover=subject.cover,
        topics=cards,
    )


async def topic_detail(db: AsyncSession, user: User, topic_id: int) -> TopicDetailOut:
    topic, subject = await get_visible_topic(db, user, topic_id)
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    progress = await load_progress(db, user.id, [info.id for info in infos])
    done, total = count_progress(infos, progress)
    return TopicDetailOut(
        id=topic.id,
        title=topic.title,
        summary=topic.summary,
        subject=SubjectRef(id=subject.id, title=subject.title, slug=subject.slug),
        steps=[
            StepBrief(
                id=info.id,
                kind=info.kind,
                order=info.order,
                has_content=info.has_content,
                status=progress.get(info.id),
            )
            for info in infos
        ],
        progress=ProgressOut(completed=done, total=total),
    )


async def _progress_row(db: AsyncSession, user_id: int, step_id: int) -> StepProgress | None:
    return await db.scalar(
        select(StepProgress).where(StepProgress.user_id == user_id, StepProgress.step_id == step_id)
    )


async def step_content(db: AsyncSession, user: User, step_id: int) -> StepContentOut:
    step = await editing.get_step(db, step_id)
    topic, _ = await get_visible_topic(db, user, step.topic_id)
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    info = next(i for i in infos if i.id == step.id)

    row = await _progress_row(db, user.id, step.id)
    if row is None:
        row = StepProgress(user_id=user.id, step_id=step.id, status=ProgressStatus.in_progress)
        db.add(row)
    else:
        row.updated_at = utcnow()  # "davom ettirish" uchun oxirgi ochilgan bosqich
    await db.commit()

    materials: list[MaterialView] = []
    if step.kind in FILE_STEP_KINDS:
        ready = await db.scalars(
            select(Material)
            .where(Material.step_id == step.id, Material.status == MaterialStatus.ready)
            .order_by(Material.id)
        )
        materials = [
            MaterialView(
                id=m.id,
                title=m.title,
                page_count=m.page_count,
                file_url=f"/api/materials/{m.id}/file",
            )
            for m in ready
        ]
    glossary = (
        [GlossaryOut.model_validate(t) for t in await topic_items.list_glossary(db, topic.id)]
        if step.kind == StepKind.glossary
        else []
    )
    literature = (
        [LiteratureOut.model_validate(i) for i in await topic_items.list_literature(db, topic.id)]
        if step.kind == StepKind.literature
        else []
    )
    return StepContentOut(
        id=step.id,
        topic_id=topic.id,
        kind=step.kind,
        order=step.order,
        has_content=info.has_content,
        status=row.status,
        materials=materials,
        glossary=glossary,
        literature=literature,
    )


async def complete_step(db: AsyncSession, user: User, step_id: int) -> StepBrief:
    step = await editing.get_step(db, step_id)
    topic, _ = await get_visible_topic(db, user, step.topic_id)
    if step.kind not in SELF_COMPLETE_STEP_KINDS:
        raise AppError(400, "STEP_NOT_COMPLETABLE", "Bu bosqich topshiriq orqali yakunlanadi")
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    if not next(i for i in infos if i.id == step.id).has_content:
        raise AppError(400, "STEP_EMPTY", "Bu bosqichda hali material yo'q")

    row = await _progress_row(db, user.id, step.id)
    if row is None:
        row = StepProgress(user_id=user.id, step_id=step.id, status=ProgressStatus.in_progress)
        db.add(row)
    if row.status != ProgressStatus.completed:
        row.status = ProgressStatus.completed
        row.completed_at = utcnow()
    row.updated_at = utcnow()
    await db.commit()
    return StepBrief(
        id=step.id,
        kind=step.kind,
        order=step.order,
        has_content=True,
        status=ProgressStatus.completed,
    )
