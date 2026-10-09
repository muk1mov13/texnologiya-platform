from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from tests.factories import DEFAULT_PASSWORD, auth_headers, make_user


async def test_me_returns_current_user(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    user = await make_user(db)
    response = await client.get("/api/me", headers=auth_headers(user, settings))
    assert response.status_code == 200
    assert response.json()["email"] == "ali@mail.uz"


async def test_me_requires_token(client: AsyncClient) -> None:
    response = await client.get("/api/me")
    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_me_rejects_garbage_token(client: AsyncClient) -> None:
    response = await client.get("/api/me", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"


async def test_update_me_changes_name_and_locale(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    user = await make_user(db)
    headers = auth_headers(user, settings)
    response = await client.patch(
        "/api/me", headers=headers, json={"full_name": "Ali Karimov", "locale": "ru"}
    )
    assert response.status_code == 200
    assert (response.json()["full_name"], response.json()["locale"]) == ("Ali Karimov", "ru")
    response = await client.patch("/api/me", headers=headers, json={"full_name": None})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Ali Karimov"


async def test_change_password_revokes_sessions(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    user = await make_user(db)
    login = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    raw = login.cookies["refresh_token"]
    headers = auth_headers(user, settings)

    wrong = await client.post(
        "/api/me/password",
        headers=headers,
        json={"current_password": "noto-g-ri", "new_password": "yangiparol1"},
    )
    assert wrong.status_code == 400
    assert wrong.json()["code"] == "WRONG_PASSWORD"

    ok = await client.post(
        "/api/me/password",
        headers=headers,
        json={"current_password": DEFAULT_PASSWORD, "new_password": "yangiparol1"},
    )
    assert ok.status_code == 204

    client.cookies.clear()
    stale = await client.post("/api/auth/refresh", headers={"Cookie": f"refresh_token={raw}"})
    assert stale.status_code == 401
    relogin = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": "yangiparol1"}
    )
    assert relogin.status_code == 200
