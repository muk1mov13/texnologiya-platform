from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.models import Role, User, UserStatus
from app.core.deps import AppSettings, DbSession
from app.core.errors import AppError
from app.core.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    db: DbSession,
    settings: AppSettings,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    if credentials is None:
        raise AppError(401, "NOT_AUTHENTICATED", "Tizimga kirilmagan")
    user_id = decode_access_token(credentials.credentials, settings)
    user = await db.get(User, user_id)
    if user is None:
        raise AppError(401, "INVALID_TOKEN", "Token yaroqsiz")
    if user.status == UserStatus.blocked:
        raise AppError(403, "ACCOUNT_BLOCKED", "Akkaunt bloklangan")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_active_user(user: CurrentUser) -> User:
    if user.status != UserStatus.active:
        raise AppError(403, "ACCOUNT_PENDING", "Akkaunt hali tasdiqlanmagan")
    return user


ActiveUser = Annotated[User, Depends(get_active_user)]


def require_role(*roles: Role) -> Callable[..., Awaitable[User]]:
    async def dependency(user: ActiveUser) -> User:
        if user.role not in roles:
            raise AppError(403, "FORBIDDEN", "Bu amal uchun ruxsat yo'q")
        return user

    return dependency


AdminUser = Annotated[User, Depends(require_role(Role.admin))]
StaffUser = Annotated[User, Depends(require_role(Role.teacher, Role.admin))]
