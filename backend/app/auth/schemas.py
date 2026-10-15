from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.auth.models import Locale, Role, UserStatus
from app.core.types import trimmed_str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: trimmed_str(min_length=2, max_length=150)  # type: ignore[valid-type]
    phone: str | None = Field(default=None, max_length=32)
    locale: Locale = Locale.uz


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    phone: str | None
    full_name: str
    role: Role
    status: UserStatus
    locale: Locale
    avatar_url: str | None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MeUpdateIn(BaseModel):
    full_name: trimmed_str(min_length=2, max_length=150) | None = None  # type: ignore[valid-type]
    phone: str | None = Field(default=None, max_length=32)
    locale: Locale | None = None


class PasswordChangeIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class AdminUserUpdateIn(BaseModel):
    role: Role | None = None
    status: UserStatus | None = None


class TempPasswordOut(BaseModel):
    temp_password: str
