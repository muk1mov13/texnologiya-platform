from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.learning.models import StepKind
from tests.factories import (
    add_activity,
    build_course,
    crossword_payload,
    quiz_payload,
    step_of,
    yesno_payload,
)

FORBIDDEN_KEYS = {"correct_index", "answer", "cells", "word", "word_id", "explanation"}


def _all_keys(value: object) -> set[str]:
    if isinstance(value, dict):
        return set(value) | set().union(*(_all_keys(v) for v in value.values()))
    if isinstance(value, list):
        return set().union(*(_all_keys(v) for v in value))
    return set()


async def test_published_activity_counts_as_step_content(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    draft = await add_activity(
        client, course.teacher_headers, review.id, quiz_payload(), publish=False
    )
    topic_url = f"/api/topics/{course.topic1.id}"
    before = (await client.get(topic_url, headers=course.student_headers)).json()
    assert before["progress"] == {"completed": 0, "total": 2}

    await client.patch(
        f"/api/teach/activities/{draft['id']}",
        headers=course.teacher_headers,
        json={"is_published": True},
    )
    after = (await client.get(topic_url, headers=course.student_headers)).json()
    assert after["progress"] == {"completed": 0, "total": 3}
    review_brief = next(s for s in after["steps"] if s["kind"] == "review")
    assert review_brief["has_content"] is True


async def test_step_content_shows_published_activities_without_answers(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    practice = await step_of(db, course.topic1, StepKind.practice)
    await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    await add_activity(client, course.teacher_headers, review.id, yesno_payload())
    await add_activity(
        client, course.teacher_headers, review.id, quiz_payload(title="Qoralama"), publish=False
    )
    await add_activity(client, course.teacher_headers, practice.id, crossword_payload())

    review_body = (
        await client.get(f"/api/steps/{review.id}", headers=course.student_headers)
    ).json()
    assert [a["type"] for a in review_body["activities"]] == ["quiz", "yesno"]
    quiz = review_body["activities"][0]
    assert quiz["items"][0] == {"text": "1-savol", "options": ["A", "B", "C", "D"]}
    assert (quiz["best_percent"], quiz["attempts_count"], quiz["layout"]) == (None, 0, None)
    assert review_body["activities"][1]["items"][1] == {"statement": "Quyosh sovuq"}
    assert review_body["task"] is None and review_body["submission"] is None

    practice_body = (
        await client.get(f"/api/steps/{practice.id}", headers=course.student_headers)
    ).json()
    crossword = practice_body["activities"][0]
    assert crossword["items"] == []
    assert crossword["layout"]["rows"] == 3 and crossword["layout"]["cols"] == 9
    assert [
        (w["number"], w["direction"], w["length"], w["clue"]) for w in crossword["layout"]["words"]
    ] == [
        (1, "down", 3, "Birinchi so'z"),
        (2, "down", 3, "Ikkinchi so'z"),
        (3, "down", 3, "Uchinchi so'z"),
        (4, "across", 9, "Alifbo boshi"),
    ]

    for body in (review_body, practice_body):
        assert not (_all_keys(body) & FORBIDDEN_KEYS)


async def test_other_steps_have_empty_assessment_fields(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    body = (await client.get(f"/api/steps/{lecture.id}", headers=course.student_headers)).json()
    assert (body["activities"], body["task"], body["submission"]) == ([], None, None)
