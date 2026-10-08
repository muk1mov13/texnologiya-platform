from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.learning import convert
from app.learning.models import StepKind
from tests.factories import (
    add_ready_pdf,
    auth_headers,
    make_pdf_bytes,
    make_subject,
    make_topic,
    make_user,
    step_of,
)

PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
Converter = Callable[..., Awaitable[Path]]


def fake_converter(pages: int = 3) -> Converter:
    async def _convert(
        source: Path,
        out_dir: Path,
        *,
        soffice: str,
        timeout: int,  # noqa: ASYNC109
    ) -> Path:
        output = out_dir / f"{source.stem}.pdf"
        output.write_bytes(make_pdf_bytes(pages))
        return output

    return _convert


@pytest.fixture
async def course(db: AsyncSession, settings: Settings) -> dict[str, Any]:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    subject = await make_subject(db, teachers=[teacher])
    topic = await make_topic(db, subject)
    return {
        "headers": auth_headers(teacher, settings),
        "topic_id": topic.id,
        "lecture_id": (await step_of(db, topic, StepKind.lecture)).id,
        "review_id": (await step_of(db, topic, StepKind.review)).id,
    }


async def upload_pptx(client: AsyncClient, course: dict[str, Any]) -> dict[str, Any]:
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=course["headers"],
        data={"title": "Taqdimot"},
        files={"file": ("slaydlar.pptx", b"PK fake pptx", PPTX_MIME)},
    )
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


async def lecture_materials(client: AsyncClient, course: dict[str, Any]) -> list[dict[str, Any]]:
    editor = await client.get(f"/api/teach/topics/{course['topic_id']}", headers=course["headers"])
    lecture = next(s for s in editor.json()["steps"] if s["kind"] == "lecture")
    materials: list[dict[str, Any]] = lecture["materials"]
    return materials


async def test_pdf_upload_is_ready_immediately(client: AsyncClient, course: dict[str, Any]) -> None:
    material = await add_ready_pdf(client, course["headers"], course["lecture_id"], pages=3)
    assert (material["status"], material["page_count"]) == ("ready", 3)
    assert material["original_name"] == "bayon.pdf"


async def test_upload_to_review_step_is_rejected(
    client: AsyncClient, course: dict[str, Any]
) -> None:
    response = await client.post(
        f"/api/teach/steps/{course['review_id']}/materials",
        headers=course["headers"],
        data={"title": "Test"},
        files={"file": ("a.pdf", make_pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "STEP_DOES_NOT_ACCEPT_FILES"


async def test_upload_rejects_unsupported_type(client: AsyncClient, course: dict[str, Any]) -> None:
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=course["headers"],
        data={"title": "Virus"},
        files={"file": ("virus.exe", b"MZ", "application/octet-stream")},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "UNSUPPORTED_FILE_TYPE"


async def test_upload_rejects_broken_pdf(client: AsyncClient, course: dict[str, Any]) -> None:
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=course["headers"],
        data={"title": "Buzuq"},
        files={"file": ("buzuq.pdf", b"not a pdf", "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_PDF"


async def test_pptx_is_converted_in_background(
    app: FastAPI, client: AsyncClient, course: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "convert_to_pdf", fake_converter(pages=4))
    uploaded = await upload_pptx(client, course)
    assert uploaded["status"] == "processing"
    await app.state.jobs.drain()
    [material] = await lecture_materials(client, course)
    assert (material["status"], material["page_count"]) == ("ready", 4)


async def test_conversion_retries_transient_failures(
    app: FastAPI, client: AsyncClient, course: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    attempts: list[int] = []

    async def flaky(
        source: Path,
        out_dir: Path,
        *,
        soffice: str,
        timeout: int,  # noqa: ASYNC109
    ) -> Path:
        attempts.append(1)
        if len(attempts) < 3:
            raise convert.ConversionError("CONVERSION_FAILED")
        return await fake_converter(1)(source, out_dir, soffice=soffice, timeout=timeout)

    monkeypatch.setattr(convert, "convert_to_pdf", flaky)
    await upload_pptx(client, course)
    await app.state.jobs.drain()
    [material] = await lecture_materials(client, course)
    assert material["status"] == "ready"
    assert len(attempts) == 3


async def test_missing_libreoffice_fails_then_retry_succeeds(
    app: FastAPI, client: AsyncClient, course: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    async def missing(
        source: Path,
        out_dir: Path,
        *,
        soffice: str,
        timeout: int,  # noqa: ASYNC109
    ) -> Path:
        raise convert.ConversionError("LIBREOFFICE_NOT_FOUND")

    monkeypatch.setattr(convert, "convert_to_pdf", missing)
    uploaded = await upload_pptx(client, course)
    await app.state.jobs.drain()
    [failed] = await lecture_materials(client, course)
    assert (failed["status"], failed["error"]) == ("failed", "LIBREOFFICE_NOT_FOUND")

    monkeypatch.setattr(convert, "convert_to_pdf", fake_converter(pages=2))
    retried = await client.post(
        f"/api/teach/materials/{uploaded['id']}/retry", headers=course["headers"]
    )
    assert retried.status_code == 200
    assert retried.json()["status"] == "processing"
    await app.state.jobs.drain()
    [ready] = await lecture_materials(client, course)
    assert (ready["status"], ready["error"]) == ("ready", None)


async def test_retry_requires_failed_status(client: AsyncClient, course: dict[str, Any]) -> None:
    material = await add_ready_pdf(client, course["headers"], course["lecture_id"])
    response = await client.post(
        f"/api/teach/materials/{material['id']}/retry", headers=course["headers"]
    )
    assert response.status_code == 400
    assert response.json()["code"] == "MATERIAL_NOT_FAILED"


async def test_delete_material_removes_files(
    client: AsyncClient, course: dict[str, Any], settings: Settings
) -> None:
    material = await add_ready_pdf(client, course["headers"], course["lecture_id"])
    media = Path(settings.media_root) / "materials"
    assert len(list(media.iterdir())) == 1
    response = await client.delete(
        f"/api/teach/materials/{material['id']}", headers=course["headers"]
    )
    assert response.status_code == 204
    assert list(media.iterdir()) == []
    assert await lecture_materials(client, course) == []


async def test_unassigned_teacher_cannot_upload(
    client: AsyncClient, db: AsyncSession, settings: Settings, course: dict[str, Any]
) -> None:
    other = await make_user(db, email="boshqa@mail.uz", role=Role.teacher)
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=auth_headers(other, settings),
        data={"title": "Bayon"},
        files={"file": ("a.pdf", make_pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "NOT_SUBJECT_TEACHER"
