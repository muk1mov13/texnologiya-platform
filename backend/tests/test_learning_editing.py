import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.errors import AppError
from app.learning import editing
from app.learning.models import STEP_KINDS_IN_ORDER, Step
from app.learning.schemas import SubjectCreate, SubjectUpdate, TopicCreate
from tests.factories import make_user


def test_slugify_handles_uzbek_apostrophes() -> None:
    assert editing.slugify("Kasb hunarga yo'naltirish fani") == "kasb-hunarga-yonaltirish-fani"
    assert editing.slugify("O‘quv  reja!") == "oquv-reja"


def test_slugify_transliterates_cyrillic() -> None:
    assert editing.slugify("Технология обучения") == "tekhnologiya-obucheniya"
    assert editing.slugify("Ўқув режа") == "oquv-rezha"


def test_slugify_falls_back_when_empty() -> None:
    assert editing.slugify("!!!") == "fan"


async def test_create_subject_generates_unique_slugs(db: AsyncSession) -> None:
    first = await editing.create_subject(db, SubjectCreate(title="Praktikum fani"))
    second = await editing.create_subject(db, SubjectCreate(title="Praktikum fani"))
    assert (first.slug, second.slug) == ("praktikum-fani", "praktikum-fani-2")


async def test_create_subject_rejects_taken_explicit_slug(db: AsyncSession) -> None:
    await editing.create_subject(db, SubjectCreate(title="Praktikum", slug="praktikum"))
    with pytest.raises(AppError) as exc:
        await editing.create_subject(db, SubjectCreate(title="Boshqa", slug="praktikum"))
    assert exc.value.code == "SLUG_TAKEN"


async def test_create_subject_translates_slug_race_to_slug_taken(
    db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    await editing.create_subject(db, SubjectCreate(title="Fan", slug="fan"))

    async def _never_exists(_db: AsyncSession, _slug: str) -> bool:
        return False

    monkeypatch.setattr(editing, "_slug_exists", _never_exists)
    with pytest.raises(AppError) as exc:
        await editing.create_subject(db, SubjectCreate(title="Boshqa fan", slug="fan"))
    assert exc.value.code == "SLUG_TAKEN"


async def test_update_subject_translates_slug_race_to_slug_taken(
    db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    first = await editing.create_subject(db, SubjectCreate(title="Birinchi", slug="birinchi"))
    second = await editing.create_subject(db, SubjectCreate(title="Ikkinchi", slug="ikkinchi"))

    async def _never_exists(_db: AsyncSession, _slug: str) -> bool:
        return False

    monkeypatch.setattr(editing, "_slug_exists", _never_exists)
    with pytest.raises(AppError) as exc:
        await editing.update_subject(db, second, SubjectUpdate(slug=first.slug))
    assert exc.value.code == "SLUG_TAKEN"


async def test_create_topic_creates_seven_ordered_steps(db: AsyncSession) -> None:
    subject = await editing.create_subject(db, SubjectCreate(title="Kasbiy kompetentlik"))
    first = await editing.create_topic(db, subject.id, TopicCreate(title="1-mavzu"))
    second = await editing.create_topic(db, subject.id, TopicCreate(title="2-mavzu"))
    assert (first.order, second.order) == (1, 2)
    steps = list(
        await db.scalars(select(Step).where(Step.topic_id == first.id).order_by(Step.order))
    )
    assert [s.kind for s in steps] == list(STEP_KINDS_IN_ORDER)
    assert [s.order for s in steps] == [1, 2, 3, 4, 5, 6, 7]


async def test_set_subject_teachers_accepts_only_teachers(db: AsyncSession) -> None:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    subject = await editing.create_subject(db, SubjectCreate(title="Fan"))

    assert await editing.set_subject_teachers(db, subject.id, [teacher.id, teacher.id]) == [
        teacher.id
    ]
    with pytest.raises(AppError) as exc:
        await editing.set_subject_teachers(db, subject.id, [student.id])
    assert exc.value.code == "NOT_A_TEACHER"
    assert exc.value.details == {"user_ids": [student.id]}


async def test_ensure_can_edit_subject(db: AsyncSession) -> None:
    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    other = await make_user(db, email="boshqa@mail.uz", role=Role.teacher)
    subject = await editing.create_subject(db, SubjectCreate(title="Fan"))
    await editing.set_subject_teachers(db, subject.id, [teacher.id])

    assert (await editing.ensure_can_edit_subject(db, admin, subject.id)).id == subject.id
    assert (await editing.ensure_can_edit_subject(db, teacher, subject.id)).id == subject.id
    with pytest.raises(AppError) as exc:
        await editing.ensure_can_edit_subject(db, other, subject.id)
    assert exc.value.code == "NOT_SUBJECT_TEACHER"
    with pytest.raises(AppError) as missing:
        await editing.ensure_can_edit_subject(db, admin, 9999)
    assert missing.value.code == "SUBJECT_NOT_FOUND"
