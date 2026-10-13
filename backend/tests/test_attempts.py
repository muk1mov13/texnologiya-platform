from typing import Any

from httpx import AsyncClient, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.learning.models import ProgressStatus, StepKind, StepProgress
from tests.factories import (
    add_activity,
    build_course,
    crossword_payload,
    quiz_payload,
    step_of,
    yesno_payload,
)


async def _attempt(
    client: AsyncClient, headers: dict[str, str], activity_id: int, answers: list[Any]
) -> Response:
    return await client.post(
        f"/api/activities/{activity_id}/attempts", headers=headers, json={"answers": answers}
    )


async def _progress(db: AsyncSession, user_id: int, step_id: int) -> StepProgress:
    row = await db.scalar(
        select(StepProgress).where(StepProgress.user_id == user_id, StepProgress.step_id == step_id)
    )
    assert row is not None
    return row


async def test_quiz_attempt_is_graded_with_full_review(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())

    response = await _attempt(client, course.student_headers, quiz["id"], [0, 2])
    assert response.status_code == 201, response.text
    body = response.json()
    assert (body["score"], body["max_score"]) == (1, 2)
    first, second = body["result"]
    assert first == {
        "prompt": "1-savol",
        "options": ["A", "B", "C", "D"],
        "given": 0,
        "correct": 0,
        "is_correct": True,
        "explanation": "1-izoh",
    }
    assert (second["given"], second["correct"], second["is_correct"]) == (2, 1, False)
    assert body["rewards"]["xp"] == 15
    assert [b["code"] for b in body["rewards"]["new_badges"]] == ["first_step"]
    assert body["step"]["status"] == "completed"  # bosqichda bitta faoliyat


async def test_retake_gives_no_xp_but_improves_best_score(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())

    first = (await _attempt(client, course.student_headers, quiz["id"], [0, 2])).json()
    second = (await _attempt(client, course.student_headers, quiz["id"], [0, 1])).json()
    third = (await _attempt(client, course.student_headers, quiz["id"], [0, 1])).json()
    assert [first["rewards"]["xp"], second["rewards"]["xp"], third["rewards"]["xp"]] == [15, 10, 0]
    assert [b["code"] for b in second["rewards"]["new_badges"]] == ["perfect_1"]

    row = await _progress(db, course.student.id, review.id)
    assert row.best_score == 100.0
    content = (await client.get(f"/api/steps/{review.id}", headers=course.student_headers)).json()
    activity = content["activities"][0]
    assert (activity["best_percent"], activity["attempts_count"]) == (100.0, 3)


async def test_step_completes_when_every_activity_is_attempted(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    yesno = await add_activity(client, course.teacher_headers, review.id, yesno_payload())

    after_quiz = (await _attempt(client, course.student_headers, quiz["id"], [0, 1])).json()
    assert after_quiz["step"]["status"] == "in_progress"
    after_yesno = (await _attempt(client, course.student_headers, yesno["id"], [True, True])).json()
    assert (after_yesno["score"], after_yesno["max_score"]) == (1, 2)
    assert after_yesno["step"]["status"] == "completed"

    row = await _progress(db, course.student.id, review.id)
    assert row.status == ProgressStatus.completed
    assert row.best_score == 75.0


async def test_invalid_answers_are_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    for answers in ([0], [0, 1, 2], [True, 0], [0, 4], ["A", 0]):
        response = await _attempt(client, course.student_headers, quiz["id"], answers)
        assert response.status_code == 422, answers
        assert response.json()["code"] == "ATTEMPT_INVALID_ANSWERS"


async def test_hidden_activities_are_not_found(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    draft = await add_activity(
        client, course.teacher_headers, review.id, quiz_payload(), publish=False
    )
    hidden_review = await step_of(db, course.hidden_topic, StepKind.review)
    hidden = await add_activity(client, course.teacher_headers, hidden_review.id, quiz_payload())
    for activity_id in (draft["id"], hidden["id"], 999_999):
        response = await _attempt(client, course.student_headers, activity_id, [0, 1])
        assert response.status_code == 404
        assert response.json()["code"] == "ACTIVITY_NOT_FOUND"


async def test_crossword_attempt_normalizes_answers(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    practice = await step_of(db, course.topic1, StepKind.practice)
    crossword = await add_activity(client, course.teacher_headers, practice.id, crossword_payload())

    partial = (
        await _attempt(client, course.student_headers, crossword["id"], ["paq", "", None, "x"])
    ).json()
    assert (partial["score"], partial["max_score"]) == (1, 4)
    assert partial["result"][0]["prompt"] == "Birinchi so'z"
    assert partial["result"][3]["correct"] == "ABCDEFGHI"

    answers = ["paq", "Rcs", "TEU", "abcdefghi"]
    full = (await _attempt(client, course.student_headers, crossword["id"], answers)).json()
    assert (full["score"], full["max_score"]) == (4, 4)
    assert full["rewards"]["xp"] == 10  # faqat 100% bonusi; activity_completed avval berilgan


async def test_completing_last_step_awards_topic_xp(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic2, StepKind.lecture)  # topic2: yagona kontentli bosqich
    url = f"/api/steps/{lecture.id}/complete"
    first = (await client.post(url, headers=course.student_headers)).json()
    assert first["status"] == "completed"
    assert first["rewards"]["xp"] == 60
    assert [b["code"] for b in first["rewards"]["new_badges"]] == ["first_step", "first_topic"]
    again = (await client.post(url, headers=course.student_headers)).json()
    assert again["rewards"] == {"xp": 0, "new_badges": []}
