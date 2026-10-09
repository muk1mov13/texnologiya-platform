from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from tests.factories import auth_headers, make_subject, make_topic, make_user


@pytest.fixture
async def topic_ctx(db: AsyncSession, settings: Settings) -> dict[str, Any]:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    subject = await make_subject(db, teachers=[teacher])
    topic = await make_topic(db, subject)
    other_topic = await make_topic(db, subject, title="2-mavzu")
    return {
        "headers": auth_headers(teacher, settings),
        "base": f"/api/teach/topics/{topic.id}",
        "other_base": f"/api/teach/topics/{other_topic.id}",
    }


async def test_glossary_crud(client: AsyncClient, topic_ctx: dict[str, Any]) -> None:
    headers, base = topic_ctx["headers"], topic_ctx["base"]
    first = await client.post(
        f"{base}/glossary", headers=headers, json={"term": "Kasb", "definition": "Mehnat turi"}
    )
    second = await client.post(
        f"{base}/glossary", headers=headers, json={"term": "Texnika", "definition": "Asboblar"}
    )
    assert first.status_code == 201, first.text
    assert (first.json()["order"], second.json()["order"]) == (1, 2)

    term_id = first.json()["id"]
    updated = await client.patch(
        f"{base}/glossary/{term_id}", headers=headers, json={"definition": "Faoliyat turi"}
    )
    assert updated.json()["definition"] == "Faoliyat turi"
    assert updated.json()["term"] == "Kasb"

    deleted = await client.delete(f"{base}/glossary/{term_id}", headers=headers)
    assert deleted.status_code == 204
    listed = await client.get(f"{base}/glossary", headers=headers)
    assert [t["term"] for t in listed.json()] == ["Texnika"]


async def test_glossary_rejects_whitespace_only_term(
    client: AsyncClient, topic_ctx: dict[str, Any]
) -> None:
    headers, base = topic_ctx["headers"], topic_ctx["base"]
    response = await client.post(
        f"{base}/glossary", headers=headers, json={"term": "   ", "definition": "Mehnat turi"}
    )
    assert response.status_code == 422


async def test_glossary_term_of_other_topic_is_404(
    client: AsyncClient, topic_ctx: dict[str, Any]
) -> None:
    headers = topic_ctx["headers"]
    created = await client.post(
        f"{topic_ctx['base']}/glossary", headers=headers, json={"term": "A", "definition": "B"}
    )
    response = await client.patch(
        f"{topic_ctx['other_base']}/glossary/{created.json()['id']}",
        headers=headers,
        json={"term": "X"},
    )
    assert response.status_code == 404
    assert response.json()["code"] == "GLOSSARY_TERM_NOT_FOUND"


async def test_literature_crud_and_validation(
    client: AsyncClient, topic_ctx: dict[str, Any]
) -> None:
    headers, base = topic_ctx["headers"], topic_ctx["base"]
    created = await client.post(
        f"{base}/literature",
        headers=headers,
        json={"title": "Kasb-hunar ta'limi", "author": "Ismoilov R.", "year": 2021,
              "url": "https://lex.uz/doc"},
    )  # fmt: skip
    assert created.status_code == 201, created.text
    item_id = created.json()["id"]

    bad_year = await client.post(
        f"{base}/literature", headers=headers, json={"title": "Eski", "year": 1500}
    )
    assert bad_year.status_code == 422
    bad_url = await client.post(
        f"{base}/literature", headers=headers, json={"title": "X", "url": "ftp://x"}
    )
    assert bad_url.status_code == 422

    cleared = await client.patch(
        f"{base}/literature/{item_id}", headers=headers, json={"url": None}
    )
    assert cleared.json()["url"] is None
    assert cleared.json()["title"] == "Kasb-hunar ta'limi"

    missing = await client.delete(f"{base}/literature/9999", headers=headers)
    assert missing.status_code == 404
    assert missing.json()["code"] == "LITERATURE_NOT_FOUND"


async def test_students_cannot_edit_glossary(
    client: AsyncClient, db: AsyncSession, settings: Settings, topic_ctx: dict[str, Any]
) -> None:
    student = await make_user(db, email="talaba@mail.uz")
    response = await client.post(
        f"{topic_ctx['base']}/glossary",
        headers=auth_headers(student, settings),
        json={"term": "A", "definition": "B"},
    )
    assert response.status_code == 403
