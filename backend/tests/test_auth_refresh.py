from datetime import timedelta

from httpx import AsyncClient, Response
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshSession, User, UserStatus
from app.core.types import utcnow
from tests.factories import DEFAULT_PASSWORD, make_user


async def login_raw_refresh(client: AsyncClient, db: AsyncSession) -> str:
    await make_user(db)
    response = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    assert response.status_code == 200, response.text
    return response.cookies["refresh_token"]


async def refresh(client: AsyncClient, raw: str) -> Response:
    client.cookies.clear()
    return await client.post("/api/auth/refresh", headers={"Cookie": f"refresh_token={raw}"})


async def test_refresh_rotates_token(client: AsyncClient, db: AsyncSession) -> None:
    raw = await login_raw_refresh(client, db)
    response = await refresh(client, raw)
    assert response.status_code == 200, response.text
    assert response.json()["access_token"]
    assert response.cookies["refresh_token"] != raw


async def test_reused_refresh_token_revokes_all_sessions(
    client: AsyncClient, db: AsyncSession
) -> None:
    first = await login_raw_refresh(client, db)
    second = (await refresh(client, first)).cookies["refresh_token"]
    reused = await refresh(client, first)
    assert reused.status_code == 401
    assert reused.json()["code"] == "REFRESH_REUSED"
    after_theft = await refresh(client, second)
    assert after_theft.status_code == 401


async def test_refresh_without_cookie(client: AsyncClient) -> None:
    response = await client.post("/api/auth/refresh")
    assert response.status_code == 401
    assert response.json()["code"] == "NO_REFRESH_TOKEN"


async def test_expired_refresh_token(client: AsyncClient, db: AsyncSession) -> None:
    raw = await login_raw_refresh(client, db)
    await db.execute(update(RefreshSession).values(expires_at=utcnow() - timedelta(seconds=1)))
    await db.commit()
    response = await refresh(client, raw)
    assert response.status_code == 401
    assert response.json()["code"] == "REFRESH_EXPIRED"


async def test_blocked_user_cannot_refresh(client: AsyncClient, db: AsyncSession) -> None:
    raw = await login_raw_refresh(client, db)
    await db.execute(update(User).values(status=UserStatus.blocked))
    await db.commit()
    response = await refresh(client, raw)
    assert response.status_code == 403
    assert response.json()["code"] == "ACCOUNT_BLOCKED"


async def test_logout_revokes_session_and_clears_cookie(
    client: AsyncClient, db: AsyncSession
) -> None:
    raw = await login_raw_refresh(client, db)
    client.cookies.clear()
    response = await client.post("/api/auth/logout", headers={"Cookie": f"refresh_token={raw}"})
    assert response.status_code == 204
    assert 'refresh_token=""' in response.headers["set-cookie"]
    assert (await refresh(client, raw)).status_code == 401
