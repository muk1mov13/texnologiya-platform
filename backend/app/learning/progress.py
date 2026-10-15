from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment import views
from app.assessment.models import ACTIVITY_STEP_KINDS
from app.auth.models import Role, User
from app.core.errors import AppError
from app.core.types import utcnow
from app.gamification import rules
from app.gamification.rules import XpReason
from app.gamification.service import Rewards, award, rewards_out
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
    StepCompleteOut,
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
        completed = total = topics_completed = 0
        for topic in subject_topics:
            done, count = count_progress(infos[topic.id], progress)
            completed += done
            total += count
            if count > 0 and done == count:
                topics_completed += 1
        cards.append(
            SubjectCard(
                id=subject.id,
                title=subject.title,
                slug=subject.slug,
                description=subject.description,
                cover=subject.cover,
                topic_count=len(subject_topics),
                topics_completed=topics_completed,
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
                lesson_type=topic.lesson_type,
                progress=ProgressOut(completed=done, total=total),
            )
        )
    return SubjectDetailOut(
        id=subject.id,
        title=subject.title,
        slug=subject.slug,
        description=subject.description,
        cover=subject.cover,
        syllabus_name=subject.syllabus_name,
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
        lesson_type=topic.lesson_type,
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


async def get_or_create_progress(db: AsyncSession, user_id: int, step_id: int) -> StepProgress:
    """`StepProgress`'ni o'qiydi, topilmasa yaratadi. Ikki parallel so'rov bir xil
    user+step uchun bir vaqtda qator yaratishga urinsa, unique constraint
    violatsiyasi SAVEPOINT ichida ushlanadi va boshqa so'rov yaratgan qator
    qayta o'qib qaytariladi (500 o'rniga)."""
    row = await _progress_row(db, user_id, step_id)
    if row is not None:
        return row
    row = StepProgress(user_id=user_id, step_id=step_id, status=ProgressStatus.in_progress)
    try:
        async with db.begin_nested():
            db.add(row)
            await db.flush()
    except IntegrityError:
        # SAVEPOINT rollback'i `row`'ni sessiyadan avtomatik chiqarib tashlaydi.
        existing = await _progress_row(db, user_id, step_id)
        if existing is None:
            raise
        return existing
    return row


async def reward(
    db: AsyncSession,
    user: User,
    reason: XpReason,
    *,
    ref_type: str,
    ref_id: int,
    amount: int,
    now: datetime,
) -> Rewards:
    """XP faqat talabalarga beriladi: o'qituvchi yoki admin kursni ko'rib chiqayotganda
    progress saqlanadi, lekin XP, seriya va nishon berilmaydi."""
    if user.role != Role.student:
        return Rewards()
    return await award(
        db, user.id, reason, ref_type=ref_type, ref_id=ref_id, amount=amount, now=now
    )


async def topic_completion_rewards(
    db: AsyncSession, user: User, topic_id: int, now: datetime
) -> Rewards:
    """Mavzuning kontenti bor barcha bosqichlari tugagan bo'lsa, `topic_completed`
    XP'sini beradi."""
    await db.flush()
    infos = (await load_step_infos(db, [topic_id]))[topic_id]
    status = await load_progress(db, user.id, [info.id for info in infos])
    done, total = count_progress(infos, status)
    if total == 0 or done < total:
        return Rewards()
    return await reward(
        db,
        user,
        XpReason.topic_completed,
        ref_type="topic",
        ref_id=topic_id,
        amount=rules.TOPIC_COMPLETED_XP,
        now=now,
    )


async def mark_step_completed(
    db: AsyncSession, user: User, row: StepProgress, topic_id: int, now: datetime
) -> Rewards:
    """Bosqichni tugatilgan deb belgilaydi; mavzu to'liq tugagan bo'lsa uning XP'sini beradi."""
    if row.status != ProgressStatus.completed:
        row.status = ProgressStatus.completed
        row.completed_at = now
    row.updated_at = now
    return await topic_completion_rewards(db, user, topic_id, now)


async def visible_topic_or(db: AsyncSession, user: User, topic_id: int, error: AppError) -> Topic:
    """`get_visible_topic`, lekin ko'rinmasa berilgan xato ko'tariladi: ichki obyektning
    (faoliyat, vazifa) borligi oshkor qilinmaydi."""
    try:
        topic, _subject = await get_visible_topic(db, user, topic_id)
    except AppError:
        raise error from None
    return topic


async def step_content(db: AsyncSession, user: User, step_id: int) -> StepContentOut:
    step = await editing.get_step(db, step_id)
    topic, _ = await get_visible_topic(db, user, step.topic_id)
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    info = next(i for i in infos if i.id == step.id)

    row = await get_or_create_progress(db, user.id, step.id)
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
    activities = (
        await views.activity_views(db, user.id, step.id) if step.kind in ACTIVITY_STEP_KINDS else []
    )
    task, submission = (
        await views.task_view(db, user.id, step.id) if step.kind == StepKind.task else (None, None)
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
        activities=activities,
        task=task,
        submission=submission,
    )


async def complete_step(db: AsyncSession, user: User, step_id: int) -> StepCompleteOut:
    step = await editing.get_step(db, step_id)
    topic, _ = await get_visible_topic(db, user, step.topic_id)
    if step.kind not in SELF_COMPLETE_STEP_KINDS:
        raise AppError(400, "STEP_NOT_COMPLETABLE", "Bu bosqich topshiriq orqali yakunlanadi")
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    if not next(i for i in infos if i.id == step.id).has_content:
        raise AppError(400, "STEP_EMPTY", "Bu bosqichda hali material yo'q")

    now = utcnow()
    row = await get_or_create_progress(db, user.id, step.id)
    rewards = await reward(
        db,
        user,
        XpReason.step_completed,
        ref_type="step",
        ref_id=step.id,
        amount=rules.STEP_COMPLETED_XP,
        now=now,
    )
    rewards += await mark_step_completed(db, user, row, topic.id, now)
    await db.commit()
    return StepCompleteOut(
        id=step.id,
        kind=step.kind,
        order=step.order,
        has_content=True,
        status=ProgressStatus.completed,
        rewards=rewards_out(rewards),
    )
