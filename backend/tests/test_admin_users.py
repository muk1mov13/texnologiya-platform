from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User, UserStatus
from app.core.config import Settings
from tests.factories import DEFAULT_PASSWORD, auth_headers, make_user


async def make_admin(db: AsyncSession) -> User:
    return await make_user(db, email="admin@mail.uz", role=Role.admin, full_name="Admin")


async def test_list_filters_by_status_and_search(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    admin = await make_admin(db)
    await make_user(db, email="p1@mail.uz", status=UserStatus.pending, full_name="Karim Aliyev")
    await make_user(db, email="p2@mail.uz", status=UserStatus.pending, full_name="Dilnoza Rahimova")
    await make_user(db, email="a1@mail.uz", status=UserStatus.active)
    headers = auth_headers(admin, settings)

    pending = await client.get("/api/admin/users?status=pending", headers=headers)
    assert pending.status_code == 200
    assert {u["email"] for u in pending.json()} == {"p1@mail.uz", "p2@mail.uz"}

    found = await client.get("/api/admin/users?q=karim", headers=headers)
    assert [u["email"] for u in found.json()] == ["p1@mail.uz"]


async def test_non_admin_is_forbidden(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher = await make_user(db, role=Role.teacher)
    response = await client.get("/api/admin/users", headers=auth_headers(teacher, settings))
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


async def test_approve_and_promote_user(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    admin = await make_admin(db)
    user = await make_user(db, status=UserStatus.pending)
    response = await client.patch(
        f"/api/admin/users/{user.id}",
        headers=auth_headers(admin, settings),
        json={"status": "active", "role": "teacher"},
    )
    assert response.status_code == 200
    assert (response.json()["status"], response.json()["role"]) == ("active", "teacher")


async def test_blocking_revokes_sessions(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    admin = await make_admin(db)
    user = await make_user(db)
    login = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    raw = login.cookies["refresh_token"]
    response = await client.patch(
        f"/api/admin/users/{user.id}",
        headers=auth_headers(admin, settings),
        json={"status": "blocked"},
    )
    assert response.status_code == 200
    client.cookies.clear()
    refreshed = await client.post("/api/auth/refresh", headers={"Cookie": f"refresh_token={raw}"})
    assert refreshed.status_code == 401


async def test_admin_cannot_modify_self(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    admin = await make_admin(db)
    response = await client.patch(
        f"/api/admin/users/{admin.id}",
        headers=auth_headers(admin, settings),
        json={"role": "student"},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "CANNOT_MODIFY_SELF"


async def test_unknown_user_is_404(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    admin = await make_admin(db)
    response = await client.patch(
        "/api/admin/users/9999", headers=auth_headers(admin, settings), json={"status": "active"}
    )
    assert response.status_code == 404
    assert response.json()["code"] == "USER_NOT_FOUND"


async def test_out_of_range_user_id_is_422(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    admin = await make_admin(db)
    response = await client.patch(
        "/api/admin/users/99999999999999999999",
        headers=auth_headers(admin, settings),
        json={"status": "active"},
    )
    assert response.status_code == 422


async def test_temp_password_replaces_old_one(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    admin = await make_admin(db)
    user = await make_user(db)
    response = await client.post(
        f"/api/admin/users/{user.id}/temp-password", headers=auth_headers(admin, settings)
    )
    assert response.status_code == 200
    temp = response.json()["temp_password"]
    assert len(temp) == 10

    old = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    assert old.status_code == 401
    new = await client.post("/api/auth/login", json={"email": "ali@mail.uz", "password": temp})
    assert new.status_code == 200
