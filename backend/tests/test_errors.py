from fastapi import FastAPI
from httpx import AsyncClient
from pydantic import BaseModel

from app.core.errors import AppError


class Payload(BaseModel):
    n: int


async def test_app_error_has_uniform_shape(app: FastAPI, client: AsyncClient) -> None:
    async def boom() -> None:
        raise AppError(404, "TOPIC_NOT_FOUND", "Mavzu topilmadi")

    app.add_api_route("/api/_boom", boom)
    response = await client.get("/api/_boom")
    assert response.status_code == 404
    assert response.json() == {
        "code": "TOPIC_NOT_FOUND",
        "message": "Mavzu topilmadi",
        "details": {},
    }
    assert response.headers["x-request-id"]


async def test_validation_error_lists_fields(app: FastAPI, client: AsyncClient) -> None:
    async def echo(payload: Payload) -> dict[str, int]:
        return {"n": payload.n}

    app.add_api_route("/api/_echo", echo, methods=["POST"])
    response = await client.post("/api/_echo", json={"n": "abc"})
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"]["fields"][0]["loc"] == ["body", "n"]


async def test_unknown_route_is_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


async def test_unexpected_error_hides_details(app: FastAPI, client: AsyncClient) -> None:
    async def crash() -> None:
        raise RuntimeError("secret internals")

    app.add_api_route("/api/_crash", crash)
    response = await client.get("/api/_crash")
    assert response.status_code == 500
    body = response.json()
    assert body["code"] == "INTERNAL_ERROR"
    assert "secret" not in response.text
    assert body["details"]["request_id"] == response.headers["x-request-id"]
