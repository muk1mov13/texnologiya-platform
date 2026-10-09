from typing import Any

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.learning.models import StepKind
from tests.factories import Course, auth_headers, build_course, make_user, step_of


async def complete(client: AsyncClient, course: Course, step_id: int) -> None:
    response = await client.post(f"/api/steps/{step_id}/complete", headers=course.student_headers)
    assert response.status_code == 200, response.text


async def continue_target(client: AsyncClient, course: Course) -> Any:
    response = await client.get("/api/me/continue", headers=course.student_headers)
    assert response.status_code == 200, response.text
    return response.json()


async def test_continue_walks_through_content_steps(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    t1_lecture = await step_of(db, course.topic1, StepKind.lecture)
    t1_glossary = await step_of(db, course.topic1, StepKind.glossary)
    t2_lecture = await step_of(db, course.topic2, StepKind.lecture)

    first = await continue_target(client, course)
    assert first["step_id"] == t1_lecture.id
    assert first["subject_slug"] == course.subject.slug

    await complete(client, course, t1_lecture.id)
    assert (await continue_target(client, course))["step_id"] == t1_glossary.id

    await complete(client, course, t1_glossary.id)
    nxt = await continue_target(client, course)
    assert (nxt["step_id"], nxt["topic_title"], nxt["step_kind"]) == (
        t2_lecture.id,
        "2-mavzu",
        "lecture",
    )

    await complete(client, course, t2_lecture.id)
    assert await continue_target(client, course) is None


async def test_continue_prefers_last_opened_topic(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    t2_lecture = await step_of(db, course.topic2, StepKind.lecture)
    opened = await client.get(f"/api/steps/{t2_lecture.id}", headers=course.student_headers)
    assert opened.status_code == 200
    assert (await continue_target(client, course))["step_id"] == t2_lecture.id


async def test_continue_is_null_without_content(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    student = await make_user(db)
    response = await client.get("/api/me/continue", headers=auth_headers(student, settings))
    assert response.status_code == 200
    assert response.json() is None


async def test_progress_summary(client: AsyncClient, db: AsyncSession, settings: Settings) -> None:
    course = await build_course(client, db, settings)
    await complete(client, course, (await step_of(db, course.topic1, StepKind.lecture)).id)
    response = await client.get("/api/me/progress", headers=course.student_headers)
    assert response.json() == [
        {
            "subject_id": course.subject.id,
            "subject_title": course.subject.title,
            "subject_slug": course.subject.slug,
            "progress": {"completed": 1, "total": 3},
        }
    ]


async def test_material_file_is_served_to_students(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    response = await client.get(
        f"/api/materials/{course.material_ids['topic1']}/file", headers=course.student_headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"


async def test_hidden_topic_material_is_404_for_students(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    url = f"/api/materials/{course.material_ids['hidden']}/file"
    denied = await client.get(url, headers=course.student_headers)
    assert denied.status_code == 404
    assert denied.json()["code"] == "TOPIC_NOT_FOUND"
    assert (await client.get(url, headers=course.teacher_headers)).status_code == 200


async def test_unknown_material_is_404(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    response = await client.get("/api/materials/9999/file", headers=course.student_headers)
    assert response.status_code == 404
    assert response.json()["code"] == "MATERIAL_NOT_FOUND"


async def test_material_file_uses_accel_redirect_in_prod_mode(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    settings.media_accel_redirect = True
    response = await client.get(
        f"/api/materials/{course.material_ids['topic1']}/file", headers=course.student_headers
    )
    assert response.status_code == 200
    accel = response.headers["x-accel-redirect"]
    assert accel.startswith("/protected-media/materials/") and accel.endswith(".pdf")
    assert response.content == b""
