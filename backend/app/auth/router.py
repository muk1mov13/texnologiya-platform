import re
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Cookie, Request, Response, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.auth import service
from app.auth.deps import CurrentUser
from app.auth.models import User
from app.auth.schemas import (
    LoginIn,
    MeUpdateIn,
    PasswordChangeIn,
    RegisterIn,
    TokenOut,
    UserOut,
)
from app.core.config import Settings
from app.core.deps import AppSettings, AppStorage, DbSession, LoginLimiter
from app.core.errors import AppError, error_body
from app.core.files import ALLOWED_IMAGE_EXT, file_response, save_checked

router = APIRouter(tags=["auth"])

REFRESH_COOKIE = "refresh_token"
REFRESH_COOKIE_PATH = "/api/auth"


def set_refresh_cookie(response: Response, raw: str, settings: Settings) -> None:
    response.set_cookie(
        REFRESH_COOKIE,
        raw,
        max_age=settings.refresh_token_days * 24 * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        REFRESH_COOKIE,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


@router.post("/auth/register", response_model=UserOut, status_code=201)
async def register(data: RegisterIn, db: DbSession) -> User:
    return await service.register_user(db, data)


@router.post("/auth/login", response_model=TokenOut)
async def login(
    data: LoginIn,
    request: Request,
    response: Response,
    db: DbSession,
    settings: AppSettings,
    limiter: LoginLimiter,
) -> TokenOut:
    client_ip = request.client.host if request.client else "-"
    key = f"{client_ip}:{service.normalize_email(data.email)}"
    if limiter.is_blocked(key):
        raise AppError(429, "TOO_MANY_ATTEMPTS", "Juda ko'p urinish. Birozdan so'ng qayta urining")
    try:
        user = await service.authenticate(db, data.email, data.password)
    except AppError as exc:
        if exc.code == "INVALID_CREDENTIALS":
            limiter.record_failure(key)
        raise
    limiter.reset(key)
    access, raw = await service.issue_tokens(db, user, settings, request.headers.get("user-agent"))
    set_refresh_cookie(response, raw, settings)
    return TokenOut(access_token=access, user=UserOut.model_validate(user))


@router.post("/auth/refresh", response_model=TokenOut)
async def refresh(
    request: Request,
    response: Response,
    db: DbSession,
    settings: AppSettings,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> TokenOut | JSONResponse:
    # Muvaffaqiyatsiz refresh cookie'ni o'chiradi: aks holda uzilgan sahifa
    # yangilanishidan keyin brauzer rotatsiya qilingan eski tokenni qayta-qayta
    # yuboradi va imtiyoz oynasi o'tgach barcha sessiyalar yopiladi. Cookie
    # umuman kelmagan bo'lsa (NO_REFRESH_TOKEN) o'chiriladigan narsa yo'q —
    # bu holatda o'chirish buyrug'i yangi login qo'ygan cookie bilan poyga
    # holatiga kirib, uni bekor qilib qo'yishi mumkin.
    if not refresh_token:
        failed = JSONResponse(
            error_body("NO_REFRESH_TOKEN", "Sessiya topilmadi", {}), status_code=401
        )
        return failed
    try:
        user, access, raw = await service.rotate_refresh(
            db, refresh_token, settings, request.headers.get("user-agent")
        )
    except AppError as exc:
        failed = JSONResponse(
            error_body(exc.code, exc.message, exc.details), status_code=exc.status_code
        )
        clear_refresh_cookie(failed, settings)
        return failed
    set_refresh_cookie(response, raw, settings)
    return TokenOut(access_token=access, user=UserOut.model_validate(user))


@router.post("/auth/logout", status_code=204)
async def logout(
    db: DbSession,
    settings: AppSettings,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> Response:
    if refresh_token:
        await service.revoke_refresh(db, refresh_token)
    response = Response(status_code=204)
    clear_refresh_cookie(response, settings)
    return response


_NON_NULLABLE_PROFILE_FIELDS = frozenset({"full_name", "locale"})


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(data: MeUpdateIn, user: CurrentUser, db: DbSession) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is None and field in _NON_NULLABLE_PROFILE_FIELDS:
            continue
        setattr(user, field, value)
    await db.commit()
    return user


@router.post("/me/password", status_code=204)
async def change_password(data: PasswordChangeIn, user: CurrentUser, db: DbSession) -> Response:
    await service.change_password(db, user, data.current_password, data.new_password)
    return Response(status_code=204)


AVATAR_DIR = "avatars"
# Storage nomlari: `uuid4().hex` + rasm kengaytmasi (`Storage._new_rel`).
_AVATAR_NAME = re.compile(r"^[0-9a-f]{32}\.(?:jpg|jpeg|png|webp)$")


@router.put("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile, user: CurrentUser, db: DbSession, settings: AppSettings, storage: AppStorage
) -> User:
    """Profil rasmini yuklaydi yoki almashtiradi (JPG/PNG/WEBP, magic bytes tekshiriladi)."""
    rel, _, _ = await save_checked(
        storage, file, AVATAR_DIR, allowed_ext=ALLOWED_IMAGE_EXT, max_mb=settings.max_avatar_mb
    )
    old = user.avatar
    user.avatar = rel
    try:
        await db.commit()
    except Exception:
        storage.delete_quietly([rel])
        raise
    storage.delete_quietly([old])
    return user


@router.delete("/me/avatar", response_model=UserOut)
async def delete_avatar(user: CurrentUser, db: DbSession, storage: AppStorage) -> User:
    """Profil rasmini o'chiradi — standart avatar qaytadi."""
    old = user.avatar
    user.avatar = None
    await db.commit()
    storage.delete_quietly([old])
    return user


@router.get("/avatars/{name}", response_class=Response)
async def avatar_file(
    name: str, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    """Profil rasmi (ochiq: `<img>` token yubora olmaydi, nom esa taxmin qilinmaydi)."""
    rel = f"{AVATAR_DIR}/{name}"
    if (
        not _AVATAR_NAME.match(name)
        or await db.scalar(select(User.id).where(User.avatar == rel)) is None
    ):
        raise AppError(404, "AVATAR_NOT_FOUND", "Rasm topilmadi")
    response = file_response(settings, storage, rel, f"avatar{Path(name).suffix}")
    # Fayl nomi har yuklashda yangi, shuning uchun uzoq keshlash xavfsiz.
    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response
