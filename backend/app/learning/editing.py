import re
from collections import defaultdict
from collections.abc import Sequence
from typing import Any

from sqlalchemy import ColumnElement, delete, func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.core.errors import AppError
from app.learning.models import (
    STEP_KINDS_IN_ORDER,
    GlossaryTerm,
    LiteratureItem,
    Material,
    Step,
    Subject,
    Topic,
    subject_teachers,
)
from app.learning.schemas import (
    GlossaryOut,
    LiteratureOut,
    MaterialOut,
    StepEditorOut,
    SubjectAdminOut,
    SubjectCreate,
    SubjectUpdate,
    TeachSubjectOut,
    TeachTopicBrief,
    TopicCreate,
    TopicEditorOut,
    TopicUpdate,
)

# --- slug ---------------------------------------------------------------------------------

_APOSTROPHES = "'ʻʼ’‘`"
_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh",
    "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o",
    "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
    "я": "ya", "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h",
}  # fmt: skip


def slugify(text: str) -> str:
    text = text.lower()
    for mark in _APOSTROPHES:
        text = text.replace(mark, "")
    text = "".join(_CYRILLIC.get(ch, ch) for ch in text)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:200] or "fan"


# --- subjects -----------------------------------------------------------------------------


async def get_subject(db: AsyncSession, subject_id: int) -> Subject:
    subject = await db.get(Subject, subject_id)
    if subject is None:
        raise AppError(404, "SUBJECT_NOT_FOUND", "Fan topilmadi")
    return subject


async def _slug_exists(db: AsyncSession, slug: str) -> bool:
    return await db.scalar(select(Subject.id).where(Subject.slug == slug)) is not None


async def _unique_slug(db: AsyncSession, base: str) -> str:
    slug, suffix = base, 2
    while await _slug_exists(db, slug):
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


async def create_subject(db: AsyncSession, data: SubjectCreate) -> Subject:
    if data.slug:
        if await _slug_exists(db, data.slug):
            raise AppError(409, "SLUG_TAKEN", "Bu slug band")
        slug = data.slug
    else:
        slug = await _unique_slug(db, slugify(data.title))
    subject = Subject(
        title=data.title.strip(),
        slug=slug,
        description=data.description,
        order=data.order,
        is_published=data.is_published,
    )
    db.add(subject)
    await db.commit()
    return subject


async def update_subject(db: AsyncSession, subject: Subject, data: SubjectUpdate) -> Subject:
    values = data.model_dump(exclude_unset=True)
    new_slug = values.get("slug")
    if new_slug and new_slug != subject.slug and await _slug_exists(db, new_slug):
        raise AppError(409, "SLUG_TAKEN", "Bu slug band")
    for field, value in values.items():
        if value is not None:
            setattr(subject, field, value)
    await db.commit()
    return subject


async def _material_paths(db: AsyncSession, *conditions: ColumnElement[bool]) -> list[str]:
    rows = await db.execute(
        select(Material.original_file, Material.pdf_file)
        .join(Step, Material.step_id == Step.id)
        .join(Topic, Step.topic_id == Topic.id)
        .where(*conditions)
    )
    return sorted({path for row in rows for path in row if path})


async def delete_subject(db: AsyncSession, subject: Subject) -> list[str]:
    """Fanni o'chiradi va diskdan o'chirilishi kerak bo'lgan fayl yo'llarini qaytaradi."""
    paths = await _material_paths(db, Topic.subject_id == subject.id)
    await db.delete(subject)
    await db.commit()
    return paths


async def teacher_ids_for(db: AsyncSession, subject_ids: Sequence[int]) -> dict[int, list[int]]:
    result: dict[int, list[int]] = {sid: [] for sid in subject_ids}
    if subject_ids:
        rows = await db.execute(
            select(subject_teachers.c.subject_id, subject_teachers.c.user_id)
            .where(subject_teachers.c.subject_id.in_(subject_ids))
            .order_by(subject_teachers.c.user_id)
        )
        for subject_id, user_id in rows:
            result[subject_id].append(user_id)
    return result


async def set_subject_teachers(
    db: AsyncSession, subject_id: int, teacher_ids: Sequence[int]
) -> list[int]:
    await get_subject(db, subject_id)
    ids = sorted(set(teacher_ids))
    if ids:
        found = set(
            await db.scalars(select(User.id).where(User.id.in_(ids), User.role == Role.teacher))
        )
        missing = [uid for uid in ids if uid not in found]
        if missing:
            raise AppError(
                400,
                "NOT_A_TEACHER",
                "Faqat o'qituvchilarni biriktirish mumkin",
                {"user_ids": missing},
            )
    await db.execute(delete(subject_teachers).where(subject_teachers.c.subject_id == subject_id))
    if ids:
        await db.execute(
            insert(subject_teachers), [{"subject_id": subject_id, "user_id": uid} for uid in ids]
        )
    await db.commit()
    return ids


async def subject_admin_out(db: AsyncSession, subject: Subject) -> SubjectAdminOut:
    ids = (await teacher_ids_for(db, [subject.id]))[subject.id]
    return SubjectAdminOut.model_validate(subject).model_copy(update={"teacher_ids": ids})


async def list_subjects_admin(db: AsyncSession) -> list[SubjectAdminOut]:
    subjects = list(await db.scalars(select(Subject).order_by(Subject.order, Subject.id)))
    ids = await teacher_ids_for(db, [s.id for s in subjects])
    return [
        SubjectAdminOut.model_validate(s).model_copy(update={"teacher_ids": ids[s.id]})
        for s in subjects
    ]


# --- permissions --------------------------------------------------------------------------


async def can_edit_subject(db: AsyncSession, user: User, subject_id: int) -> bool:
    if user.role == Role.admin:
        return True
    if user.role != Role.teacher:
        return False
    count = await db.scalar(
        select(func.count())
        .select_from(subject_teachers)
        .where(
            subject_teachers.c.subject_id == subject_id,
            subject_teachers.c.user_id == user.id,
        )
    )
    return bool(count)


async def ensure_can_edit_subject(db: AsyncSession, user: User, subject_id: int) -> Subject:
    subject = await get_subject(db, subject_id)
    if not await can_edit_subject(db, user, subject_id):
        raise AppError(403, "NOT_SUBJECT_TEACHER", "Siz bu fanga biriktirilmagansiz")
    return subject


async def get_topic(db: AsyncSession, topic_id: int) -> Topic:
    topic = await db.get(Topic, topic_id)
    if topic is None:
        raise AppError(404, "TOPIC_NOT_FOUND", "Mavzu topilmadi")
    return topic


async def ensure_can_edit_topic(db: AsyncSession, user: User, topic_id: int) -> Topic:
    topic = await get_topic(db, topic_id)
    await ensure_can_edit_subject(db, user, topic.subject_id)
    return topic


async def get_step(db: AsyncSession, step_id: int) -> Step:
    step = await db.get(Step, step_id)
    if step is None:
        raise AppError(404, "STEP_NOT_FOUND", "Bosqich topilmadi")
    return step


async def ensure_can_edit_step(db: AsyncSession, user: User, step_id: int) -> tuple[Step, Topic]:
    step = await get_step(db, step_id)
    topic = await ensure_can_edit_topic(db, user, step.topic_id)
    return step, topic


# --- topics -------------------------------------------------------------------------------


async def create_topic(db: AsyncSession, subject_id: int, data: TopicCreate) -> Topic:
    current_max = await db.scalar(
        select(func.max(Topic.order)).where(Topic.subject_id == subject_id)
    )
    topic = Topic(
        subject_id=subject_id,
        order=(current_max or 0) + 1,
        title=data.title.strip(),
        summary=data.summary,
        is_published=data.is_published,
    )
    db.add(topic)
    await db.flush()
    for index, kind in enumerate(STEP_KINDS_IN_ORDER, start=1):
        db.add(Step(topic_id=topic.id, kind=kind, order=index))
    await db.commit()
    return topic


async def update_topic(db: AsyncSession, topic: Topic, data: TopicUpdate) -> Topic:
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(topic, field, value)
    await db.commit()
    return topic


async def delete_topic(db: AsyncSession, topic: Topic) -> list[str]:
    paths = await _material_paths(db, Step.topic_id == topic.id)
    await db.delete(topic)
    await db.commit()
    return paths


async def reorder_topics(db: AsyncSession, subject_id: int, topic_ids: list[int]) -> list[Topic]:
    existing = list(await db.scalars(select(Topic).where(Topic.subject_id == subject_id)))
    if len(set(topic_ids)) != len(topic_ids) or sorted(t.id for t in existing) != sorted(topic_ids):
        raise AppError(400, "INVALID_ORDER", "Mavzular ro'yxati fan mavzulariga mos emas")
    by_id = {t.id: t for t in existing}
    for position, topic_id in enumerate(topic_ids, start=1):
        by_id[topic_id].order = position
    await db.commit()
    return [by_id[tid] for tid in topic_ids]


async def list_teach_subjects(db: AsyncSession, user: User) -> list[TeachSubjectOut]:
    stmt = select(Subject).order_by(Subject.order, Subject.id)
    if user.role != Role.admin:
        stmt = stmt.join(subject_teachers, subject_teachers.c.subject_id == Subject.id).where(
            subject_teachers.c.user_id == user.id
        )
    subjects = list(await db.scalars(stmt))
    by_subject: dict[int, list[TeachTopicBrief]] = defaultdict(list)
    if subjects:
        topics = await db.scalars(
            select(Topic)
            .where(Topic.subject_id.in_([s.id for s in subjects]))
            .order_by(Topic.order, Topic.id)
        )
        for topic in topics:
            by_subject[topic.subject_id].append(TeachTopicBrief.model_validate(topic))
    return [
        TeachSubjectOut(
            id=s.id,
            title=s.title,
            slug=s.slug,
            is_published=s.is_published,
            topics=by_subject[s.id],
        )
        for s in subjects
    ]


async def topic_editor_view(db: AsyncSession, topic: Topic) -> TopicEditorOut:
    steps = list(
        await db.scalars(select(Step).where(Step.topic_id == topic.id).order_by(Step.order))
    )
    materials_by_step: dict[int, list[MaterialOut]] = defaultdict(list)
    materials = await db.scalars(
        select(Material).where(Material.step_id.in_([s.id for s in steps])).order_by(Material.id)
    )
    for material in materials:
        materials_by_step[material.step_id].append(MaterialOut.model_validate(material))
    glossary = await db.scalars(
        select(GlossaryTerm)
        .where(GlossaryTerm.topic_id == topic.id)
        .order_by(GlossaryTerm.order, GlossaryTerm.id)
    )
    literature = await db.scalars(
        select(LiteratureItem)
        .where(LiteratureItem.topic_id == topic.id)
        .order_by(LiteratureItem.order, LiteratureItem.id)
    )
    return TopicEditorOut(
        id=topic.id,
        subject_id=topic.subject_id,
        title=topic.title,
        summary=topic.summary,
        order=topic.order,
        is_published=topic.is_published,
        steps=[
            StepEditorOut(id=s.id, kind=s.kind, order=s.order, materials=materials_by_step[s.id])
            for s in steps
        ],
        glossary=[GlossaryOut.model_validate(g) for g in glossary],
        literature=[LiteratureOut.model_validate(item) for item in literature],
    )


def apply_update(obj: Any, values: dict[str, Any], nullable: frozenset[str]) -> None:
    """PATCH qiymatlarini qo'llaydi: `None` faqat `nullable` maydonlarda qiymatni tozalaydi."""
    for field, value in values.items():
        if value is None and field not in nullable:
            continue
        setattr(obj, field, value)
