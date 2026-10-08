from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import UserStatus
from tests.factories import DEFAULT_PASSWORD, make_user

REGISTER = {
    "email": "Ali@Mail.uz",
    "password": "parol1234",
    "full_name": "Ali Valiyev",
    "phone": "+998901234567",
}


async def test_register_creates_pending_student(client: AsyncClient) -> None:
    response = await client.post("/api/auth/register", json=REGISTER)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["email"] == "ali@mail.uz"
    assert (body["role"], body["status"], body["locale"]) == ("student", "pending", "uz")
    assert "password_hash" not in body


async def test_register_rejects_duplicate_email_case_insensitive(client: AsyncClient) -> None:
    await client.post("/api/auth/register", json=REGISTER)
    response = await client.post("/api/auth/register", json={**REGISTER, "email": "ALI@mail.uz"})
    assert response.status_code == 409
    assert response.json()["code"] == "EMAIL_TAKEN"


async def test_register_rejects_short_password(client: AsyncClient) -> None:
    response = await client.post("/api/auth/register", json={**REGISTER, "password": "123"})
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_login_returns_access_token_and_refresh_cookie(
    client: AsyncClient, db: AsyncSession
) -> None:
    await make_user(db)
    response = await client.post(
        "/api/auth/login", json={"email": "ALI@mail.uz", "password": DEFAULT_PASSWORD}
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "ali@mail.uz"
    cookie = response.headers["set-cookie"]
    assert "refresh_token=" in cookie
    assert "HttpOnly" in cookie
    assert "Path=/api/auth" in cookie


async def test_login_with_wrong_password(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db)
    response = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": "noto-g-ri"}
    )
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


async def test_login_blocked_user(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db, status=UserStatus.blocked)
    response = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    assert response.status_code == 403
    assert response.json()["code"] == "ACCOUNT_BLOCKED"


async def test_pending_user_can_login_to_see_waiting_screen(
    client: AsyncClient, db: AsyncSession
) -> None:
    await make_user(db, status=UserStatus.pending)
    response = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    assert response.status_code == 200
    assert response.json()["user"]["status"] == "pending"


async def test_login_is_rate_limited_after_failures(client: AsyncClient, db: AsyncSession) -> None:
    await make_user(db)
    for _ in range(3):  # conftest: login_rate_limit=3
        response = await client.post(
            "/api/auth/login", json={"email": "ali@mail.uz", "password": "noto-g-ri"}
        )
        assert response.status_code == 401
    response = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    assert response.status_code == 429
    assert response.json()["code"] == "TOO_MANY_ATTEMPTS"
