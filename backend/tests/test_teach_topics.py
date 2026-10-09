import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.core.config import Settings
from app.core.storage import Storage
from app.learning.models import StepKind, Subject
from tests.factories import (
    add_ready_pdf,
    auth_headers,
    make_subject,
    make_topic,
    make_user,
    step_of,
)


async def teacher_with_subject(db: AsyncSession) -> tuple[User, Subject]:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    subject = await make_subject(db, teachers=[teacher])
    return teacher, subject


async def test_assigned_teacher_creates_topic_with_seven_steps(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, subject = await teacher_with_subject(db)
    headers = auth_headers(teacher, settings)
    first = await client.post(
        f"/api/teach/subjects/{subject.id}/topics", headers=headers, json={"title": "1-mavzu"}
    )
    second = await client.post(
        f"/api/teach/subjects/{subject.id}/topics", headers=headers, json={"title": "2-mavzu"}
    )
    assert first.status_code == 201, first.text
    body = first.json()
    assert [s["kind"] for s in body["steps"]] == [
        "review", "lecture", "presentation", "practice", "task", "glossary", "literature",
    ]  # fmt: skip
    assert (body["order"], second.json()["order"]) == (1, 2)
    assert body["is_published"] is False


async def test_unassigned_teacher_and_student_are_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    _, subject = await teacher_with_subject(db)
    other = await make_user(db, email="boshqa@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    url = f"/api/teach/subjects/{subject.id}/topics"

    denied = await client.post(
        url, headers=auth_headers(other, settings), json={"title": "X mavzu"}
    )
    assert denied.status_code == 403
    assert denied.json()["code"] == "NOT_SUBJECT_TEACHER"
    student_denied = await client.post(
        url, headers=auth_headers(student, settings), json={"title": "X mavzu"}
    )
    assert student_denied.json()["code"] == "FORBIDDEN"


async def test_unknown_subject_is_404(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, _ = await teacher_with_subject(db)
    response = await client.post(
        "/api/teach/subjects/9999/topics",
        headers=auth_headers(teacher, settings),
        json={"title": "X mavzu"},
    )
    assert response.status_code == 404
    assert response.json()["code"] == "SUBJECT_NOT_FOUND"


async def test_teacher_sees_only_assigned_subjects_admin_sees_all(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, subject = await teacher_with_subject(db)
    await make_topic(db, subject)
    await make_subject(db, title="Boshqa fan")
    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)

    mine = await client.get("/api/teach/subjects", headers=auth_headers(teacher, settings))
    assert [s["id"] for s in mine.json()] == [subject.id]
    assert [t["title"] for t in mine.json()[0]["topics"]] == ["1-mavzu"]
    everything = await client.get("/api/teach/subjects", headers=auth_headers(admin, settings))
    assert len(everything.json()) == 2


async def test_update_and_delete_topic(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, subject = await teacher_with_subject(db)
    topic = await make_topic(db, subject, published=False)
    headers = auth_headers(teacher, settings)

    updated = await client.patch(
        f"/api/teach/topics/{topic.id}",
        headers=headers,
        json={"title": "Kasb turlari", "is_published": True},
    )
    assert updated.status_code == 200
    assert (updated.json()["title"], updated.json()["is_published"]) == ("Kasb turlari", True)

    deleted = await client.delete(f"/api/teach/topics/{topic.id}", headers=headers)
    assert deleted.status_code == 204
    missing = await client.get(f"/api/teach/topics/{topic.id}", headers=headers)
    assert missing.status_code == 404
    assert missing.json()["code"] == "TOPIC_NOT_FOUND"


async def test_delete_topic_survives_locked_file(
    client: AsyncClient, db: AsyncSession, settings: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    teacher, subject = await teacher_with_subject(db)
    topic = await make_topic(db, subject)
    headers = auth_headers(teacher, settings)
    lecture = await step_of(db, topic, StepKind.lecture)
    await add_ready_pdf(client, headers, lecture.id)

    def failing_delete(self: Storage, rel: str | None) -> None:
        raise OSError("faylga ruxsat yo'q")

    monkeypatch.setattr(Storage, "delete", failing_delete)
    response = await client.delete(f"/api/teach/topics/{topic.id}", headers=headers)
    assert response.status_code == 204


async def test_reorder_topics(client: AsyncClient, db: AsyncSession, settings: Settings) -> None:
    teacher, subject = await teacher_with_subject(db)
    first = await make_topic(db, subject, title="Birinchi")
    second = await make_topic(db, subject, title="Ikkinchi")
    headers = auth_headers(teacher, settings)
    url = f"/api/teach/subjects/{subject.id}/topics/order"

    bad = await client.put(url, headers=headers, json={"topic_ids": [first.id]})
    assert bad.status_code == 400
    assert bad.json()["code"] == "INVALID_ORDER"

    ok = await client.put(url, headers=headers, json={"topic_ids": [second.id, first.id]})
    assert ok.status_code == 200
    assert [(t["title"], t["order"]) for t in ok.json()] == [("Ikkinchi", 1), ("Birinchi", 2)]
