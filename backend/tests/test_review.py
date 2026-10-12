from typing import Any

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.gamification.models import XpEvent
from app.learning.models import StepKind
from tests.factories import Course, auth_headers, build_course, make_pdf_bytes, make_user, step_of


async def _submitted(
    client: AsyncClient, db: AsyncSession, course: Course
) -> tuple[dict[str, Any], dict[str, Any]]:
    step = await step_of(db, course.topic1, StepKind.task)
    task = (
        await client.put(
            f"/api/teach/steps/{step.id}/task",
            headers=course.teacher_headers,
            json={"title": "Esse", "description": "Yozing", "type": "both", "max_score": 10},
        )
    ).json()
    response = await client.put(
        f"/api/tasks/{task['id']}/submission",
        headers=course.student_headers,
        data={"text": "Javobim"},
        files={"file": ("javob.pdf", make_pdf_bytes(1), "application/pdf")},
    )
    assert response.status_code == 200, response.text
    return task, response.json()["submission"]


async def test_queue_lists_submissions_of_assigned_subjects(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _task, submission = await _submitted(client, db, course)

    queue = await client.get("/api/teach/submissions", headers=course.teacher_headers)
    assert queue.status_code == 200
    [item] = queue.json()
    assert item["id"] == submission["id"]
    assert (item["student_name"], item["task_title"], item["topic_title"]) == (
        "Dilnoza Karimova",
        "Esse",
        "1-mavzu",
    )
    assert item["is_late"] is False

    stranger = await make_user(db, email="begona@mail.uz", role=Role.teacher)
    stranger_headers = auth_headers(stranger, settings)
    assert (await client.get("/api/teach/submissions", headers=stranger_headers)).json() == []
    detail_url = f"/api/teach/submissions/{submission['id']}"
    hidden = await client.get(detail_url, headers=stranger_headers)
    assert hidden.status_code == 404
    assert hidden.json()["code"] == "SUBMISSION_NOT_FOUND"

    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)
    admin_queue = await client.get("/api/teach/submissions", headers=auth_headers(admin, settings))
    assert len(admin_queue.json()) == 1

    summary = await client.get("/api/teach/summary", headers=course.teacher_headers)
    assert summary.json() == {"pending_submissions": 1}


async def test_detail_and_file_for_teacher(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _task, submission = await _submitted(client, db, course)
    detail = (
        await client.get(
            f"/api/teach/submissions/{submission['id']}", headers=course.teacher_headers
        )
    ).json()
    assert (detail["text"], detail["original_name"], detail["max_score"]) == (
        "Javobim",
        "javob.pdf",
        10,
    )
    assert detail["task_description"] == "Yozing"
    file = await client.get(detail["file_url"], headers=course.teacher_headers)
    assert file.status_code == 200
    assert file.content.startswith(b"%PDF-")


async def test_grading_finalizes_and_rewards_student(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    task, submission = await _submitted(client, db, course)
    url = f"/api/teach/submissions/{submission['id']}"
    headers = course.teacher_headers

    for score in (11, -1):
        bad = await client.post(f"{url}/grade", headers=headers, json={"score": score})
        assert bad.status_code == 422
        assert bad.json()["code"] == "SCORE_OUT_OF_RANGE"

    graded = await client.post(
        f"{url}/grade", headers=headers, json={"score": 8, "feedback": " Yaxshi "}
    )
    assert graded.status_code == 200
    assert (graded.json()["status"], graded.json()["score"], graded.json()["feedback"]) == (
        "graded",
        8,
        "Yaxshi",
    )
    event = await db.scalar(
        select(XpEvent).where(XpEvent.user_id == course.student.id, XpEvent.reason == "task_graded")
    )
    assert event is not None and event.amount == 24

    again = await client.post(f"{url}/grade", headers=headers, json={"score": 9})
    assert again.status_code == 409
    assert again.json()["code"] == "SUBMISSION_NOT_SUBMITTED"
    edit = await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, data={"text": "x"}
    )
    assert edit.status_code == 409

    step_id = (await step_of(db, course.topic1, StepKind.task)).id
    content = (await client.get(f"/api/steps/{step_id}", headers=course.student_headers)).json()
    assert (content["submission"]["status"], content["submission"]["score"]) == ("graded", 8)
    assert (await client.get("/api/teach/submissions", headers=headers)).json() == []


async def test_return_and_resubmit(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    task, submission = await _submitted(client, db, course)
    url = f"/api/teach/submissions/{submission['id']}"
    headers = course.teacher_headers

    empty = await client.post(f"{url}/return", headers=headers, json={"feedback": " "})
    assert empty.status_code == 422
    assert empty.json()["code"] == "VALIDATION_ERROR"
    returned = await client.post(
        f"{url}/return", headers=headers, json={"feedback": "Manba qo'shing"}
    )
    assert returned.json()["status"] == "returned"
    twice = await client.post(f"{url}/return", headers=headers, json={"feedback": "x"})
    assert twice.status_code == 409
    not_resubmitted = await client.post(f"{url}/grade", headers=headers, json={"score": 5})
    assert not_resubmitted.status_code == 409

    resubmitted = await client.put(
        f"/api/tasks/{task['id']}/submission",
        headers=course.student_headers,
        data={"text": "Tuzatdim"},
    )
    assert resubmitted.json()["submission"]["status"] == "submitted"
    assert resubmitted.json()["submission"]["feedback"] == "Manba qo'shing"
    graded = await client.post(f"{url}/grade", headers=headers, json={"score": 10})
    assert graded.status_code == 200
