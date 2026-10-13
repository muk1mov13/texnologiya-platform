import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, UserStatus
from app.core.config import Settings
from app.learning import progress as progress_module
from app.learning.models import Material, MaterialStatus, ProgressStatus, StepKind, StepProgress
from tests.factories import auth_headers, build_course, make_subject, make_user, step_of


async def test_subject_list_shows_published_subjects_with_progress(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    await make_subject(db, title="Yashirin fan", published=False)
    response = await client.get("/api/subjects", headers=course.student_headers)
    assert response.status_code == 200
    cards = response.json()
    assert [c["slug"] for c in cards] == [course.subject.slug]
    assert cards[0]["topic_count"] == 2
    assert cards[0]["progress"] == {"completed": 0, "total": 3}


async def test_unpublished_subject_visible_only_to_its_teacher(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    hidden = await make_subject(db, title="Yashirin fan", published=False, teachers=[teacher])
    url = f"/api/subjects/{hidden.slug}"

    denied = await client.get(url, headers=auth_headers(student, settings))
    assert denied.status_code == 404
    assert denied.json()["code"] == "SUBJECT_NOT_FOUND"
    allowed = await client.get(url, headers=auth_headers(teacher, settings))
    assert allowed.status_code == 200


async def test_subject_detail_lists_published_topics_for_students(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    url = f"/api/subjects/{course.subject.slug}"
    student_view = (await client.get(url, headers=course.student_headers)).json()
    assert [t["title"] for t in student_view["topics"]] == ["1-mavzu", "2-mavzu"]
    assert student_view["topics"][0]["progress"] == {"completed": 0, "total": 2}
    teacher_view = (await client.get(url, headers=course.teacher_headers)).json()
    assert len(teacher_view["topics"]) == 3


async def test_topic_detail_marks_steps_with_content(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    response = await client.get(f"/api/topics/{course.topic1.id}", headers=course.student_headers)
    assert response.status_code == 200
    body = response.json()
    assert [s["kind"] for s in body["steps"]] == [
        "review", "lecture", "presentation", "practice", "task", "glossary", "literature",
    ]  # fmt: skip
    assert {s["kind"] for s in body["steps"] if s["has_content"]} == {"lecture", "glossary"}
    assert all(s["status"] is None for s in body["steps"])
    assert body["progress"] == {"completed": 0, "total": 2}
    assert body["subject"]["slug"] == course.subject.slug


async def test_hidden_topic_is_404_for_students_only(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    url = f"/api/topics/{course.hidden_topic.id}"
    denied = await client.get(url, headers=course.student_headers)
    assert denied.status_code == 404
    assert denied.json()["code"] == "TOPIC_NOT_FOUND"
    assert (await client.get(url, headers=course.teacher_headers)).status_code == 200


async def test_step_content_lists_ready_materials_and_starts_progress(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    db.add(
        Material(
            step_id=lecture.id,
            title="Konvertatsiyada",
            original_file="materials/x.pptx",
            original_name="x.pptx",
            status=MaterialStatus.processing,
        )
    )
    await db.commit()

    response = await client.get(f"/api/steps/{lecture.id}", headers=course.student_headers)
    assert response.status_code == 200
    body = response.json()
    material_id = course.material_ids["topic1"]
    assert body["status"] == "in_progress"
    assert body["materials"] == [
        {
            "id": material_id,
            "title": "Mavzu bayoni",
            "page_count": 2,
            "file_url": f"/api/materials/{material_id}/file",
        }
    ]


async def test_glossary_step_returns_terms(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    glossary = await step_of(db, course.topic1, StepKind.glossary)
    body = (await client.get(f"/api/steps/{glossary.id}", headers=course.student_headers)).json()
    assert [t["term"] for t in body["glossary"]] == ["Kasb"]
    assert body["materials"] == []


async def test_completing_steps_updates_topic_progress(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    url = f"/api/steps/{lecture.id}/complete"
    first = await client.post(url, headers=course.student_headers)
    assert first.status_code == 200
    assert first.json()["status"] == "completed"
    assert (await client.post(url, headers=course.student_headers)).status_code == 200

    topic = await client.get(f"/api/topics/{course.topic1.id}", headers=course.student_headers)
    assert topic.json()["progress"] == {"completed": 1, "total": 2}


async def test_steps_without_self_completion_are_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    literature = await step_of(db, course.topic1, StepKind.literature)

    not_completable = await client.post(
        f"/api/steps/{review.id}/complete", headers=course.student_headers
    )
    assert not_completable.status_code == 400
    assert not_completable.json()["code"] == "STEP_NOT_COMPLETABLE"
    empty = await client.post(
        f"/api/steps/{literature.id}/complete", headers=course.student_headers
    )
    assert empty.status_code == 400
    assert empty.json()["code"] == "STEP_EMPTY"


async def test_pending_users_cannot_browse(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    pending = await make_user(db, email="kutish@mail.uz", status=UserStatus.pending)
    response = await client.get("/api/subjects", headers=auth_headers(pending, settings))
    assert response.status_code == 403
    assert response.json()["code"] == "ACCOUNT_PENDING"


async def test_concurrent_progress_creation_does_not_500(
    client: AsyncClient, db: AsyncSession, settings: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Ikki parallel so'rov bir xil user+step uchun StepProgress yaratishga urinishi mumkin.
    `_progress_row`'ni birinchi chaqiruvda `None` qaytarib (go'yoki qator hali yo'q),
    lekin qatorning allaqachon mavjud ekanligini simulyatsiya qilamiz: `get_or_create_progress`
    unique constraint xatosini ushlab, mavjud qatorni qayta o'qishi va 500 bermasligi kerak."""
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    db.add(
        StepProgress(
            user_id=course.student.id, step_id=lecture.id, status=ProgressStatus.in_progress
        )
    )
    await db.commit()

    original = progress_module._progress_row

    def flaky_once() -> object:
        calls = {"n": 0}

        async def wrapper(db_: AsyncSession, user_id: int, step_id: int) -> StepProgress | None:
            calls["n"] += 1
            if calls["n"] == 1:
                return None
            return await original(db_, user_id, step_id)

        return wrapper

    monkeypatch.setattr(progress_module, "_progress_row", flaky_once())
    response = await client.get(f"/api/steps/{lecture.id}", headers=course.student_headers)
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "in_progress"

    monkeypatch.setattr(progress_module, "_progress_row", flaky_once())
    complete = await client.post(
        f"/api/steps/{lecture.id}/complete", headers=course.student_headers
    )
    assert complete.status_code == 200, complete.text
    assert complete.json()["status"] == "completed"
