from datetime import timedelta

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.core.types import utcnow
from app.gamification.models import Streak
from app.gamification.service import local_date
from app.learning.models import StepKind
from tests.factories import (
    add_activity,
    auth_headers,
    build_course,
    make_user,
    quiz_payload,
    step_of,
)


async def test_dashboard_for_new_student(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    body = (await client.get("/api/me/dashboard", headers=course.student_headers)).json()
    assert body["xp_total"] == 0
    assert body["streak"] == {"current": 0, "longest": 0, "active_today": False}
    assert len(body["badges"]) == 10
    assert body["badges"][0]["code"] == "first_step"
    assert all(badge["awarded_at"] is None for badge in body["badges"])
    assert body["continue_step"]["topic_id"] == course.topic1.id


async def test_dashboard_after_learning(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic2, StepKind.lecture)
    await client.post(f"/api/steps/{lecture.id}/complete", headers=course.student_headers)
    body = (await client.get("/api/me/dashboard", headers=course.student_headers)).json()
    assert body["xp_total"] == 60
    assert body["streak"] == {"current": 1, "longest": 1, "active_today": True}
    awarded = {badge["code"] for badge in body["badges"] if badge["awarded_at"] is not None}
    assert awarded == {"first_step", "first_topic"}


async def test_dashboard_hides_broken_streak(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    db.add(
        Streak(
            user_id=course.student.id,
            current=5,
            longest=7,
            last_active_date=local_date(utcnow()) - timedelta(days=3),
        )
    )
    await db.commit()
    body = (await client.get("/api/me/dashboard", headers=course.student_headers)).json()
    assert body["streak"] == {"current": 0, "longest": 7, "active_today": False}


async def test_results_and_attempt_detail(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    for answers in ([0, 2], [0, 1]):
        await client.post(
            f"/api/activities/{quiz['id']}/attempts",
            headers=course.student_headers,
            json={"answers": answers},
        )
    task_step = await step_of(db, course.topic1, StepKind.task)
    task = (
        await client.put(
            f"/api/teach/steps/{task_step.id}/task",
            headers=course.teacher_headers,
            json={"title": "Esse", "description": "Yozing", "type": "text", "max_score": 10},
        )
    ).json()
    await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, data={"text": "J"}
    )

    results = (await client.get("/api/me/results", headers=course.student_headers)).json()
    [subject] = results
    assert subject["subject_slug"] == course.subject.slug
    [topic] = subject["topics"]
    assert topic["topic_id"] == course.topic1.id
    [activity] = topic["activities"]
    assert (activity["best_percent"], activity["attempts_count"]) == (100.0, 2)
    [task_result] = topic["tasks"]
    assert (task_result["status"], task_result["max_score"]) == ("submitted", 10)

    detail_url = f"/api/me/attempts/{activity['last_attempt_id']}"
    detail = (await client.get(detail_url, headers=course.student_headers)).json()
    assert (detail["score"], detail["max_score"], detail["activity_title"]) == (
        2,
        2,
        "Takrorlash testi",
    )
    assert len(detail["result"]) == 2
    other = await make_user(db, email="boshqa@mail.uz")
    denied = await client.get(detail_url, headers=auth_headers(other, settings))
    assert denied.status_code == 404
    assert denied.json()["code"] == "ATTEMPT_NOT_FOUND"


async def test_teacher_stats(client: AsyncClient, db: AsyncSession, settings: Settings) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic2, StepKind.lecture)
    await client.post(f"/api/steps/{lecture.id}/complete", headers=course.student_headers)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    await client.post(
        f"/api/activities/{quiz['id']}/attempts",
        headers=course.student_headers,
        json={"answers": [0, 2]},
    )

    url = f"/api/teach/stats?subject_id={course.subject.id}"
    stats = (await client.get(url, headers=course.teacher_headers)).json()
    by_topic = {row["topic_id"]: row for row in stats}
    assert len(stats) == 3  # o'qituvchi nashr qilinmagan mavzuni ham ko'radi
    topic1, topic2 = by_topic[course.topic1.id], by_topic[course.topic2.id]
    assert (topic2["started"], topic2["completed"], topic2["avg_best_percent"]) == (1, 1, None)
    assert (topic1["started"], topic1["completed"], topic1["avg_best_percent"]) == (1, 0, 50.0)
    assert topic1["pending_submissions"] == 0

    stranger = await make_user(db, email="begona@mail.uz", role=Role.teacher)
    denied = await client.get(url, headers=auth_headers(stranger, settings))
    assert denied.status_code == 403
    assert denied.json()["code"] == "NOT_SUBJECT_TEACHER"
