from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User, UserStatus
from app.core.config import Settings
from app.core.security import create_access_token, hash_password

DEFAULT_PASSWORD = "parol1234"


async def make_user(
    db: AsyncSession,
    *,
    email: str = "ali@mail.uz",
    password: str = DEFAULT_PASSWORD,
    role: Role = Role.student,
    status: UserStatus = UserStatus.active,
    full_name: str = "Ali Valiyev",
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
        status=status,
        full_name=full_name,
    )
    db.add(user)
    await db.commit()
    return user


def auth_headers(user: User, settings: Settings) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role, settings)}"}
