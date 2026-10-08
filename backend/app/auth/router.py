from fastapi import APIRouter, Request, Response

from app.auth import service
from app.auth.models import User
from app.auth.schemas import LoginIn, RegisterIn, TokenOut, UserOut
from app.core.config import Settings
from app.core.deps import AppSettings, DbSession, LoginLimiter
from app.core.errors import AppError

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
