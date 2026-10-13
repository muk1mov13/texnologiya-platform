from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.learning.models import StepKind
from tests.factories import (
    add_activity,
    auth_headers,
    build_course,
    crossword_payload,
    make_user,
    quiz_payload,
    step_of,
    yesno_payload,
)


async def test_teacher_creates_quiz_on_review_step(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    body = await add_activity(
        client, course.teacher_headers, review.id, quiz_payload(), publish=False
    )
    assert body["type"] == "quiz"
    assert body["is_published"] is False
    assert body["order"] == 1
    assert body["layout"] is None
    assert [item["correct_index"] for item in body["items"]] == [0, 1]
    assert body["items"][0]["explanation"] == "1-izoh"

    listed = await client.get(
        f"/api/teach/steps/{review.id}/activities", headers=course.teacher_headers
    )
    assert [a["id"] for a in listed.json()] == [body["id"]]


async def test_activity_only_on_review_or_practice(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    response = await client.post(
        f"/api/teach/steps/{lecture.id}/activities",
        headers=course.teacher_headers,
        json=quiz_payload(),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "ACTIVITY_WRONG_STEP"


async def test_only_assigned_staff_can_edit(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    stranger = await make_user(db, email="begona@mail.uz", role=Role.teacher)
    url = f"/api/teach/steps/{review.id}/activities"
    denied = await client.post(url, headers=auth_headers(stranger, settings), json=quiz_payload())
    assert denied.status_code == 403
    assert denied.json()["code"] == "NOT_SUBJECT_TEACHER"
    student = await client.post(url, headers=course.student_headers, json=quiz_payload())
    assert student.status_code == 403
    assert student.json()["code"] == "FORBIDDEN"


async def test_quiz_needs_exactly_four_options(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    payload = quiz_payload()
    payload["items"][0]["options"] = ["A", "B", "C"]
    response = await client.post(
        f"/api/teach/steps/{review.id}/activities", headers=course.teacher_headers, json=payload
    )
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_crossword_layout_is_built_on_save(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    practice = await step_of(db, course.topic1, StepKind.practice)
    body = await add_activity(client, course.teacher_headers, practice.id, crossword_payload())
    layout = body["layout"]
    assert (layout["rows"], layout["cols"]) == (3, 9)
    words_by_id = {item["id"]: item["word"] for item in body["items"]}
    assert [("".join(w["cells"]), w["number"], w["direction"]) for w in layout["words"]] == [
        ("PAQ", 1, "down"),
        ("RCS", 2, "down"),
        ("TEU", 3, "down"),
        ("ABCDEFGHI", 4, "across"),
    ]
    assert all(words_by_id[w["word_id"]] == "".join(w["cells"]) for w in layout["words"])


async def test_crossword_word_errors(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    practice = await step_of(db, course.topic1, StepKind.practice)
    url = f"/api/teach/steps/{practice.id}/activities"
    headers = course.teacher_headers

    def payload(words: list[str]) -> dict[str, object]:
        return {
            "type": "crossword",
            "title": "K",
            "items": [{"word": w, "clue": "Savol"} for w in words],
        }

    invalid = await client.post(url, headers=headers, json=payload(["ab1", "abc", "abd"]))
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "CROSSWORD_INVALID_WORD"
    assert invalid.json()["details"]["word"] == "ab1"

    unplaceable = await client.post(url, headers=headers, json=payload(["ABC", "DEF", "ABX"]))
    assert unplaceable.status_code == 422
    assert unplaceable.json()["code"] == "CROSSWORD_UNPLACEABLE"
    assert unplaceable.json()["details"]["words"] == ["DEF"]

    duplicate = await client.post(url, headers=headers, json=payload(["abc", "ABC", "cab"]))
    assert duplicate.status_code == 422
    assert duplicate.json()["code"] == "ACTIVITY_INVALID_ITEMS"

    too_short = await client.post(url, headers=headers, json=payload(["a", "ab", "ba"]))
    assert too_short.status_code == 422
    assert too_short.json()["code"] == "ACTIVITY_INVALID_ITEMS"


async def test_put_replaces_items_and_keeps_type(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    body = await add_activity(client, course.teacher_headers, review.id, quiz_payload(count=2))
    url = f"/api/teach/activities/{body['id']}"

    updated = await client.put(
        url, headers=course.teacher_headers, json=quiz_payload(title="Yangi", count=1)
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Yangi"
    assert len(updated.json()["items"]) == 1
    assert updated.json()["is_published"] is True

    wrong_type = await client.put(url, headers=course.teacher_headers, json=yesno_payload())
    assert wrong_type.status_code == 422
    assert wrong_type.json()["code"] == "ACTIVITY_INVALID_ITEMS"


async def test_publish_reorder_and_delete(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    first = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    second = await add_activity(client, course.teacher_headers, review.id, yesno_payload())
    assert second["order"] == 2

    order_url = f"/api/teach/steps/{review.id}/activities/order"
    reordered = await client.put(
        order_url, headers=course.teacher_headers, json={"ids": [second["id"], first["id"]]}
    )
    assert reordered.status_code == 200
    assert [(a["id"], a["order"]) for a in reordered.json()] == [
        (second["id"], 1),
        (first["id"], 2),
    ]
    bad = await client.put(order_url, headers=course.teacher_headers, json={"ids": [first["id"]]})
    assert bad.status_code == 400
    assert bad.json()["code"] == "INVALID_ORDER"

    hidden = await client.patch(
        f"/api/teach/activities/{first['id']}",
        headers=course.teacher_headers,
        json={"is_published": False},
    )
    assert hidden.json()["is_published"] is False

    deleted = await client.delete(
        f"/api/teach/activities/{first['id']}", headers=course.teacher_headers
    )
    assert deleted.status_code == 204
    missing = await client.delete(
        f"/api/teach/activities/{first['id']}", headers=course.teacher_headers
    )
    assert missing.status_code == 404
    assert missing.json()["code"] == "ACTIVITY_NOT_FOUND"
