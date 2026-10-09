from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service
from app.auth.deps import AdminUser
from app.auth.models import User, UserStatus
from app.auth.schemas import AdminUserUpdateIn, TempPasswordOut, UserOut
from app.core.deps import DbSession
from app.core.errors import AppError
from app.core.security import generate_temp_password, hash_password
from app.core.types import DbIdPath

router = APIRouter(prefix="/admin/users", tags=["admin"])


@router.get("", response_model=list[UserOut])
async def list_users(
    admin: AdminUser,
    db: DbSession,
    status: UserStatus | None = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc(), User.id.desc())
    if status is not None:
        stmt = stmt.where(User.status == status)
    if q:
        pattern = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(User.full_name).like(pattern), User.email.like(pattern)))
    return list(await db.scalars(stmt.limit(limit).offset(offset)))


async def _get_target(db: AsyncSession, admin: User, user_id: int) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise AppError(404, "USER_NOT_FOUND", "Foydalanuvchi topilmadi")
    if user.id == admin.id:
        raise AppError(400, "CANNOT_MODIFY_SELF", "O'z akkauntingizni bu yerda o'zgartira olmaysiz")
    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: DbIdPath, data: AdminUserUpdateIn, admin: AdminUser, db: DbSession
) -> User:
    user = await _get_target(db, admin, user_id)
    if data.role is not None:
        user.role = data.role
    if data.status is not None:
        user.status = data.status
        if data.status == UserStatus.blocked:
            await service.revoke_all_sessions(db, user.id)
    await db.commit()
    return user


@router.post("/{user_id}/temp-password", response_model=TempPasswordOut)
async def set_temp_password(user_id: DbIdPath, admin: AdminUser, db: DbSession) -> TempPasswordOut:
    user = await _get_target(db, admin, user_id)
    temp = generate_temp_password()
    user.password_hash = hash_password(temp)
    await service.revoke_all_sessions(db, user.id)
    await db.commit()
    return TempPasswordOut(temp_password=temp)
