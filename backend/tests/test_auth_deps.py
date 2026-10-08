from typing import Annotated

from fastapi import Depends, FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import ActiveUser, require_role
from app.auth.models import Role, User, UserStatus
from app.core.config import Settings
from tests.factories import auth_headers, make_user


async def test_active_user_dependency_rejects_pending(
    app: FastAPI, client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    async def only_active(user: ActiveUser) -> dict[str, int]:
        return {"id": user.id}

    app.add_api_route("/api/_active", only_active)
    pending = await make_user(db, status=UserStatus.pending)
    response = await client.get("/api/_active", headers=auth_headers(pending, settings))
    assert response.status_code == 403
    assert response.json()["code"] == "ACCOUNT_PENDING"


async def test_require_role_checks_role(
    app: FastAPI, client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    async def teachers_only(
        user: Annotated[User, Depends(require_role(Role.teacher))],
    ) -> dict[str, int]:
        return {"id": user.id}

    app.add_api_route("/api/_teachers", teachers_only)
    student = await make_user(db, email="talaba@mail.uz")
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)

    denied = await client.get("/api/_teachers", headers=auth_headers(student, settings))
    assert denied.status_code == 403
    assert denied.json()["code"] == "FORBIDDEN"
    allowed = await client.get("/api/_teachers", headers=auth_headers(teacher, settings))
    assert allowed.status_code == 200
