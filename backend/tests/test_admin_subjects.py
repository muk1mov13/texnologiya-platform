from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.learning.models import Topic
from tests.factories import auth_headers, make_subject, make_topic, make_user


async def admin_headers(db: AsyncSession, settings: Settings) -> dict[str, str]:
    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)
    return auth_headers(admin, settings)


async def test_create_subject_with_generated_slug(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    payload = {"title": "Kasb hunarga yo'naltirish fani", "is_published": True}
    first = await client.post("/api/admin/subjects", headers=headers, json=payload)
    second = await client.post("/api/admin/subjects", headers=headers, json=payload)
    assert first.status_code == 201, first.text
    assert first.json()["slug"] == "kasb-hunarga-yonaltirish-fani"
    assert first.json()["teacher_ids"] == []
    assert second.json()["slug"] == "kasb-hunarga-yonaltirish-fani-2"


async def test_explicit_duplicate_slug_is_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    await client.post("/api/admin/subjects", headers=headers, json={"title": "Ab", "slug": "fan"})
    response = await client.post(
        "/api/admin/subjects", headers=headers, json={"title": "B fan", "slug": "fan"}
    )
    assert response.status_code == 409
    assert response.json()["code"] == "SLUG_TAKEN"


async def test_list_and_update_subject(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    subject = await make_subject(db, title="Praktikum", published=False)
    response = await client.patch(
        f"/api/admin/subjects/{subject.id}",
        headers=headers,
        json={"title": "Praktikum fani", "is_published": True},
    )
    assert response.status_code == 200
    listed = await client.get("/api/admin/subjects", headers=headers)
    assert [(s["title"], s["is_published"]) for s in listed.json()] == [("Praktikum fani", True)]


async def test_delete_subject_removes_topics(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    subject = await make_subject(db)
    await make_topic(db, subject)
    response = await client.delete(f"/api/admin/subjects/{subject.id}", headers=headers)
    assert response.status_code == 204
    assert (await client.get("/api/admin/subjects", headers=headers)).json() == []
    assert await db.scalar(select(func.count()).select_from(Topic)) == 0


async def test_assign_teachers(client: AsyncClient, db: AsyncSession, settings: Settings) -> None:
    headers = await admin_headers(db, settings)
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    subject = await make_subject(db)

    ok = await client.put(
        f"/api/admin/subjects/{subject.id}/teachers",
        headers=headers,
        json={"teacher_ids": [teacher.id]},
    )
    assert ok.status_code == 200
    assert ok.json()["teacher_ids"] == [teacher.id]

    bad = await client.put(
        f"/api/admin/subjects/{subject.id}/teachers",
        headers=headers,
        json={"teacher_ids": [student.id]},
    )
    assert bad.status_code == 400
    assert bad.json()["code"] == "NOT_A_TEACHER"
    assert bad.json()["details"] == {"user_ids": [student.id]}


async def test_create_subject_with_whitespace_only_title_is_422(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    response = await client.post("/api/admin/subjects", headers=headers, json={"title": "   "})
    assert response.status_code == 422


async def test_create_subject_with_out_of_range_order_is_422(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    response = await client.post(
        "/api/admin/subjects",
        headers=headers,
        json={"title": "Katta tartib", "order": 3_000_000_000},
    )
    assert response.status_code == 422


async def test_unknown_subject_is_404(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    response = await client.patch("/api/admin/subjects/9999", headers=headers, json={"order": 1})
    assert response.status_code == 404
    assert response.json()["code"] == "SUBJECT_NOT_FOUND"


async def test_students_cannot_manage_subjects(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    student = await make_user(db)
    response = await client.get("/api/admin/subjects", headers=auth_headers(student, settings))
    assert response.status_code == 403
