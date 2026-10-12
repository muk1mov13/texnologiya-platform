from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Submission, SubmissionStatus
from app.core.config import Settings
from app.learning.models import StepKind, Topic
from tests.factories import Course, auth_headers, build_course, make_pdf_bytes, make_user, step_of

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"0" * 16


def task_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "title": "Esse",
        "description": "Kasb haqida esse yozing",
        "type": "both",
        "max_score": 10,
    }
    payload.update(overrides)
    return payload


async def _make_task(
    client: AsyncClient, db: AsyncSession, course: Course, topic: Topic, **overrides: Any
) -> tuple[int, dict[str, Any]]:
    step = await step_of(db, topic, StepKind.task)
    response = await client.put(
        f"/api/teach/steps/{step.id}/task",
        headers=course.teacher_headers,
        json=task_payload(**overrides),
    )
    assert response.status_code == 200, response.text
    body: dict[str, Any] = response.json()
    return step.id, body


async def test_teacher_creates_and_updates_task(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    empty_step = await step_of(db, course.topic2, StepKind.task)
    missing = await client.get(
        f"/api/teach/steps/{empty_step.id}/task", headers=course.teacher_headers
    )
    assert missing.status_code == 200 and missing.json() is None

    step_id, task = await _make_task(client, db, course, course.topic1)
    assert (task["type"], task["max_score"], task["deadline"]) == ("both", 10, None)
    _, again = await _make_task(client, db, course, course.topic1, title="Yangi esse")
    assert again["id"] == task["id"] and again["title"] == "Yangi esse"
    fetched = await client.get(f"/api/teach/steps/{step_id}/task", headers=course.teacher_headers)
    assert fetched.json()["title"] == "Yangi esse"

    lecture = await step_of(db, course.topic1, StepKind.lecture)
    wrong = await client.put(
        f"/api/teach/steps/{lecture.id}/task", headers=course.teacher_headers, json=task_payload()
    )
    assert wrong.status_code == 400
    assert wrong.json()["code"] == "TASK_WRONG_STEP"

    topic_url = f"/api/topics/{course.topic1.id}"
    topic = (await client.get(topic_url, headers=course.student_headers)).json()
    assert topic["progress"]["total"] == 3
    assert next(s for s in topic["steps"] if s["kind"] == "task")["has_content"] is True


async def test_text_submission_completes_step_and_awards_xp(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    step_id, task = await _make_task(client, db, course, course.topic1, type="text")
    url = f"/api/tasks/{task['id']}/submission"

    first = await client.put(url, headers=course.student_headers, data={"text": "Mening javobim"})
    assert first.status_code == 200, first.text
    body = first.json()
    submission = body["submission"]
    assert (submission["status"], submission["text"], submission["file_url"]) == (
        "submitted",
        "Mening javobim",
        None,
    )
    assert submission["is_late"] is False
    assert body["step"]["status"] == "completed"
    assert body["rewards"]["xp"] == 20
    assert [b["code"] for b in body["rewards"]["new_badges"]] == ["first_step", "first_task"]

    edited = (
        await client.put(url, headers=course.student_headers, data={"text": "Tuzatilgan"})
    ).json()
    assert edited["rewards"]["xp"] == 0
    content = (await client.get(f"/api/steps/{step_id}", headers=course.student_headers)).json()
    assert content["task"]["id"] == task["id"]
    assert content["submission"]["text"] == "Tuzatilgan"


async def test_submission_field_rules(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, text_task = await _make_task(client, db, course, course.topic1, type="text")
    _, file_task = await _make_task(client, db, course, course.topic2, type="file")
    text_url = f"/api/tasks/{text_task['id']}/submission"
    file_url = f"/api/tasks/{file_task['id']}/submission"
    pdf = ("javob.pdf", make_pdf_bytes(1), "application/pdf")

    cases: list[tuple[str, dict[str, str] | None, dict[str, Any] | None, str]] = [
        (text_url, {"text": "Javob"}, {"file": pdf}, "SUBMISSION_FIELD_NOT_ALLOWED"),
        (text_url, {"text": "   "}, None, "SUBMISSION_EMPTY"),
        (file_url, {"text": "Javob"}, {"file": pdf}, "SUBMISSION_FIELD_NOT_ALLOWED"),
        (file_url, None, None, "SUBMISSION_EMPTY"),
    ]
    for url, data, files, code in cases:
        response = await client.put(url, headers=course.student_headers, data=data, files=files)
        assert response.status_code == 422, (url, code, response.text)
        assert response.json()["code"] == code


async def test_file_submission_access_and_replacement(
    app: FastAPI, client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, task = await _make_task(client, db, course, course.topic1, type="file")
    url = f"/api/tasks/{task['id']}/submission"
    pdf = make_pdf_bytes(1)

    first = await client.put(
        url, headers=course.student_headers, files={"file": ("javob.pdf", pdf, "application/pdf")}
    )
    assert first.status_code == 200, first.text
    file_url = first.json()["submission"]["file_url"]
    own = await client.get(file_url, headers=course.student_headers)
    assert own.status_code == 200 and own.content == pdf
    other = await make_user(db, email="boshqa@mail.uz")
    denied = await client.get(file_url, headers=auth_headers(other, settings))
    assert denied.status_code == 404
    assert denied.json()["code"] == "SUBMISSION_NOT_FOUND"

    old_rel = await db.scalar(select(Submission.file).where(Submission.task_id == task["id"]))
    assert old_rel is not None
    second = await client.put(
        url, headers=course.student_headers, files={"file": ("rasm.png", PNG_BYTES, "image/png")}
    )
    assert second.status_code == 200
    assert second.json()["submission"]["original_name"] == "rasm.png"
    assert not app.state.storage.path(old_rel).exists()

    for name, content in (("rasm.png", pdf), ("virus.exe", b"MZ\x90\x00")):
        bad = await client.put(
            url, headers=course.student_headers, files={"file": (name, content, "image/png")}
        )
        assert bad.status_code == 400
        assert bad.json()["code"] == "UNSUPPORTED_FILE_TYPE"


async def test_late_submission_is_marked(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    deadline = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    _, task = await _make_task(client, db, course, course.topic1, type="text", deadline=deadline)
    response = await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, data={"text": "Kech"}
    )
    assert response.json()["submission"]["is_late"] is True


async def test_graded_submission_cannot_be_edited(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, task = await _make_task(client, db, course, course.topic1, type="text")
    url = f"/api/tasks/{task['id']}/submission"
    await client.put(url, headers=course.student_headers, data={"text": "Javob"})
    await db.execute(update(Submission).values(status=SubmissionStatus.graded, score=8))
    await db.commit()
    response = await client.put(url, headers=course.student_headers, data={"text": "Yangi"})
    assert response.status_code == 409
    assert response.json()["code"] == "SUBMISSION_GRADED"


async def test_hidden_task_is_not_found(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, hidden = await _make_task(client, db, course, course.hidden_topic, type="text")
    for task_id in (hidden["id"], 999_999):
        response = await client.put(
            f"/api/tasks/{task_id}/submission", headers=course.student_headers, data={"text": "x"}
        )
        assert response.status_code == 404
        assert response.json()["code"] == "TASK_NOT_FOUND"


async def test_deleting_task_or_topic_removes_submission_files(
    app: FastAPI, client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    storage = app.state.storage
    pdf = ("javob.pdf", make_pdf_bytes(1), "application/pdf")

    _, task = await _make_task(client, db, course, course.topic1, type="file")
    await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, files={"file": pdf}
    )
    rel = await db.scalar(select(Submission.file).where(Submission.task_id == task["id"]))
    assert rel is not None
    deleted = await client.delete(f"/api/teach/tasks/{task['id']}", headers=course.teacher_headers)
    assert deleted.status_code == 204
    assert not storage.path(rel).exists()
    assert await db.scalar(select(func.count()).select_from(Submission)) == 0

    _, task2 = await _make_task(client, db, course, course.topic2, type="file")
    await client.put(
        f"/api/tasks/{task2['id']}/submission", headers=course.student_headers, files={"file": pdf}
    )
    rel2 = await db.scalar(select(Submission.file).where(Submission.task_id == task2["id"]))
    assert rel2 is not None
    removed = await client.delete(
        f"/api/teach/topics/{course.topic2.id}", headers=course.teacher_headers
    )
    assert removed.status_code == 204
    assert not storage.path(rel2).exists()
