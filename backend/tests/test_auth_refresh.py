from datetime import timedelta

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, Response
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service
from app.auth.models import RefreshSession, User, UserStatus
from app.core.errors import AppError
from app.core.security import hash_token
from app.core.types import utcnow
from tests.factories import DEFAULT_PASSWORD, make_user


async def login_raw_refresh(client: AsyncClient, db: AsyncSession) -> str:
    await make_user(db)
    response = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    assert response.status_code == 200, response.text
    return response.cookies["refresh_token"]


async def login_again(client: AsyncClient) -> str:
    """Xuddi shu foydalanuvchi uchun ikkinchi, mustaqil sessiya (boshqa qurilma)."""
    client.cookies.clear()
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


async def test_reuse_within_grace_window_does_not_revoke_other_sessions(
    client: AsyncClient, db: AsyncSession
) -> None:
    """Parallel tablar yoki uzilgan sahifa yangilanishi: eski token rotatsiyadan
    so'ng darhol qayta kelsa, faqat shu so'rov 401 oladi, boshqa sessiyalar tirik."""
    first = await login_raw_refresh(client, db)
    other_device = await login_again(client)
    rotated = await refresh(client, first)
    assert rotated.status_code == 200, rotated.text
    second = rotated.cookies["refresh_token"]

    reused = await refresh(client, first)
    assert reused.status_code == 401
    assert reused.json()["code"] == "REFRESH_ROTATED"

    assert (await refresh(client, other_device)).status_code == 200
    assert (await refresh(client, second)).status_code == 200


async def test_reused_refresh_token_after_grace_window_revokes_all_sessions(
    client: AsyncClient, db: AsyncSession
) -> None:
    first = await login_raw_refresh(client, db)
    other_device = await login_again(client)
    second = (await refresh(client, first)).cookies["refresh_token"]
    await db.execute(
        update(RefreshSession)
        .where(RefreshSession.token_hash == hash_token(first))
        .values(revoked_at=utcnow() - timedelta(seconds=60))
    )
    await db.commit()

    reused = await refresh(client, first)
    assert reused.status_code == 401
    assert reused.json()["code"] == "REFRESH_REUSED"

    db.expire_all()
    active = await db.scalars(select(RefreshSession).where(RefreshSession.revoked_at.is_(None)))
    assert list(active) == []
    assert (await refresh(client, second)).status_code == 401
    assert (await refresh(client, other_device)).status_code == 401


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


async def test_concurrent_refresh_rotation_rejects_loser_without_revoking_all(
    client: AsyncClient,
    db: AsyncSession,
    app: FastAPI,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Ikki parallel refresh bir xil sessiyani bir vaqtda bekor qilmoqchi bo'lsa,
    faqat bittasi muvaffaqiyatli bo'lishi, ikkinchisi REFRESH_ROTATED olishi kerak
    (imtiyoz oynasi ichida: foydalanuvchining boshqa sessiyalari yopilmaydi).

    SQLite'da haqiqiy ikki tranzaksiyani asyncio.gather bilan deterministik tarzda
    poyga holatiga keltirish mumkin emas (fayl darajasidagi lock "database is
    locked" xatosiga olib kelishi mumkin), shuning uchun monkeypatch orqali
    SELECT va atomik UPDATE o'rtasidagi oynani simulyatsiya qilamiz: boshqa bir
    "parallel" sessiya shu oraliqda xuddi shu refresh sessiyasini bekor qiladi.
    """
    raw = await login_raw_refresh(client, db)
    other_device = await login_again(client)
    session_row = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_token(raw))
    )
    assert session_row is not None

    original_get = AsyncSession.get

    async def racing_get(self: AsyncSession, *args: object, **kwargs: object) -> object:
        async with app.state.sessionmaker() as other:
            await other.execute(
                update(RefreshSession)
                .where(RefreshSession.id == session_row.id)
                .values(revoked_at=utcnow())
            )
            await other.commit()
        return await original_get(self, *args, **kwargs)

    monkeypatch.setattr(AsyncSession, "get", racing_get)

    with pytest.raises(AppError) as exc_info:
        await service.rotate_refresh(db, raw, app.state.settings, None)
    assert exc_info.value.code == "REFRESH_ROTATED"

    monkeypatch.setattr(AsyncSession, "get", original_get)
    other = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_token(other_device))
    )
    assert other is not None
    await db.refresh(other)
    assert other.revoked_at is None
