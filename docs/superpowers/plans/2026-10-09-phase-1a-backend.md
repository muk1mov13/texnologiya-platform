# 1A-bosqich: Backend asosi — implementatsiya rejasi

**Goal:** Spec'dagi 1-bosqich backend qismini qurish: auth (ro'yxatdan o'tish, tasdiqlash, JWT + refresh), fan → mavzu → 7 bosqich, materiallar (PPT → PDF), glossariy, adabiyotlar, talaba progressi. Barchasi testlar bilan qoplanadi.

**Architecture:** FastAPI modulli monolit (`app/core`, `app/auth`, `app/learning`). SQLAlchemy 2 async, lokal muhitda SQLite, CI'da PostgreSQL. Fon ishlari `JobRunner` interfeysi orqali yuboriladi, lokal muhitda ular `InlineJobRunner` bilan shu jarayonning o'zida bajariladi. Docker ishlatilmaydi.

**Tech Stack:** Python 3.12, uv, FastAPI, SQLAlchemy 2 (aiosqlite / asyncpg), Alembic, Pydantic v2 + pydantic-settings, argon2-cffi, PyJWT, PyMuPDF, pytest + pytest-asyncio + httpx.

**Spec:** `docs/superpowers/specs/2026-10-08-texnologiya-platform-design.md`

**Konventsiyalar:**
- Barcha buyruqlar Git Bash'da `backend/` papkasidan ishga tushiriladi, agar boshqacha ko'rsatilmagan bo'lsa.
- API xatosi har doim `{"code", "message", "details"}` formatida qaytadi. Testlar `code` maydonini tekshiradi.
- Foydalanuvchiga ko'rinadigan `message` matnlari o'zbek tilida.
- Commit faqat `texnologiya-platform` repo ichida qilinadi. U alohida git repo, uy papkasidagi repo emas.

---

## Fayl xaritasi

```
backend/
  pyproject.toml, uv.lock, .python-version, .env.example, alembic.ini, README.md
  app/
    main.py              # create_app(): state, middleware, router
    api.py               # /api router: barcha modul routerlarini yig'adi
    models_registry.py   # Alembic va testlar uchun barcha modellarni import qiladi
    cli.py               # python -m app.cli create-admin
    core/
      config.py          # Settings
      db.py              # Base, mixinlar, engine/sessionmaker
      types.py           # BigIntPK, UTCDateTime, str_enum, utcnow
      errors.py          # AppError + yagona xato formati
      middleware.py      # X-Request-ID
      security.py        # argon2, JWT, token hash, vaqtinchalik parol
      ratelimit.py       # InMemoryRateLimiter
      storage.py         # fayl saqlash (UUID nomlar)
      jobs.py            # JobRunner, InlineJobRunner, @job registri
      deps.py            # DbSession, AppSettings, AppStorage, Jobs, LoginLimiter
    auth/
      models.py          # User, RefreshSession, Role, UserStatus, Locale
      schemas.py
      service.py         # register, authenticate, tokens, refresh rotation
      deps.py            # CurrentUser, ActiveUser, AdminUser, StaffUser
      router.py          # /auth/*, /me
      admin_router.py    # /admin/users
    learning/
      models.py          # Subject, Topic, Step, Material, GlossaryTerm, LiteratureItem, StepProgress
      schemas.py         # muharrir (admin/o'qituvchi) sxemalari
      student_schemas.py # talaba sxemalari
      editing.py         # slugify, fanlar, mavzular, ruxsatlar, muharrir ko'rinishi
      topic_items.py     # glossariy + adabiyotlar CRUD
      convert.py         # LibreOffice konvertatsiya, sahifa soni
      materials.py       # yuklash, o'chirish, qayta urinish, convert_material job
      content.py         # bosqichda kontent bormi + progress hisoblash
      progress.py        # talaba ko'rinishlari, bosqichni tugatish
      resume.py          # davom ettirish, progress xulosasi, faylga ruxsat
      admin_router.py    # /admin/subjects
      teach_router.py    # /teach/subjects, /teach/topics
      teach_materials_router.py
      teach_items_router.py
      router.py          # /subjects, /topics, /steps
      progress_router.py # /me/continue, /me/progress, /materials/{id}/file
  alembic/  env.py, script.py.mako, versions/
  tests/    __init__.py, conftest.py, factories.py, test_*.py
.github/workflows/ci.yml
```

---

### Task 1: Backend skeleti, sozlamalar, health endpoint

**Files:**
- Create: `backend/pyproject.toml`, `backend/.python-version`, `backend/.env.example`
- Create: `backend/app/__init__.py`, `backend/app/core/__init__.py`, `backend/app/core/config.py`, `backend/app/api.py`, `backend/app/main.py`
- Create: `backend/tests/__init__.py`, `backend/tests/test_health.py`
- Modify: `.gitignore`

- [ ] **Step 1: `backend/pyproject.toml` yozish**

```toml
[project]
name = "texnologiya-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "sqlalchemy[asyncio]>=2.0.30",
  "aiosqlite>=0.20",
  "asyncpg>=0.29",
  "alembic>=1.13",
  "pydantic-settings>=2.3",
  "email-validator>=2.1",
  "argon2-cffi>=23.1",
  "pyjwt>=2.8",
  "python-multipart>=0.0.9",
  "pymupdf>=1.24",
]

[dependency-groups]
dev = [
  "pytest>=8",
  "pytest-asyncio>=0.23",
  "httpx>=0.27",
  "ruff>=0.5",
  "mypy>=1.10",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
testpaths = ["tests"]
pythonpath = ["."]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "ASYNC"]

[tool.mypy]
python_version = "3.12"
plugins = ["pydantic.mypy"]
ignore_missing_imports = true
check_untyped_defs = true
```

`backend/.python-version`:

```
3.12
```

`backend/.env.example`:

```
ENV=dev
DATABASE_URL=sqlite+aiosqlite:///./dev.db
JWT_SECRET=dev-only-secret-change-me-in-production-0000
COOKIE_SECURE=false
CORS_ORIGINS=["http://localhost:5173"]
MEDIA_ROOT=./media
# Windows: SOFFICE_PATH=C:/Program Files/LibreOffice/program/soffice.exe
SOFFICE_PATH=soffice
```

- [ ] **Step 2: `.gitignore`ga (repo ildizida) qatorlar qo'shish**

Mavjud `.gitignore` oxiriga:

```
*.db
media/
.pytest_cache/
.ruff_cache/
.mypy_cache/
```

- [ ] **Step 3: Failing test yozish — `backend/tests/test_health.py`**

```python
import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.core.config import Settings
from app.main import create_app


async def test_health_returns_ok() -> None:
    app = create_app(Settings(env="test", jwt_secret="h" * 40))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_prod_requires_real_jwt_secret() -> None:
    with pytest.raises(ValidationError):
        Settings(env="prod")
```

`backend/tests/__init__.py` va `backend/app/__init__.py`, `backend/app/core/__init__.py` — bo'sh fayllar.

- [ ] **Step 4: Testni ishga tushirib, xato berishini tekshirish**

Run: `uv sync && uv run pytest tests/test_health.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.core.config'`

- [ ] **Step 5: `backend/app/core/config.py`**

```python
from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_JWT_SECRET = "dev-only-secret-change-me-in-production-0000"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["dev", "test", "prod"] = "dev"
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    jwt_secret: str = DEV_JWT_SECRET
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    cookie_secure: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]
    media_root: str = "./media"
    media_accel_redirect: bool = False
    max_material_mb: int = 50
    login_rate_limit: int = 10
    login_rate_window_seconds: int = 900
    soffice_path: str = "soffice"
    conversion_timeout_seconds: int = 180

    @property
    def is_prod(self) -> bool:
        return self.env == "prod"

    @model_validator(mode="after")
    def _require_prod_secret(self) -> "Settings":
        if self.env == "prod" and self.jwt_secret == DEV_JWT_SECRET:
            raise ValueError("JWT_SECRET must be set in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 6: `backend/app/api.py`**

```python
from fastapi import APIRouter

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 7: `backend/app/main.py` (vaqtinchalik minimal versiya, Task 2 va 4 da kengaytiriladi)**

```python
from fastapi import FastAPI

from app.api import api_router
from app.core.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Texnologiya platformasi API",
        docs_url=None if settings.is_prod else "/api/docs",
        openapi_url=None if settings.is_prod else "/api/openapi.json",
        redoc_url=None,
    )
    app.state.settings = settings
    app.include_router(api_router)
    return app
```

- [ ] **Step 8: Testlar o'tishini tekshirish**

Run: `uv run pytest tests/test_health.py -q`
Expected: `2 passed`

- [ ] **Step 9: Commit**

```bash
cd .. && git add .gitignore backend/pyproject.toml backend/uv.lock backend/.python-version backend/.env.example backend/app backend/tests
git commit -m "feat(backend): project skeleton with settings and health endpoint"
```

---

### Task 2: Core — baza, turlar, xatolar, request ID, test fixture'lari

**Files:**
- Create: `backend/app/core/types.py`, `backend/app/core/db.py`, `backend/app/core/errors.py`, `backend/app/core/middleware.py`, `backend/app/models_registry.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/conftest.py`, `backend/tests/test_types.py`, `backend/tests/test_errors.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_types.py`**

```python
from datetime import UTC, datetime, timedelta, timezone

import pytest

from app.core.types import UTCDateTime


def test_utc_datetime_returns_aware_values() -> None:
    column_type = UTCDateTime()
    loaded = column_type.process_result_value(datetime(2026, 1, 1, 12, 0), None)  # type: ignore[arg-type]
    assert loaded == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def test_utc_datetime_converts_to_utc_on_save() -> None:
    tashkent = timezone(timedelta(hours=5))
    saved = UTCDateTime().process_bind_param(datetime(2026, 1, 1, 17, 0, tzinfo=tashkent), None)  # type: ignore[arg-type]
    assert saved == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


def test_utc_datetime_rejects_naive_values() -> None:
    with pytest.raises(ValueError):
        UTCDateTime().process_bind_param(datetime(2026, 1, 1), None)  # type: ignore[arg-type]
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_errors.py`**

```python
from fastapi import FastAPI
from httpx import AsyncClient
from pydantic import BaseModel

from app.core.errors import AppError


class Payload(BaseModel):
    n: int


async def test_app_error_has_uniform_shape(app: FastAPI, client: AsyncClient) -> None:
    async def boom() -> None:
        raise AppError(404, "TOPIC_NOT_FOUND", "Mavzu topilmadi")

    app.add_api_route("/api/_boom", boom)
    response = await client.get("/api/_boom")
    assert response.status_code == 404
    assert response.json() == {"code": "TOPIC_NOT_FOUND", "message": "Mavzu topilmadi", "details": {}}
    assert response.headers["x-request-id"]


async def test_validation_error_lists_fields(app: FastAPI, client: AsyncClient) -> None:
    async def echo(payload: Payload) -> dict[str, int]:
        return {"n": payload.n}

    app.add_api_route("/api/_echo", echo, methods=["POST"])
    response = await client.post("/api/_echo", json={"n": "abc"})
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert body["details"]["fields"][0]["loc"] == ["body", "n"]


async def test_unknown_route_is_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


async def test_unexpected_error_hides_details(app: FastAPI, client: AsyncClient) -> None:
    async def crash() -> None:
        raise RuntimeError("secret internals")

    app.add_api_route("/api/_crash", crash)
    response = await client.get("/api/_crash")
    assert response.status_code == 500
    body = response.json()
    assert body["code"] == "INTERNAL_ERROR"
    assert "secret" not in response.text
    assert body["details"]["request_id"] == response.headers["x-request-id"]
```

- [ ] **Step 3: `backend/tests/conftest.py`**

```python
import os
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

import app.models_registry  # noqa: F401  (barcha jadvallarni Base.metadata'ga ro'yxatdan o'tkazadi)
from app.core.config import Settings
from app.core.db import Base
from app.main import create_app

TEST_SECRET = "test-secret-" + "x" * 32


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    database_url = os.environ.get("TEST_DATABASE_URL") or (
        f"sqlite+aiosqlite:///{(tmp_path / 'test.db').as_posix()}"
    )
    return Settings(
        env="test",
        database_url=database_url,
        jwt_secret=TEST_SECRET,
        media_root=str(tmp_path / "media"),
        login_rate_limit=3,
    )


@pytest.fixture
async def app(settings: Settings) -> AsyncIterator[FastAPI]:
    application = create_app(settings)
    async with application.state.engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield application
    jobs = getattr(application.state, "jobs", None)
    if jobs is not None:
        await jobs.drain()
    await application.state.engine.dispose()


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client


@pytest.fixture
async def db(app: FastAPI) -> AsyncIterator[AsyncSession]:
    async with app.state.sessionmaker() as session:
        yield session
```

- [ ] **Step 4: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_types.py tests/test_errors.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.models_registry'`

- [ ] **Step 5: `backend/app/core/types.py`**

```python
from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import BigInteger, DateTime, Dialect, Enum, Integer
from sqlalchemy.types import TypeDecorator

# PostgreSQL'da BIGINT, SQLite'da INTEGER (SQLite autoincrement faqat INTEGER PK bilan ishlaydi).
BigIntPK = BigInteger().with_variant(Integer(), "sqlite")


def utcnow() -> datetime:
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator[datetime]):
    """Har ikki bazada ham timezone-aware (UTC) qaytadigan datetime."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("naive datetime is not allowed")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


def str_enum(enum_cls: type[StrEnum], length: int = 20) -> Enum:
    """Enum'ni VARCHAR sifatida saqlaydi (SQLite va PostgreSQL'da bir xil)."""
    return Enum(
        enum_cls,
        native_enum=False,
        length=length,
        values_callable=lambda members: [m.value for m in members],
        validate_strings=True,
    )
```

- [ ] **Step 6: `backend/app/core/db.py`**

```python
from datetime import datetime
from typing import Any

from sqlalchemy import MetaData, event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import StaticPool

from app.core.types import BigIntPK, UTCDateTime, utcnow

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class IdMixin:
    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, nullable=False)


def make_engine(url: str) -> AsyncEngine:
    kwargs: dict[str, Any] = {}
    is_sqlite = url.startswith("sqlite")
    if is_sqlite:
        kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in url:
            kwargs["poolclass"] = StaticPool
    engine = create_async_engine(url, **kwargs)
    if is_sqlite:

        @event.listens_for(engine.sync_engine, "connect")
        def _enable_foreign_keys(dbapi_connection: Any, _record: Any) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


def make_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)
```

- [ ] **Step 7: `backend/app/core/errors.py`**

```python
import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str = "",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(code)
        self.status_code = status_code
        self.code = code
        self.message = message or code
        self.details = details or {}


def error_body(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"code": code, "message": message, "details": details or {}}


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(error_body(exc.code, exc.message, exc.details), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def handle_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        fields = [
            {"loc": [str(part) for part in err["loc"]], "msg": err["msg"], "type": err["type"]}
            for err in exc.errors()
        ]
        return JSONResponse(
            error_body("VALIDATION_ERROR", "Ma'lumotlar noto'g'ri", {"fields": fields}),
            status_code=422,
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = "NOT_FOUND" if exc.status_code == 404 else f"HTTP_{exc.status_code}"
        return JSONResponse(
            error_body(code, str(exc.detail)),
            status_code=exc.status_code,
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "")
        logger.exception("Unhandled error (request_id=%s)", request_id)
        return JSONResponse(
            error_body("INTERNAL_ERROR", "Ichki xato yuz berdi", {"request_id": request_id}),
            status_code=500,
            headers={"X-Request-ID": request_id},
        )
```

- [ ] **Step 8: `backend/app/core/middleware.py`**

```python
import re
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response

_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9-]{1,64}$")


def install_request_id(app: FastAPI) -> None:
    @app.middleware("http")
    async def add_request_id(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        incoming = request.headers.get("X-Request-ID", "")
        request_id = incoming if _VALID_REQUEST_ID.match(incoming) else uuid.uuid4().hex
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
```

- [ ] **Step 9: `backend/app/models_registry.py`**

```python
"""Barcha ORM modellarini import qiladi: Alembic autogenerate va testlardagi create_all uchun.

Har bir yangi modul modeli shu yerga qo'shiladi.
"""
```

- [ ] **Step 10: `backend/app/main.py` ni yangilash**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import Settings, get_settings
from app.core.db import make_engine, make_sessionmaker
from app.core.errors import install_error_handlers
from app.core.middleware import install_request_id


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Texnologiya platformasi API",
        docs_url=None if settings.is_prod else "/api/docs",
        openapi_url=None if settings.is_prod else "/api/openapi.json",
        redoc_url=None,
    )
    engine = make_engine(settings.database_url)
    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = make_sessionmaker(engine)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    install_request_id(app)
    install_error_handlers(app)
    app.include_router(api_router)
    return app
```

- [ ] **Step 11: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `9 passed`

- [ ] **Step 12: Commit**

```bash
cd .. && git add backend/app backend/tests
git commit -m "feat(backend): core db types, uniform error format, request id, test fixtures"
```

---

### Task 3: Core — parol, JWT, token hash va login rate limiter

**Files:**
- Create: `backend/app/core/security.py`, `backend/app/core/ratelimit.py`
- Create: `backend/tests/test_security.py`, `backend/tests/test_ratelimit.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_security.py`**

```python
import pytest

from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_temp_password,
    hash_password,
    hash_token,
    new_refresh_token,
    verify_password,
)

SETTINGS = Settings(env="test", jwt_secret="s" * 40)


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("parol1234")
    assert hashed != "parol1234"
    assert verify_password("parol1234", hashed)
    assert not verify_password("boshqa-parol", hashed)


def test_verify_password_handles_garbage_hash() -> None:
    assert not verify_password("parol1234", "not-a-hash")


def test_access_token_roundtrip() -> None:
    token = create_access_token(42, "teacher", SETTINGS)
    assert decode_access_token(token, SETTINGS) == 42


def test_expired_access_token_is_rejected() -> None:
    expired = Settings(env="test", jwt_secret="s" * 40, access_token_minutes=-1)
    token = create_access_token(42, "student", expired)
    with pytest.raises(AppError) as exc:
        decode_access_token(token, SETTINGS)
    assert exc.value.status_code == 401
    assert exc.value.code == "INVALID_TOKEN"


def test_token_signed_with_other_secret_is_rejected() -> None:
    token = create_access_token(1, "student", Settings(env="test", jwt_secret="o" * 40))
    with pytest.raises(AppError):
        decode_access_token(token, SETTINGS)


def test_refresh_tokens_are_random_and_hash_is_stable() -> None:
    first, second = new_refresh_token(), new_refresh_token()
    assert first != second
    assert hash_token(first) == hash_token(first)
    assert len(hash_token(first)) == 64


def test_temp_password_is_readable() -> None:
    password = generate_temp_password()
    assert len(password) == 10
    assert not set(password) & set("0O1lI")
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_ratelimit.py`**

```python
from app.core.ratelimit import InMemoryRateLimiter


def test_blocks_after_limit_and_unblocks_after_window() -> None:
    now = [0.0]
    limiter = InMemoryRateLimiter(limit=2, window_seconds=60, clock=lambda: now[0])
    limiter.record_failure("ip:ali")
    assert not limiter.is_blocked("ip:ali")
    limiter.record_failure("ip:ali")
    assert limiter.is_blocked("ip:ali")
    now[0] = 61.0
    assert not limiter.is_blocked("ip:ali")


def test_reset_clears_only_that_key() -> None:
    limiter = InMemoryRateLimiter(limit=1, window_seconds=60)
    limiter.record_failure("a")
    limiter.record_failure("b")
    limiter.reset("a")
    assert not limiter.is_blocked("a")
    assert limiter.is_blocked("b")
```

- [ ] **Step 3: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_security.py tests/test_ratelimit.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.core.security'`

- [ ] **Step 4: `backend/app/core/security.py`**

```python
import hashlib
import secrets
from datetime import timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import Settings
from app.core.errors import AppError
from app.core.types import utcnow

ALGORITHM = "HS256"
_hasher = PasswordHasher()
# 0/O, 1/l/I kabi chalkash belgilar olib tashlangan: admin parolni og'zaki aytib berishi mumkin.
_TEMP_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_access_token(user_id: int, role: str, settings: Settings) -> str:
    now = utcnow()
    payload = {
        "sub": str(user_id),
        "role": str(role),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str, settings: Settings) -> int:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise AppError(401, "INVALID_TOKEN", "Token yaroqsiz") from exc
    if payload.get("type") != "access":
        raise AppError(401, "INVALID_TOKEN", "Token yaroqsiz")
    return int(payload["sub"])


def new_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_temp_password(length: int = 10) -> str:
    return "".join(secrets.choice(_TEMP_ALPHABET) for _ in range(length))
```

- [ ] **Step 5: `backend/app/core/ratelimit.py`**

```python
import time
from collections import defaultdict, deque
from collections.abc import Callable


class InMemoryRateLimiter:
    """Kalit bo'yicha muvaffaqiyatsiz urinishlarni sirpanuvchi oynada sanaydi.

    Faqat bitta jarayon uchun (lokal muhit). Prod'da Redis versiyasi bilan almashtiriladi.
    """

    def __init__(
        self, limit: int, window_seconds: int, clock: Callable[[], float] = time.monotonic
    ) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._clock = clock
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def _recent(self, key: str) -> deque[float]:
        failures = self._failures[key]
        cutoff = self._clock() - self.window_seconds
        while failures and failures[0] <= cutoff:
            failures.popleft()
        return failures

    def is_blocked(self, key: str) -> bool:
        return len(self._recent(key)) >= self.limit

    def record_failure(self, key: str) -> None:
        self._recent(key).append(self._clock())

    def reset(self, key: str) -> None:
        self._failures.pop(key, None)
```

- [ ] **Step 6: Testlar o'tishini tekshirish**

Run: `uv run pytest tests/test_security.py tests/test_ratelimit.py -q`
Expected: `9 passed`

- [ ] **Step 7: Commit**

```bash
cd .. && git add backend/app/core/security.py backend/app/core/ratelimit.py backend/tests/test_security.py backend/tests/test_ratelimit.py
git commit -m "feat(backend): password hashing, JWT helpers and login rate limiter"
```

---

### Task 4: Core — fayl saqlash, fon ishlari, dependency'lar, yakuniy `main.py`

**Files:**
- Create: `backend/app/core/storage.py`, `backend/app/core/jobs.py`, `backend/app/core/deps.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_storage.py`, `backend/tests/test_jobs.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_storage.py`**

```python
import io
from pathlib import Path

import pytest
from fastapi import UploadFile

from app.core.errors import AppError
from app.core.storage import Storage

PDF_ONLY = frozenset({".pdf"})


def _upload(data: bytes, name: str) -> UploadFile:
    return UploadFile(file=io.BytesIO(data), filename=name)


async def test_save_upload_uses_uuid_name_and_lowercase_extension(tmp_path: Path) -> None:
    storage = Storage(tmp_path)
    rel, original = await storage.save_upload(
        _upload(b"%PDF-1.4", "Darslik 1.PDF"), "materials", allowed_ext=PDF_ONLY, max_bytes=1024
    )
    assert original == "Darslik 1.PDF"
    assert rel.startswith("materials/") and rel.endswith(".pdf")
    assert "Darslik" not in rel
    assert storage.path(rel).read_bytes() == b"%PDF-1.4"


async def test_save_upload_rejects_unknown_extension(tmp_path: Path) -> None:
    with pytest.raises(AppError) as exc:
        await Storage(tmp_path).save_upload(
            _upload(b"x", "virus.exe"), "materials", allowed_ext=PDF_ONLY, max_bytes=1024
        )
    assert exc.value.status_code == 400
    assert exc.value.code == "UNSUPPORTED_FILE_TYPE"


async def test_save_upload_rejects_too_large_and_cleans_up(tmp_path: Path) -> None:
    storage = Storage(tmp_path)
    with pytest.raises(AppError) as exc:
        await storage.save_upload(
            _upload(b"x" * 2048, "big.pdf"), "materials", allowed_ext=PDF_ONLY, max_bytes=1024
        )
    assert exc.value.status_code == 413
    assert exc.value.code == "FILE_TOO_LARGE"
    assert list((tmp_path / "materials").iterdir()) == []


def test_path_rejects_escaping_media_root(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        Storage(tmp_path / "media").path("../secret.txt")


def test_import_file_and_delete(tmp_path: Path) -> None:
    source = tmp_path / "source.pdf"
    source.write_bytes(b"data")
    storage = Storage(tmp_path / "media")
    rel = storage.import_file(source, "materials", ".pdf")
    assert storage.path(rel).read_bytes() == b"data"
    storage.delete(rel)
    assert not storage.path(rel).exists()
    storage.delete(None)
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_jobs.py`**

```python
from pathlib import Path
from typing import Any

import pytest

from app.core.config import Settings
from app.core.jobs import JOB_REGISTRY, InlineJobRunner, JobContext, job
from app.core.storage import Storage


def _runner(tmp_path: Path) -> InlineJobRunner:
    ctx = JobContext(
        sessionmaker=None,  # type: ignore[arg-type]
        settings=Settings(env="test", jwt_secret="j" * 40),
        storage=Storage(tmp_path),
    )
    return InlineJobRunner(ctx)


async def test_enqueued_job_runs_and_drain_waits(tmp_path: Path) -> None:
    calls: list[int] = []

    @job("test_record")
    async def record(ctx: JobContext, value: int) -> None:
        calls.append(value)

    try:
        runner = _runner(tmp_path)
        await runner.enqueue("test_record", value=42)
        await runner.drain()
        assert calls == [42]
    finally:
        JOB_REGISTRY.pop("test_record")


async def test_failing_job_is_logged_not_raised(tmp_path: Path, caplog: Any) -> None:
    @job("test_fail")
    async def fail(ctx: JobContext) -> None:
        raise RuntimeError("boom")

    try:
        runner = _runner(tmp_path)
        await runner.enqueue("test_fail")
        await runner.drain()
        assert "Job test_fail failed" in caplog.text
    finally:
        JOB_REGISTRY.pop("test_fail")


async def test_unknown_job_name_is_rejected(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        await _runner(tmp_path).enqueue("does_not_exist")
```

- [ ] **Step 3: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_storage.py tests/test_jobs.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.core.storage'`

- [ ] **Step 4: `backend/app/core/storage.py`**

```python
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.errors import AppError

CHUNK_SIZE = 1024 * 1024


class Storage:
    """Media fayllarini `root` ichida tasodifiy (UUID) nomlar bilan saqlaydi."""

    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def path(self, rel: str) -> Path:
        resolved = (self.root / rel).resolve()
        if not resolved.is_relative_to(self.root):
            raise ValueError("path escapes media root")
        return resolved

    def _new_rel(self, subdir: str, ext: str) -> str:
        return f"{subdir}/{uuid.uuid4().hex}{ext}"

    async def save_upload(
        self,
        upload: UploadFile,
        subdir: str,
        *,
        allowed_ext: frozenset[str],
        max_bytes: int,
    ) -> tuple[str, str]:
        original_name = Path(upload.filename or "").name
        ext = Path(original_name).suffix.lower()
        if ext not in allowed_ext:
            raise AppError(
                400,
                "UNSUPPORTED_FILE_TYPE",
                "Bu turdagi fayl qabul qilinmaydi",
                {"allowed": sorted(allowed_ext)},
            )
        rel = self._new_rel(subdir, ext)
        destination = self.path(rel)
        destination.parent.mkdir(parents=True, exist_ok=True)
        size = 0
        try:
            with destination.open("wb") as fh:
                while chunk := await upload.read(CHUNK_SIZE):
                    size += len(chunk)
                    if size > max_bytes:
                        raise AppError(
                            413, "FILE_TOO_LARGE", "Fayl hajmi juda katta", {"max_bytes": max_bytes}
                        )
                    fh.write(chunk)
        except BaseException:
            destination.unlink(missing_ok=True)
            raise
        return rel, original_name or f"file{ext}"

    def import_file(self, source: Path, subdir: str, ext: str) -> str:
        rel = self._new_rel(subdir, ext)
        destination = self.path(rel)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        return rel

    def delete(self, rel: str | None) -> None:
        if rel:
            self.path(rel).unlink(missing_ok=True)
```

- [ ] **Step 5: `backend/app/core/jobs.py`**

```python
import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Protocol

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.core.storage import Storage

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class JobContext:
    sessionmaker: async_sessionmaker[AsyncSession]
    settings: Settings
    storage: Storage


JobFunc = Callable[..., Awaitable[None]]
JOB_REGISTRY: dict[str, JobFunc] = {}


def job(name: str) -> Callable[[JobFunc], JobFunc]:
    """Fon ishini nom bilan ro'yxatdan o'tkazadi. Funksiya `(ctx, **kwargs)` qabul qiladi."""

    def register(func: JobFunc) -> JobFunc:
        JOB_REGISTRY[name] = func
        return func

    return register


class JobRunner(Protocol):
    async def enqueue(self, name: str, **kwargs: Any) -> None: ...


class InlineJobRunner:
    """Ishlarni API jarayoni ichida asyncio task sifatida bajaradi (lokal muhit).

    Prod'da xuddi shu `enqueue()` imzosiga ega arq runner ishlatiladi.
    """

    def __init__(self, ctx: JobContext) -> None:
        self.ctx = ctx
        self._tasks: set[asyncio.Task[None]] = set()

    async def enqueue(self, name: str, **kwargs: Any) -> None:
        func = JOB_REGISTRY.get(name)
        if func is None:
            raise ValueError(f"Unknown job: {name}")
        task = asyncio.create_task(self._run(name, func, kwargs))
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def _run(self, name: str, func: JobFunc, kwargs: dict[str, Any]) -> None:
        try:
            await func(self.ctx, **kwargs)
        except Exception:
            logger.exception("Job %s failed", name)

    async def drain(self) -> None:
        while self._tasks:
            await asyncio.gather(*list(self._tasks))
```

- [ ] **Step 6: `backend/app/core/deps.py`**

```python
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.jobs import JobRunner
from app.core.ratelimit import InMemoryRateLimiter
from app.core.storage import Storage


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    async with request.app.state.sessionmaker() as session:
        yield session


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings  # type: ignore[no-any-return]


def get_storage(request: Request) -> Storage:
    return request.app.state.storage  # type: ignore[no-any-return]


def get_jobs(request: Request) -> JobRunner:
    return request.app.state.jobs  # type: ignore[no-any-return]


def get_login_limiter(request: Request) -> InMemoryRateLimiter:
    return request.app.state.login_limiter  # type: ignore[no-any-return]


DbSession = Annotated[AsyncSession, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]
AppStorage = Annotated[Storage, Depends(get_storage)]
Jobs = Annotated[JobRunner, Depends(get_jobs)]
LoginLimiter = Annotated[InMemoryRateLimiter, Depends(get_login_limiter)]
```

- [ ] **Step 7: `backend/app/main.py` — yakuniy versiya**

```python
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import Settings, get_settings
from app.core.db import make_engine, make_sessionmaker
from app.core.errors import install_error_handlers
from app.core.jobs import InlineJobRunner, JobContext
from app.core.middleware import install_request_id
from app.core.ratelimit import InMemoryRateLimiter
from app.core.storage import Storage


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Texnologiya platformasi API",
        docs_url=None if settings.is_prod else "/api/docs",
        openapi_url=None if settings.is_prod else "/api/openapi.json",
        redoc_url=None,
    )
    engine = make_engine(settings.database_url)
    sessionmaker = make_sessionmaker(engine)
    storage = Storage(Path(settings.media_root))

    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = sessionmaker
    app.state.storage = storage
    app.state.jobs = InlineJobRunner(
        JobContext(sessionmaker=sessionmaker, settings=settings, storage=storage)
    )
    app.state.login_limiter = InMemoryRateLimiter(
        settings.login_rate_limit, settings.login_rate_window_seconds
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    install_request_id(app)
    install_error_handlers(app)
    app.include_router(api_router)
    return app
```

- [ ] **Step 8: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `26 passed`

- [ ] **Step 9: Commit**

```bash
cd .. && git add backend/app/core backend/app/main.py backend/tests/test_storage.py backend/tests/test_jobs.py
git commit -m "feat(backend): file storage, inline job runner and shared dependencies"
```

---

### Task 5: Auth — modellar, ro'yxatdan o'tish va kirish

**Files:**
- Create: `backend/app/auth/__init__.py` (bo'sh), `backend/app/auth/models.py`, `backend/app/auth/schemas.py`, `backend/app/auth/service.py`, `backend/app/auth/router.py`
- Modify: `backend/app/models_registry.py`, `backend/app/api.py`
- Create: `backend/tests/factories.py`, `backend/tests/test_auth_login.py`

- [ ] **Step 1: `backend/tests/factories.py` (1-versiya)**

```python
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
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_auth_login.py`**

```python
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
```

- [ ] **Step 3: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_auth_login.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.auth'`

- [ ] **Step 4: `backend/app/auth/models.py`**

```python
from datetime import datetime
from enum import StrEnum

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, str_enum


class Role(StrEnum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class UserStatus(StrEnum):
    pending = "pending"
    active = "active"
    blocked = "blocked"


class Locale(StrEnum):
    uz = "uz"
    ru = "ru"


class User(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(32))
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))
    role: Mapped[Role] = mapped_column(str_enum(Role), default=Role.student)
    status: Mapped[UserStatus] = mapped_column(str_enum(UserStatus), default=UserStatus.pending)
    locale: Mapped[Locale] = mapped_column(str_enum(Locale), default=Locale.uz)
    last_seen_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class RefreshSession(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "refresh_sessions"

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    user_agent: Mapped[str | None] = mapped_column(String(255))
```

- [ ] **Step 5: `backend/app/auth/schemas.py`**

```python
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.auth.models import Locale, Role, UserStatus


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=150)
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


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MeUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
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
```

- [ ] **Step 6: `backend/app/auth/service.py`**

```python
from datetime import timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshSession, User, UserStatus
from app.auth.schemas import RegisterIn
from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    hash_password,
    hash_token,
    new_refresh_token,
    verify_password,
)
from app.core.types import utcnow


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    return await db.scalar(select(User).where(User.email == normalize_email(email)))


async def register_user(db: AsyncSession, data: RegisterIn) -> User:
    if await get_user_by_email(db, data.email) is not None:
        raise AppError(409, "EMAIL_TAKEN", "Bu email bilan allaqachon ro'yxatdan o'tilgan")
    user = User(
        email=normalize_email(data.email),
        phone=data.phone,
        password_hash=hash_password(data.password),
        full_name=data.full_name.strip(),
        locale=data.locale,
    )
    db.add(user)
    await db.commit()
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise AppError(401, "INVALID_CREDENTIALS", "Email yoki parol noto'g'ri")
    if user.status == UserStatus.blocked:
        raise AppError(403, "ACCOUNT_BLOCKED", "Akkaunt bloklangan")
    return user


async def issue_tokens(
    db: AsyncSession, user: User, settings: Settings, user_agent: str | None
) -> tuple[str, str]:
    """Yangi refresh sessiya yaratadi va (access_token, raw_refresh_token) qaytaradi."""
    raw = new_refresh_token()
    db.add(
        RefreshSession(
            user_id=user.id,
            token_hash=hash_token(raw),
            expires_at=utcnow() + timedelta(days=settings.refresh_token_days),
            user_agent=(user_agent or "")[:255] or None,
        )
    )
    user.last_seen_at = utcnow()
    await db.commit()
    return create_access_token(user.id, user.role, settings), raw


async def revoke_all_sessions(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(RefreshSession)
        .where(RefreshSession.user_id == user_id, RefreshSession.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )


async def rotate_refresh(
    db: AsyncSession, raw: str, settings: Settings, user_agent: str | None
) -> tuple[User, str, str]:
    session = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_token(raw))
    )
    if session is None:
        raise AppError(401, "INVALID_REFRESH_TOKEN", "Sessiya topilmadi")
    if session.revoked_at is not None:
        # Bekor qilingan token qayta ishlatildi: o'g'irlangan bo'lishi mumkin, hamma sessiyalarni yopamiz.
        await revoke_all_sessions(db, session.user_id)
        await db.commit()
        raise AppError(401, "REFRESH_REUSED", "Sessiya bekor qilingan")
    if session.expires_at <= utcnow():
        raise AppError(401, "REFRESH_EXPIRED", "Sessiya muddati tugagan")
    user = await db.get(User, session.user_id)
    if user is None or user.status == UserStatus.blocked:
        raise AppError(403, "ACCOUNT_BLOCKED", "Akkaunt bloklangan")
    session.revoked_at = utcnow()
    access, new_raw = await issue_tokens(db, user, settings, user_agent)
    return user, access, new_raw


async def revoke_refresh(db: AsyncSession, raw: str) -> None:
    session = await db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == hash_token(raw))
    )
    if session is not None and session.revoked_at is None:
        session.revoked_at = utcnow()
        await db.commit()


async def change_password(db: AsyncSession, user: User, current: str, new: str) -> None:
    if not verify_password(current, user.password_hash):
        raise AppError(400, "WRONG_PASSWORD", "Joriy parol noto'g'ri")
    user.password_hash = hash_password(new)
    await revoke_all_sessions(db, user.id)
    await db.commit()
```

- [ ] **Step 7: `backend/app/auth/router.py` (1-versiya)**

```python
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
```

- [ ] **Step 8: `backend/app/models_registry.py` ni yangilash**

```python
"""Barcha ORM modellarini import qiladi: Alembic autogenerate va testlardagi create_all uchun.

Har bir yangi modul modeli shu yerga qo'shiladi.
"""

import app.auth.models  # noqa: F401
```

- [ ] **Step 9: `backend/app/api.py` ni yangilash**

```python
from fastapi import APIRouter

from app.auth.router import router as auth_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
```

- [ ] **Step 10: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `34 passed`

- [ ] **Step 11: Commit**

```bash
cd .. && git add backend/app/auth backend/app/models_registry.py backend/app/api.py backend/tests/factories.py backend/tests/test_auth_login.py
git commit -m "feat(auth): user model, registration and rate-limited login"
```

---

### Task 6: Auth — refresh token rotatsiyasi va chiqish

**Files:**
- Modify: `backend/app/auth/router.py`
- Create: `backend/tests/test_auth_refresh.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_auth_refresh.py`**

```python
from datetime import timedelta

from httpx import AsyncClient, Response
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import RefreshSession, User, UserStatus
from app.core.types import utcnow
from tests.factories import DEFAULT_PASSWORD, make_user


async def login_raw_refresh(client: AsyncClient, db: AsyncSession) -> str:
    await make_user(db)
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


async def test_reused_refresh_token_revokes_all_sessions(
    client: AsyncClient, db: AsyncSession
) -> None:
    first = await login_raw_refresh(client, db)
    second = (await refresh(client, first)).cookies["refresh_token"]
    reused = await refresh(client, first)
    assert reused.status_code == 401
    assert reused.json()["code"] == "REFRESH_REUSED"
    after_theft = await refresh(client, second)
    assert after_theft.status_code == 401


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
```

- [ ] **Step 2: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_auth_refresh.py -q`
Expected: FAIL — `/api/auth/refresh` uchun `404`

- [ ] **Step 3: `backend/app/auth/router.py` ga refresh va logout qo'shish**

Fayl boshidagi importlarni quyidagicha almashtiring:

```python
from typing import Annotated

from fastapi import APIRouter, Cookie, Request, Response

from app.auth import service
from app.auth.models import User
from app.auth.schemas import LoginIn, RegisterIn, TokenOut, UserOut
from app.core.config import Settings
from app.core.deps import AppSettings, DbSession, LoginLimiter
from app.core.errors import AppError
```

Fayl oxiriga qo'shing:

```python
@router.post("/auth/refresh", response_model=TokenOut)
async def refresh(
    request: Request,
    response: Response,
    db: DbSession,
    settings: AppSettings,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> TokenOut:
    if not refresh_token:
        raise AppError(401, "NO_REFRESH_TOKEN", "Sessiya topilmadi")
    user, access, raw = await service.rotate_refresh(
        db, refresh_token, settings, request.headers.get("user-agent")
    )
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
```

- [ ] **Step 4: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `40 passed`

- [ ] **Step 5: Commit**

```bash
cd .. && git add backend/app/auth/router.py backend/tests/test_auth_refresh.py
git commit -m "feat(auth): refresh token rotation with reuse detection and logout"
```

---

### Task 7: Auth — `/me` endpointlari va rol dependency'lari

**Files:**
- Create: `backend/app/auth/deps.py`
- Modify: `backend/app/auth/router.py`
- Create: `backend/tests/test_me.py`, `backend/tests/test_auth_deps.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_me.py`**

```python
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from tests.factories import DEFAULT_PASSWORD, auth_headers, make_user


async def test_me_returns_current_user(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    user = await make_user(db)
    response = await client.get("/api/me", headers=auth_headers(user, settings))
    assert response.status_code == 200
    assert response.json()["email"] == "ali@mail.uz"


async def test_me_requires_token(client: AsyncClient) -> None:
    response = await client.get("/api/me")
    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_me_rejects_garbage_token(client: AsyncClient) -> None:
    response = await client.get("/api/me", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"


async def test_update_me_changes_name_and_locale(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    user = await make_user(db)
    headers = auth_headers(user, settings)
    response = await client.patch(
        "/api/me", headers=headers, json={"full_name": "Ali Karimov", "locale": "ru"}
    )
    assert response.status_code == 200
    assert (response.json()["full_name"], response.json()["locale"]) == ("Ali Karimov", "ru")
    response = await client.patch("/api/me", headers=headers, json={"full_name": None})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Ali Karimov"


async def test_change_password_revokes_sessions(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    user = await make_user(db)
    login = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": DEFAULT_PASSWORD}
    )
    raw = login.cookies["refresh_token"]
    headers = auth_headers(user, settings)

    wrong = await client.post(
        "/api/me/password",
        headers=headers,
        json={"current_password": "noto-g-ri", "new_password": "yangiparol1"},
    )
    assert wrong.status_code == 400
    assert wrong.json()["code"] == "WRONG_PASSWORD"

    ok = await client.post(
        "/api/me/password",
        headers=headers,
        json={"current_password": DEFAULT_PASSWORD, "new_password": "yangiparol1"},
    )
    assert ok.status_code == 204

    client.cookies.clear()
    stale = await client.post("/api/auth/refresh", headers={"Cookie": f"refresh_token={raw}"})
    assert stale.status_code == 401
    relogin = await client.post(
        "/api/auth/login", json={"email": "ali@mail.uz", "password": "yangiparol1"}
    )
    assert relogin.status_code == 200
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_auth_deps.py`**

```python
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
```

- [ ] **Step 3: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_me.py tests/test_auth_deps.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.auth.deps'`

- [ ] **Step 4: `backend/app/auth/deps.py`**

```python
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
```

- [ ] **Step 5: `backend/app/auth/router.py` — `/me` endpointlarini qo'shish**

Importlarni quyidagicha almashtiring:

```python
from typing import Annotated

from fastapi import APIRouter, Cookie, Request, Response

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
from app.core.deps import AppSettings, DbSession, LoginLimiter
from app.core.errors import AppError
```

Fayl oxiriga qo'shing:

```python
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
```

- [ ] **Step 6: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `47 passed`

- [ ] **Step 7: Commit**

```bash
cd .. && git add backend/app/auth backend/tests/test_me.py backend/tests/test_auth_deps.py
git commit -m "feat(auth): current user endpoints and role-based dependencies"
```

---

### Task 8: Admin — foydalanuvchilarni boshqarish

**Files:**
- Create: `backend/app/auth/admin_router.py`
- Modify: `backend/app/api.py`
- Create: `backend/tests/test_admin_users.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_admin_users.py`**

```python
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
```

- [ ] **Step 2: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_admin_users.py -q`
Expected: FAIL — `/api/admin/users` uchun `404`

- [ ] **Step 3: `backend/app/auth/admin_router.py`**

```python
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
    user_id: int, data: AdminUserUpdateIn, admin: AdminUser, db: DbSession
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
async def set_temp_password(user_id: int, admin: AdminUser, db: DbSession) -> TempPasswordOut:
    user = await _get_target(db, admin, user_id)
    temp = generate_temp_password()
    user.password_hash = hash_password(temp)
    await service.revoke_all_sessions(db, user.id)
    await db.commit()
    return TempPasswordOut(temp_password=temp)
```

- [ ] **Step 4: `backend/app/api.py` ni yangilash**

```python
from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `54 passed`

- [ ] **Step 6: Commit**

```bash
cd .. && git add backend/app/auth/admin_router.py backend/app/api.py backend/tests/test_admin_users.py
git commit -m "feat(admin): user approval, roles, blocking and temporary passwords"
```

---

### Task 9: CLI — birinchi adminni yaratish

**Files:**
- Create: `backend/app/cli.py`
- Create: `backend/tests/test_cli.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_cli.py`**

```python
from pathlib import Path

import pytest
from sqlalchemy import select

from app.auth.models import Role, User, UserStatus
from app.cli import create_admin, main
from app.core.config import Settings
from app.core.db import Base, make_engine, make_sessionmaker
from app.core.security import verify_password


async def test_create_admin_creates_then_updates(tmp_path: Path) -> None:
    settings = Settings(
        env="test",
        jwt_secret="c" * 40,
        database_url=f"sqlite+aiosqlite:///{(tmp_path / 'cli.db').as_posix()}",
    )
    engine = make_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    assert await create_admin(settings, "Boss@Mail.uz", "parol1234", "Boss") == "created"
    assert await create_admin(settings, "boss@mail.uz", "yangiparol1", "Boss") == "updated"

    async with make_sessionmaker(engine)() as db:
        user = await db.scalar(select(User).where(User.email == "boss@mail.uz"))
    await engine.dispose()
    assert user is not None
    assert (user.role, user.status) == (Role.admin, UserStatus.active)
    assert verify_password("yangiparol1", user.password_hash)


async def test_create_admin_rejects_short_password(tmp_path: Path) -> None:
    settings = Settings(env="test", jwt_secret="c" * 40)
    with pytest.raises(ValueError):
        await create_admin(settings, "boss@mail.uz", "123", "Boss")


def test_main_reports_error_for_short_password() -> None:
    assert main(["create-admin", "--email", "boss@mail.uz", "--password", "123"]) == 1
```

- [ ] **Step 2: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_cli.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.cli'`

- [ ] **Step 3: `backend/app/cli.py`**

```python
import argparse
import asyncio
import sys

from sqlalchemy import select

import app.models_registry  # noqa: F401
from app.auth.models import Role, User, UserStatus
from app.auth.service import normalize_email
from app.core.config import Settings, get_settings
from app.core.db import make_engine, make_sessionmaker
from app.core.security import hash_password

MIN_PASSWORD_LENGTH = 8


async def create_admin(settings: Settings, email: str, password: str, full_name: str) -> str:
    """Admin yaratadi yoki mavjud foydalanuvchini admin qiladi. "created"/"updated" qaytaradi."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Parol kamida {MIN_PASSWORD_LENGTH} belgidan iborat bo'lishi kerak")
    engine = make_engine(settings.database_url)
    try:
        async with make_sessionmaker(engine)() as db:
            normalized = normalize_email(email)
            user = await db.scalar(select(User).where(User.email == normalized))
            result = "updated"
            if user is None:
                user = User(email=normalized, full_name=full_name, password_hash="")
                db.add(user)
                result = "created"
            user.password_hash = hash_password(password)
            user.role = Role.admin
            user.status = UserStatus.active
            await db.commit()
            return result
    finally:
        await engine.dispose()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser(
        "create-admin", help="Admin yaratish yoki mavjud foydalanuvchini admin qilish"
    )
    create.add_argument("--email", required=True)
    create.add_argument("--password", required=True)
    create.add_argument("--name", default="Administrator")
    args = parser.parse_args(argv)

    try:
        result = asyncio.run(create_admin(get_settings(), args.email, args.password, args.name))
    except ValueError as exc:
        print(f"Xato: {exc}", file=sys.stderr)
        return 1
    print(f"Admin {result}: {normalize_email(args.email)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `57 passed`

- [ ] **Step 5: Commit**

```bash
cd .. && git add backend/app/cli.py backend/tests/test_cli.py
git commit -m "feat(backend): create-admin CLI command"
```

---

### Task 10: Learning — modellar, muharrir sxemalari va tahrirlash servisi

**Files:**
- Create: `backend/app/learning/__init__.py` (bo'sh), `backend/app/learning/models.py`, `backend/app/learning/schemas.py`, `backend/app/learning/editing.py`
- Modify: `backend/app/models_registry.py`
- Create: `backend/tests/test_learning_editing.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_learning_editing.py`**

```python
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.errors import AppError
from app.learning import editing
from app.learning.models import STEP_KINDS_IN_ORDER, Step
from app.learning.schemas import SubjectCreate, TopicCreate
from tests.factories import make_user


def test_slugify_handles_uzbek_apostrophes() -> None:
    assert editing.slugify("Kasb hunarga yo'naltirish fani") == "kasb-hunarga-yonaltirish-fani"
    assert editing.slugify("O‘quv  reja!") == "oquv-reja"


def test_slugify_transliterates_cyrillic() -> None:
    assert editing.slugify("Технология обучения") == "tekhnologiya-obucheniya"
    assert editing.slugify("Ўқув режа") == "oquv-rezha"


def test_slugify_falls_back_when_empty() -> None:
    assert editing.slugify("!!!") == "fan"


async def test_create_subject_generates_unique_slugs(db: AsyncSession) -> None:
    first = await editing.create_subject(db, SubjectCreate(title="Praktikum fani"))
    second = await editing.create_subject(db, SubjectCreate(title="Praktikum fani"))
    assert (first.slug, second.slug) == ("praktikum-fani", "praktikum-fani-2")


async def test_create_subject_rejects_taken_explicit_slug(db: AsyncSession) -> None:
    await editing.create_subject(db, SubjectCreate(title="Praktikum", slug="praktikum"))
    with pytest.raises(AppError) as exc:
        await editing.create_subject(db, SubjectCreate(title="Boshqa", slug="praktikum"))
    assert exc.value.code == "SLUG_TAKEN"


async def test_create_topic_creates_seven_ordered_steps(db: AsyncSession) -> None:
    subject = await editing.create_subject(db, SubjectCreate(title="Kasbiy kompetentlik"))
    first = await editing.create_topic(db, subject.id, TopicCreate(title="1-mavzu"))
    second = await editing.create_topic(db, subject.id, TopicCreate(title="2-mavzu"))
    assert (first.order, second.order) == (1, 2)
    steps = list(
        await db.scalars(select(Step).where(Step.topic_id == first.id).order_by(Step.order))
    )
    assert [s.kind for s in steps] == list(STEP_KINDS_IN_ORDER)
    assert [s.order for s in steps] == [1, 2, 3, 4, 5, 6, 7]


async def test_set_subject_teachers_accepts_only_teachers(db: AsyncSession) -> None:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    subject = await editing.create_subject(db, SubjectCreate(title="Fan"))

    assert await editing.set_subject_teachers(db, subject.id, [teacher.id, teacher.id]) == [
        teacher.id
    ]
    with pytest.raises(AppError) as exc:
        await editing.set_subject_teachers(db, subject.id, [student.id])
    assert exc.value.code == "NOT_A_TEACHER"
    assert exc.value.details == {"user_ids": [student.id]}


async def test_ensure_can_edit_subject(db: AsyncSession) -> None:
    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    other = await make_user(db, email="boshqa@mail.uz", role=Role.teacher)
    subject = await editing.create_subject(db, SubjectCreate(title="Fan"))
    await editing.set_subject_teachers(db, subject.id, [teacher.id])

    assert (await editing.ensure_can_edit_subject(db, admin, subject.id)).id == subject.id
    assert (await editing.ensure_can_edit_subject(db, teacher, subject.id)).id == subject.id
    with pytest.raises(AppError) as exc:
        await editing.ensure_can_edit_subject(db, other, subject.id)
    assert exc.value.code == "NOT_SUBJECT_TEACHER"
    with pytest.raises(AppError) as missing:
        await editing.ensure_can_edit_subject(db, admin, 9999)
    assert missing.value.code == "SUBJECT_NOT_FOUND"
```

- [ ] **Step 2: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_learning_editing.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'app.learning'`

- [ ] **Step 3: `backend/app/learning/models.py`**

```python
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, str_enum, utcnow


class StepKind(StrEnum):
    review = "review"
    lecture = "lecture"
    presentation = "presentation"
    practice = "practice"
    task = "task"
    glossary = "glossary"
    literature = "literature"


STEP_KINDS_IN_ORDER: tuple[StepKind, ...] = tuple(StepKind)
FILE_STEP_KINDS = frozenset({StepKind.lecture, StepKind.presentation})
SELF_COMPLETE_STEP_KINDS = frozenset(
    {StepKind.lecture, StepKind.presentation, StepKind.glossary, StepKind.literature}
)


class MaterialStatus(StrEnum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class ProgressStatus(StrEnum):
    in_progress = "in_progress"
    completed = "completed"


subject_teachers = Table(
    "subject_teachers",
    Base.metadata,
    Column(
        "subject_id", BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True
    ),
    Column("user_id", BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Subject(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "subjects"

    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    cover: Mapped[str | None] = mapped_column(String(500))
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)


class Topic(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "topics"

    subject_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(Text, default="")
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)


class Step(IdMixin, Base):
    __tablename__ = "steps"
    __table_args__ = (UniqueConstraint("topic_id", "kind"),)

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[StepKind] = mapped_column(str_enum(StepKind))
    order: Mapped[int] = mapped_column(Integer)


class Material(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "materials"

    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    original_file: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(255))
    pdf_file: Mapped[str | None] = mapped_column(String(500))
    page_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[MaterialStatus] = mapped_column(
        str_enum(MaterialStatus), default=MaterialStatus.processing
    )
    error: Mapped[str | None] = mapped_column(String(100))
    uploaded_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL")
    )


class GlossaryTerm(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "glossary_terms"

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    term: Mapped[str] = mapped_column(String(200))
    definition: Mapped[str] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)


class LiteratureItem(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "literature"

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    author: Mapped[str] = mapped_column(String(200), default="")
    year: Mapped[int | None] = mapped_column(Integer)
    url: Mapped[str | None] = mapped_column(String(500))
    order: Mapped[int] = mapped_column(Integer, default=0)


class StepProgress(IdMixin, Base):
    __tablename__ = "step_progress"
    __table_args__ = (UniqueConstraint("user_id", "step_id"),)

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[ProgressStatus] = mapped_column(
        str_enum(ProgressStatus), default=ProgressStatus.in_progress
    )
    best_score: Mapped[float | None] = mapped_column(Float)
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)
```

- [ ] **Step 4: `backend/app/learning/schemas.py`**

```python
from pydantic import BaseModel, ConfigDict, Field

from app.learning.models import MaterialStatus, StepKind

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
URL_PATTERN = r"^https?://\S+$"


class SubjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    description: str = Field(default="", max_length=5000)
    order: int = 0
    is_published: bool = False


class SubjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    description: str | None = Field(default=None, max_length=5000)
    order: int | None = None
    is_published: bool | None = None


class SubjectAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    description: str
    cover: str | None
    order: int
    is_published: bool
    teacher_ids: list[int] = []


class TeachersIn(BaseModel):
    teacher_ids: list[int] = Field(max_length=50)


class TopicCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    summary: str = Field(default="", max_length=5000)
    is_published: bool = False


class TopicUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    summary: str | None = Field(default=None, max_length=5000)
    is_published: bool | None = None


class TopicOrderIn(BaseModel):
    topic_ids: list[int]


class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    step_id: int
    title: str
    original_name: str
    page_count: int | None
    status: MaterialStatus
    error: str | None


class GlossaryIn(BaseModel):
    term: str = Field(min_length=1, max_length=200)
    definition: str = Field(min_length=1, max_length=5000)


class GlossaryUpdate(BaseModel):
    term: str | None = Field(default=None, min_length=1, max_length=200)
    definition: str | None = Field(default=None, min_length=1, max_length=5000)


class GlossaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    term: str
    definition: str
    order: int


class LiteratureIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    author: str = Field(default="", max_length=200)
    year: int | None = Field(default=None, ge=1900, le=2100)
    url: str | None = Field(default=None, max_length=500, pattern=URL_PATTERN)


class LiteratureUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    author: str | None = Field(default=None, max_length=200)
    year: int | None = Field(default=None, ge=1900, le=2100)
    url: str | None = Field(default=None, max_length=500, pattern=URL_PATTERN)


class LiteratureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    year: int | None
    url: str | None
    order: int


class StepEditorOut(BaseModel):
    id: int
    kind: StepKind
    order: int
    materials: list[MaterialOut]


class TopicEditorOut(BaseModel):
    id: int
    subject_id: int
    title: str
    summary: str
    order: int
    is_published: bool
    steps: list[StepEditorOut]
    glossary: list[GlossaryOut]
    literature: list[LiteratureOut]


class TeachTopicBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    order: int
    is_published: bool


class TeachSubjectOut(BaseModel):
    id: int
    title: str
    slug: str
    is_published: bool
    topics: list[TeachTopicBrief]
```

- [ ] **Step 5: `backend/app/learning/editing.py`**

```python
import re
from collections import defaultdict
from collections.abc import Sequence
from typing import Any

from sqlalchemy import ColumnElement, delete, func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.core.errors import AppError
from app.learning.models import (
    STEP_KINDS_IN_ORDER,
    GlossaryTerm,
    LiteratureItem,
    Material,
    Step,
    Subject,
    Topic,
    subject_teachers,
)
from app.learning.schemas import (
    GlossaryOut,
    LiteratureOut,
    MaterialOut,
    StepEditorOut,
    SubjectAdminOut,
    SubjectCreate,
    SubjectUpdate,
    TeachSubjectOut,
    TeachTopicBrief,
    TopicCreate,
    TopicEditorOut,
    TopicUpdate,
)

# --- slug ---------------------------------------------------------------------------------

_APOSTROPHES = "'ʻʼ’‘`"
_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "zh",
    "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o",
    "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
    "я": "ya", "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h",
}  # fmt: skip


def slugify(text: str) -> str:
    text = text.lower()
    for mark in _APOSTROPHES:
        text = text.replace(mark, "")
    text = "".join(_CYRILLIC.get(ch, ch) for ch in text)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:200] or "fan"


# --- subjects -----------------------------------------------------------------------------


async def get_subject(db: AsyncSession, subject_id: int) -> Subject:
    subject = await db.get(Subject, subject_id)
    if subject is None:
        raise AppError(404, "SUBJECT_NOT_FOUND", "Fan topilmadi")
    return subject


async def _slug_exists(db: AsyncSession, slug: str) -> bool:
    return await db.scalar(select(Subject.id).where(Subject.slug == slug)) is not None


async def _unique_slug(db: AsyncSession, base: str) -> str:
    slug, suffix = base, 2
    while await _slug_exists(db, slug):
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


async def create_subject(db: AsyncSession, data: SubjectCreate) -> Subject:
    if data.slug:
        if await _slug_exists(db, data.slug):
            raise AppError(409, "SLUG_TAKEN", "Bu slug band")
        slug = data.slug
    else:
        slug = await _unique_slug(db, slugify(data.title))
    subject = Subject(
        title=data.title.strip(),
        slug=slug,
        description=data.description,
        order=data.order,
        is_published=data.is_published,
    )
    db.add(subject)
    await db.commit()
    return subject


async def update_subject(db: AsyncSession, subject: Subject, data: SubjectUpdate) -> Subject:
    values = data.model_dump(exclude_unset=True)
    new_slug = values.get("slug")
    if new_slug and new_slug != subject.slug and await _slug_exists(db, new_slug):
        raise AppError(409, "SLUG_TAKEN", "Bu slug band")
    for field, value in values.items():
        if value is not None:
            setattr(subject, field, value)
    await db.commit()
    return subject


async def _material_paths(db: AsyncSession, *conditions: ColumnElement[bool]) -> list[str]:
    rows = await db.execute(
        select(Material.original_file, Material.pdf_file)
        .join(Step, Material.step_id == Step.id)
        .join(Topic, Step.topic_id == Topic.id)
        .where(*conditions)
    )
    return sorted({path for row in rows for path in row if path})


async def delete_subject(db: AsyncSession, subject: Subject) -> list[str]:
    """Fanni o'chiradi va diskdan o'chirilishi kerak bo'lgan fayl yo'llarini qaytaradi."""
    paths = await _material_paths(db, Topic.subject_id == subject.id)
    await db.delete(subject)
    await db.commit()
    return paths


async def teacher_ids_for(db: AsyncSession, subject_ids: Sequence[int]) -> dict[int, list[int]]:
    result: dict[int, list[int]] = {sid: [] for sid in subject_ids}
    if subject_ids:
        rows = await db.execute(
            select(subject_teachers.c.subject_id, subject_teachers.c.user_id)
            .where(subject_teachers.c.subject_id.in_(subject_ids))
            .order_by(subject_teachers.c.user_id)
        )
        for subject_id, user_id in rows:
            result[subject_id].append(user_id)
    return result


async def set_subject_teachers(
    db: AsyncSession, subject_id: int, teacher_ids: Sequence[int]
) -> list[int]:
    await get_subject(db, subject_id)
    ids = sorted(set(teacher_ids))
    if ids:
        found = set(
            await db.scalars(select(User.id).where(User.id.in_(ids), User.role == Role.teacher))
        )
        missing = [uid for uid in ids if uid not in found]
        if missing:
            raise AppError(
                400, "NOT_A_TEACHER", "Faqat o'qituvchilarni biriktirish mumkin", {"user_ids": missing}
            )
    await db.execute(delete(subject_teachers).where(subject_teachers.c.subject_id == subject_id))
    if ids:
        await db.execute(
            insert(subject_teachers), [{"subject_id": subject_id, "user_id": uid} for uid in ids]
        )
    await db.commit()
    return ids


async def subject_admin_out(db: AsyncSession, subject: Subject) -> SubjectAdminOut:
    ids = (await teacher_ids_for(db, [subject.id]))[subject.id]
    return SubjectAdminOut.model_validate(subject).model_copy(update={"teacher_ids": ids})


async def list_subjects_admin(db: AsyncSession) -> list[SubjectAdminOut]:
    subjects = list(await db.scalars(select(Subject).order_by(Subject.order, Subject.id)))
    ids = await teacher_ids_for(db, [s.id for s in subjects])
    return [
        SubjectAdminOut.model_validate(s).model_copy(update={"teacher_ids": ids[s.id]})
        for s in subjects
    ]


# --- permissions --------------------------------------------------------------------------


async def can_edit_subject(db: AsyncSession, user: User, subject_id: int) -> bool:
    if user.role == Role.admin:
        return True
    if user.role != Role.teacher:
        return False
    count = await db.scalar(
        select(func.count())
        .select_from(subject_teachers)
        .where(
            subject_teachers.c.subject_id == subject_id,
            subject_teachers.c.user_id == user.id,
        )
    )
    return bool(count)


async def ensure_can_edit_subject(db: AsyncSession, user: User, subject_id: int) -> Subject:
    subject = await get_subject(db, subject_id)
    if not await can_edit_subject(db, user, subject_id):
        raise AppError(403, "NOT_SUBJECT_TEACHER", "Siz bu fanga biriktirilmagansiz")
    return subject


async def get_topic(db: AsyncSession, topic_id: int) -> Topic:
    topic = await db.get(Topic, topic_id)
    if topic is None:
        raise AppError(404, "TOPIC_NOT_FOUND", "Mavzu topilmadi")
    return topic


async def ensure_can_edit_topic(db: AsyncSession, user: User, topic_id: int) -> Topic:
    topic = await get_topic(db, topic_id)
    await ensure_can_edit_subject(db, user, topic.subject_id)
    return topic


async def get_step(db: AsyncSession, step_id: int) -> Step:
    step = await db.get(Step, step_id)
    if step is None:
        raise AppError(404, "STEP_NOT_FOUND", "Bosqich topilmadi")
    return step


async def ensure_can_edit_step(db: AsyncSession, user: User, step_id: int) -> tuple[Step, Topic]:
    step = await get_step(db, step_id)
    topic = await ensure_can_edit_topic(db, user, step.topic_id)
    return step, topic


# --- topics -------------------------------------------------------------------------------


async def create_topic(db: AsyncSession, subject_id: int, data: TopicCreate) -> Topic:
    current_max = await db.scalar(
        select(func.max(Topic.order)).where(Topic.subject_id == subject_id)
    )
    topic = Topic(
        subject_id=subject_id,
        order=(current_max or 0) + 1,
        title=data.title.strip(),
        summary=data.summary,
        is_published=data.is_published,
    )
    db.add(topic)
    await db.flush()
    for index, kind in enumerate(STEP_KINDS_IN_ORDER, start=1):
        db.add(Step(topic_id=topic.id, kind=kind, order=index))
    await db.commit()
    return topic


async def update_topic(db: AsyncSession, topic: Topic, data: TopicUpdate) -> Topic:
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(topic, field, value)
    await db.commit()
    return topic


async def delete_topic(db: AsyncSession, topic: Topic) -> list[str]:
    paths = await _material_paths(db, Step.topic_id == topic.id)
    await db.delete(topic)
    await db.commit()
    return paths


async def reorder_topics(db: AsyncSession, subject_id: int, topic_ids: list[int]) -> list[Topic]:
    existing = list(await db.scalars(select(Topic).where(Topic.subject_id == subject_id)))
    if len(set(topic_ids)) != len(topic_ids) or sorted(t.id for t in existing) != sorted(
        topic_ids
    ):
        raise AppError(400, "INVALID_ORDER", "Mavzular ro'yxati fan mavzulariga mos emas")
    by_id = {t.id: t for t in existing}
    for position, topic_id in enumerate(topic_ids, start=1):
        by_id[topic_id].order = position
    await db.commit()
    return [by_id[tid] for tid in topic_ids]


async def list_teach_subjects(db: AsyncSession, user: User) -> list[TeachSubjectOut]:
    stmt = select(Subject).order_by(Subject.order, Subject.id)
    if user.role != Role.admin:
        stmt = stmt.join(subject_teachers, subject_teachers.c.subject_id == Subject.id).where(
            subject_teachers.c.user_id == user.id
        )
    subjects = list(await db.scalars(stmt))
    by_subject: dict[int, list[TeachTopicBrief]] = defaultdict(list)
    if subjects:
        topics = await db.scalars(
            select(Topic)
            .where(Topic.subject_id.in_([s.id for s in subjects]))
            .order_by(Topic.order, Topic.id)
        )
        for topic in topics:
            by_subject[topic.subject_id].append(TeachTopicBrief.model_validate(topic))
    return [
        TeachSubjectOut(
            id=s.id,
            title=s.title,
            slug=s.slug,
            is_published=s.is_published,
            topics=by_subject[s.id],
        )
        for s in subjects
    ]


async def topic_editor_view(db: AsyncSession, topic: Topic) -> TopicEditorOut:
    steps = list(
        await db.scalars(select(Step).where(Step.topic_id == topic.id).order_by(Step.order))
    )
    materials_by_step: dict[int, list[MaterialOut]] = defaultdict(list)
    materials = await db.scalars(
        select(Material).where(Material.step_id.in_([s.id for s in steps])).order_by(Material.id)
    )
    for material in materials:
        materials_by_step[material.step_id].append(MaterialOut.model_validate(material))
    glossary = await db.scalars(
        select(GlossaryTerm)
        .where(GlossaryTerm.topic_id == topic.id)
        .order_by(GlossaryTerm.order, GlossaryTerm.id)
    )
    literature = await db.scalars(
        select(LiteratureItem)
        .where(LiteratureItem.topic_id == topic.id)
        .order_by(LiteratureItem.order, LiteratureItem.id)
    )
    return TopicEditorOut(
        id=topic.id,
        subject_id=topic.subject_id,
        title=topic.title,
        summary=topic.summary,
        order=topic.order,
        is_published=topic.is_published,
        steps=[
            StepEditorOut(id=s.id, kind=s.kind, order=s.order, materials=materials_by_step[s.id])
            for s in steps
        ],
        glossary=[GlossaryOut.model_validate(g) for g in glossary],
        literature=[LiteratureOut.model_validate(item) for item in literature],
    )


def apply_update(obj: Any, values: dict[str, Any], nullable: frozenset[str]) -> None:
    """PATCH qiymatlarini qo'llaydi: `None` faqat `nullable` maydonlarda qiymatni tozalaydi."""
    for field, value in values.items():
        if value is None and field not in nullable:
            continue
        setattr(obj, field, value)
```

- [ ] **Step 6: `backend/app/models_registry.py` ni yangilash**

```python
"""Barcha ORM modellarini import qiladi: Alembic autogenerate va testlardagi create_all uchun.

Har bir yangi modul modeli shu yerga qo'shiladi.
"""

import app.auth.models  # noqa: F401
import app.learning.models  # noqa: F401
```

- [ ] **Step 7: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `65 passed`

- [ ] **Step 8: Commit**

```bash
cd .. && git add backend/app/learning backend/app/models_registry.py backend/tests/test_learning_editing.py
git commit -m "feat(learning): subject/topic models, 7-step topics, editing service and permissions"
```

---

### Task 11: Admin — fanlar API

**Files:**
- Create: `backend/app/learning/admin_router.py`
- Modify: `backend/app/api.py`, `backend/tests/factories.py`
- Create: `backend/tests/test_admin_subjects.py`

- [ ] **Step 1: `backend/tests/factories.py` (2-versiya — to'liq almashtiring)**

```python
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User, UserStatus
from app.core.config import Settings
from app.core.security import create_access_token, hash_password
from app.learning import editing
from app.learning.models import Step, StepKind, Subject, Topic
from app.learning.schemas import SubjectCreate, TopicCreate

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


async def make_subject(
    db: AsyncSession,
    *,
    title: str = "Kasb tanlash",
    published: bool = True,
    teachers: Sequence[User] = (),
    order: int = 0,
) -> Subject:
    subject = await editing.create_subject(
        db, SubjectCreate(title=title, is_published=published, order=order)
    )
    if teachers:
        await editing.set_subject_teachers(db, subject.id, [t.id for t in teachers])
    return subject


async def make_topic(
    db: AsyncSession, subject: Subject, *, title: str = "1-mavzu", published: bool = True
) -> Topic:
    return await editing.create_topic(
        db, subject.id, TopicCreate(title=title, is_published=published)
    )


async def step_of(db: AsyncSession, topic: Topic, kind: StepKind) -> Step:
    step = await db.scalar(select(Step).where(Step.topic_id == topic.id, Step.kind == kind))
    assert step is not None
    return step
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_admin_subjects.py`**

```python
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.learning.models import Topic
from tests.factories import auth_headers, make_subject, make_topic, make_user


async def admin_headers(db: AsyncSession, settings: Settings) -> dict[str, str]:
    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)
    return auth_headers(admin, settings)


async def test_create_subject_with_generated_slug(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    payload = {"title": "Kasb hunarga yo'naltirish fani", "is_published": True}
    first = await client.post("/api/admin/subjects", headers=headers, json=payload)
    second = await client.post("/api/admin/subjects", headers=headers, json=payload)
    assert first.status_code == 201, first.text
    assert first.json()["slug"] == "kasb-hunarga-yonaltirish-fani"
    assert first.json()["teacher_ids"] == []
    assert second.json()["slug"] == "kasb-hunarga-yonaltirish-fani-2"


async def test_explicit_duplicate_slug_is_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    await client.post("/api/admin/subjects", headers=headers, json={"title": "A", "slug": "fan"})
    response = await client.post(
        "/api/admin/subjects", headers=headers, json={"title": "B fan", "slug": "fan"}
    )
    assert response.status_code == 409
    assert response.json()["code"] == "SLUG_TAKEN"


async def test_list_and_update_subject(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    subject = await make_subject(db, title="Praktikum", published=False)
    response = await client.patch(
        f"/api/admin/subjects/{subject.id}",
        headers=headers,
        json={"title": "Praktikum fani", "is_published": True},
    )
    assert response.status_code == 200
    listed = await client.get("/api/admin/subjects", headers=headers)
    assert [(s["title"], s["is_published"]) for s in listed.json()] == [("Praktikum fani", True)]


async def test_delete_subject_removes_topics(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    subject = await make_subject(db)
    await make_topic(db, subject)
    response = await client.delete(f"/api/admin/subjects/{subject.id}", headers=headers)
    assert response.status_code == 204
    assert (await client.get("/api/admin/subjects", headers=headers)).json() == []
    assert await db.scalar(select(func.count()).select_from(Topic)) == 0


async def test_assign_teachers(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    subject = await make_subject(db)

    ok = await client.put(
        f"/api/admin/subjects/{subject.id}/teachers",
        headers=headers,
        json={"teacher_ids": [teacher.id]},
    )
    assert ok.status_code == 200
    assert ok.json()["teacher_ids"] == [teacher.id]

    bad = await client.put(
        f"/api/admin/subjects/{subject.id}/teachers",
        headers=headers,
        json={"teacher_ids": [student.id]},
    )
    assert bad.status_code == 400
    assert bad.json()["code"] == "NOT_A_TEACHER"
    assert bad.json()["details"] == {"user_ids": [student.id]}


async def test_unknown_subject_is_404(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    headers = await admin_headers(db, settings)
    response = await client.patch("/api/admin/subjects/9999", headers=headers, json={"order": 1})
    assert response.status_code == 404
    assert response.json()["code"] == "SUBJECT_NOT_FOUND"


async def test_students_cannot_manage_subjects(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    student = await make_user(db)
    response = await client.get("/api/admin/subjects", headers=auth_headers(student, settings))
    assert response.status_code == 403
```

- [ ] **Step 3: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_admin_subjects.py -q`
Expected: FAIL — `/api/admin/subjects` uchun `404`

- [ ] **Step 4: `backend/app/learning/admin_router.py`**

```python
from fastapi import APIRouter, Response

from app.auth.deps import AdminUser
from app.core.deps import AppStorage, DbSession
from app.learning import editing
from app.learning.schemas import SubjectAdminOut, SubjectCreate, SubjectUpdate, TeachersIn

router = APIRouter(prefix="/admin/subjects", tags=["admin"])


@router.get("", response_model=list[SubjectAdminOut])
async def list_subjects(admin: AdminUser, db: DbSession) -> list[SubjectAdminOut]:
    return await editing.list_subjects_admin(db)


@router.post("", response_model=SubjectAdminOut, status_code=201)
async def create_subject(data: SubjectCreate, admin: AdminUser, db: DbSession) -> SubjectAdminOut:
    subject = await editing.create_subject(db, data)
    return await editing.subject_admin_out(db, subject)


@router.patch("/{subject_id}", response_model=SubjectAdminOut)
async def update_subject(
    subject_id: int, data: SubjectUpdate, admin: AdminUser, db: DbSession
) -> SubjectAdminOut:
    subject = await editing.get_subject(db, subject_id)
    subject = await editing.update_subject(db, subject, data)
    return await editing.subject_admin_out(db, subject)


@router.delete("/{subject_id}", status_code=204)
async def delete_subject(
    subject_id: int, admin: AdminUser, db: DbSession, storage: AppStorage
) -> Response:
    subject = await editing.get_subject(db, subject_id)
    for path in await editing.delete_subject(db, subject):
        storage.delete(path)
    return Response(status_code=204)


@router.put("/{subject_id}/teachers", response_model=SubjectAdminOut)
async def set_teachers(
    subject_id: int, data: TeachersIn, admin: AdminUser, db: DbSession
) -> SubjectAdminOut:
    await editing.set_subject_teachers(db, subject_id, data.teacher_ids)
    return await editing.subject_admin_out(db, await editing.get_subject(db, subject_id))
```

- [ ] **Step 5: `backend/app/api.py` ni yangilash**

```python
from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_subjects_router)
```

- [ ] **Step 6: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `72 passed`

- [ ] **Step 7: Commit**

```bash
cd .. && git add backend/app/learning/admin_router.py backend/app/api.py backend/tests/factories.py backend/tests/test_admin_subjects.py
git commit -m "feat(admin): subjects CRUD and teacher assignment API"
```

---

### Task 12: O'qituvchi — mavzular API

**Files:**
- Create: `backend/app/learning/teach_router.py`
- Modify: `backend/app/api.py`
- Create: `backend/tests/test_teach_topics.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_teach_topics.py`**

```python
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.core.config import Settings
from app.learning.models import Subject
from tests.factories import auth_headers, make_subject, make_topic, make_user


async def teacher_with_subject(db: AsyncSession) -> tuple[User, Subject]:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    subject = await make_subject(db, teachers=[teacher])
    return teacher, subject


async def test_assigned_teacher_creates_topic_with_seven_steps(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, subject = await teacher_with_subject(db)
    headers = auth_headers(teacher, settings)
    first = await client.post(
        f"/api/teach/subjects/{subject.id}/topics", headers=headers, json={"title": "1-mavzu"}
    )
    second = await client.post(
        f"/api/teach/subjects/{subject.id}/topics", headers=headers, json={"title": "2-mavzu"}
    )
    assert first.status_code == 201, first.text
    body = first.json()
    assert [s["kind"] for s in body["steps"]] == [
        "review", "lecture", "presentation", "practice", "task", "glossary", "literature",
    ]  # fmt: skip
    assert (body["order"], second.json()["order"]) == (1, 2)
    assert body["is_published"] is False


async def test_unassigned_teacher_and_student_are_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    _, subject = await teacher_with_subject(db)
    other = await make_user(db, email="boshqa@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    url = f"/api/teach/subjects/{subject.id}/topics"

    denied = await client.post(url, headers=auth_headers(other, settings), json={"title": "X mavzu"})
    assert denied.status_code == 403
    assert denied.json()["code"] == "NOT_SUBJECT_TEACHER"
    student_denied = await client.post(
        url, headers=auth_headers(student, settings), json={"title": "X mavzu"}
    )
    assert student_denied.json()["code"] == "FORBIDDEN"


async def test_unknown_subject_is_404(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, _ = await teacher_with_subject(db)
    response = await client.post(
        "/api/teach/subjects/9999/topics",
        headers=auth_headers(teacher, settings),
        json={"title": "X mavzu"},
    )
    assert response.status_code == 404
    assert response.json()["code"] == "SUBJECT_NOT_FOUND"


async def test_teacher_sees_only_assigned_subjects_admin_sees_all(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, subject = await teacher_with_subject(db)
    await make_topic(db, subject)
    await make_subject(db, title="Boshqa fan")
    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)

    mine = await client.get("/api/teach/subjects", headers=auth_headers(teacher, settings))
    assert [s["id"] for s in mine.json()] == [subject.id]
    assert [t["title"] for t in mine.json()[0]["topics"]] == ["1-mavzu"]
    everything = await client.get("/api/teach/subjects", headers=auth_headers(admin, settings))
    assert len(everything.json()) == 2


async def test_update_and_delete_topic(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, subject = await teacher_with_subject(db)
    topic = await make_topic(db, subject, published=False)
    headers = auth_headers(teacher, settings)

    updated = await client.patch(
        f"/api/teach/topics/{topic.id}",
        headers=headers,
        json={"title": "Kasb turlari", "is_published": True},
    )
    assert updated.status_code == 200
    assert (updated.json()["title"], updated.json()["is_published"]) == ("Kasb turlari", True)

    deleted = await client.delete(f"/api/teach/topics/{topic.id}", headers=headers)
    assert deleted.status_code == 204
    missing = await client.get(f"/api/teach/topics/{topic.id}", headers=headers)
    assert missing.status_code == 404
    assert missing.json()["code"] == "TOPIC_NOT_FOUND"


async def test_reorder_topics(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher, subject = await teacher_with_subject(db)
    first = await make_topic(db, subject, title="Birinchi")
    second = await make_topic(db, subject, title="Ikkinchi")
    headers = auth_headers(teacher, settings)
    url = f"/api/teach/subjects/{subject.id}/topics/order"

    bad = await client.put(url, headers=headers, json={"topic_ids": [first.id]})
    assert bad.status_code == 400
    assert bad.json()["code"] == "INVALID_ORDER"

    ok = await client.put(url, headers=headers, json={"topic_ids": [second.id, first.id]})
    assert ok.status_code == 200
    assert [(t["title"], t["order"]) for t in ok.json()] == [("Ikkinchi", 1), ("Birinchi", 2)]
```

- [ ] **Step 2: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_teach_topics.py -q`
Expected: FAIL — `/api/teach/...` uchun `404`

- [ ] **Step 3: `backend/app/learning/teach_router.py`**

```python
from fastapi import APIRouter, Response

from app.auth.deps import StaffUser
from app.core.deps import AppStorage, DbSession
from app.learning import editing
from app.learning.schemas import (
    TeachSubjectOut,
    TeachTopicBrief,
    TopicCreate,
    TopicEditorOut,
    TopicOrderIn,
    TopicUpdate,
)

router = APIRouter(prefix="/teach", tags=["teach"])


@router.get("/subjects", response_model=list[TeachSubjectOut])
async def my_subjects(user: StaffUser, db: DbSession) -> list[TeachSubjectOut]:
    return await editing.list_teach_subjects(db, user)


@router.post("/subjects/{subject_id}/topics", response_model=TopicEditorOut, status_code=201)
async def create_topic(
    subject_id: int, data: TopicCreate, user: StaffUser, db: DbSession
) -> TopicEditorOut:
    await editing.ensure_can_edit_subject(db, user, subject_id)
    topic = await editing.create_topic(db, subject_id, data)
    return await editing.topic_editor_view(db, topic)


@router.put("/subjects/{subject_id}/topics/order", response_model=list[TeachTopicBrief])
async def reorder_topics(
    subject_id: int, data: TopicOrderIn, user: StaffUser, db: DbSession
) -> list[TeachTopicBrief]:
    await editing.ensure_can_edit_subject(db, user, subject_id)
    topics = await editing.reorder_topics(db, subject_id, data.topic_ids)
    return [TeachTopicBrief.model_validate(t) for t in topics]


@router.get("/topics/{topic_id}", response_model=TopicEditorOut)
async def get_topic(topic_id: int, user: StaffUser, db: DbSession) -> TopicEditorOut:
    topic = await editing.ensure_can_edit_topic(db, user, topic_id)
    return await editing.topic_editor_view(db, topic)


@router.patch("/topics/{topic_id}", response_model=TopicEditorOut)
async def update_topic(
    topic_id: int, data: TopicUpdate, user: StaffUser, db: DbSession
) -> TopicEditorOut:
    topic = await editing.ensure_can_edit_topic(db, user, topic_id)
    topic = await editing.update_topic(db, topic, data)
    return await editing.topic_editor_view(db, topic)


@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(
    topic_id: int, user: StaffUser, db: DbSession, storage: AppStorage
) -> Response:
    topic = await editing.ensure_can_edit_topic(db, user, topic_id)
    for path in await editing.delete_topic(db, topic):
        storage.delete(path)
    return Response(status_code=204)
```

- [ ] **Step 4: `backend/app/api.py` ni yangilash**

```python
from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router
from app.learning.teach_router import router as teach_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_subjects_router)
api_router.include_router(teach_router)
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `78 passed`

- [ ] **Step 6: Commit**

```bash
cd .. && git add backend/app/learning/teach_router.py backend/app/api.py backend/tests/test_teach_topics.py
git commit -m "feat(teach): topic create/update/delete/reorder API for assigned teachers"
```

---

### Task 13: Materiallar — yuklash, PPT/DOC → PDF konvertatsiyasi, qayta urinish, o'chirish

**Files:**
- Create: `backend/app/learning/convert.py`, `backend/app/learning/materials.py`, `backend/app/learning/teach_materials_router.py`
- Modify: `backend/app/api.py`, `backend/tests/factories.py`
- Create: `backend/tests/test_convert.py`, `backend/tests/test_materials.py`

- [ ] **Step 1: `backend/tests/factories.py` oxiriga PDF yordamchilarini qo'shish**

Fayl boshidagi importlarga qo'shing (alifbo tartibida, `sqlalchemy` importlaridan oldin):

```python
import pymupdf
from httpx import AsyncClient
```

Fayl oxiriga qo'shing:

```python
def make_pdf_bytes(pages: int = 2) -> bytes:
    document = pymupdf.open()
    for _ in range(pages):
        document.new_page()
    data = document.tobytes()
    document.close()
    return data


async def add_ready_pdf(
    client: AsyncClient,
    headers: dict[str, str],
    step_id: int,
    *,
    title: str = "Mavzu bayoni",
    pages: int = 2,
) -> dict[str, object]:
    response = await client.post(
        f"/api/teach/steps/{step_id}/materials",
        headers=headers,
        data={"title": title},
        files={"file": ("bayon.pdf", make_pdf_bytes(pages), "application/pdf")},
    )
    assert response.status_code == 201, response.text
    body: dict[str, object] = response.json()
    return body
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_convert.py`**

```python
from pathlib import Path

import pytest

from app.learning import convert
from tests.factories import make_pdf_bytes


async def test_missing_libreoffice_is_reported(tmp_path: Path) -> None:
    source = tmp_path / "slides.pptx"
    source.write_bytes(b"fake")
    with pytest.raises(convert.ConversionError) as exc:
        await convert.convert_to_pdf(
            source, tmp_path, soffice=str(tmp_path / "no-soffice.exe"), timeout=5
        )
    assert exc.value.code == "LIBREOFFICE_NOT_FOUND"


def test_count_pages(tmp_path: Path) -> None:
    pdf = tmp_path / "doc.pdf"
    pdf.write_bytes(make_pdf_bytes(5))
    assert convert.count_pages(pdf) == 5


def test_count_pages_rejects_garbage(tmp_path: Path) -> None:
    broken = tmp_path / "broken.pdf"
    broken.write_bytes(b"this is not a pdf")
    with pytest.raises(convert.ConversionError) as exc:
        convert.count_pages(broken)
    assert exc.value.code == "INVALID_PDF"
```

- [ ] **Step 3: Failing testlar — `backend/tests/test_materials.py`**

```python
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.learning import convert
from app.learning.models import StepKind
from tests.factories import (
    add_ready_pdf,
    auth_headers,
    make_pdf_bytes,
    make_subject,
    make_topic,
    make_user,
    step_of,
)

PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
Converter = Callable[..., Awaitable[Path]]


def fake_converter(pages: int = 3) -> Converter:
    async def _convert(source: Path, out_dir: Path, *, soffice: str, timeout: int) -> Path:
        output = out_dir / f"{source.stem}.pdf"
        output.write_bytes(make_pdf_bytes(pages))
        return output

    return _convert


@pytest.fixture
async def course(db: AsyncSession, settings: Settings) -> dict[str, Any]:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    subject = await make_subject(db, teachers=[teacher])
    topic = await make_topic(db, subject)
    return {
        "headers": auth_headers(teacher, settings),
        "topic_id": topic.id,
        "lecture_id": (await step_of(db, topic, StepKind.lecture)).id,
        "review_id": (await step_of(db, topic, StepKind.review)).id,
    }


async def upload_pptx(client: AsyncClient, course: dict[str, Any]) -> dict[str, Any]:
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=course["headers"],
        data={"title": "Taqdimot"},
        files={"file": ("slaydlar.pptx", b"PK fake pptx", PPTX_MIME)},
    )
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


async def lecture_materials(client: AsyncClient, course: dict[str, Any]) -> list[dict[str, Any]]:
    editor = await client.get(f"/api/teach/topics/{course['topic_id']}", headers=course["headers"])
    lecture = next(s for s in editor.json()["steps"] if s["kind"] == "lecture")
    materials: list[dict[str, Any]] = lecture["materials"]
    return materials


async def test_pdf_upload_is_ready_immediately(
    client: AsyncClient, course: dict[str, Any]
) -> None:
    material = await add_ready_pdf(client, course["headers"], course["lecture_id"], pages=3)
    assert (material["status"], material["page_count"]) == ("ready", 3)
    assert material["original_name"] == "bayon.pdf"


async def test_upload_to_review_step_is_rejected(
    client: AsyncClient, course: dict[str, Any]
) -> None:
    response = await client.post(
        f"/api/teach/steps/{course['review_id']}/materials",
        headers=course["headers"],
        data={"title": "Test"},
        files={"file": ("a.pdf", make_pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "STEP_DOES_NOT_ACCEPT_FILES"


async def test_upload_rejects_unsupported_type(
    client: AsyncClient, course: dict[str, Any]
) -> None:
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=course["headers"],
        data={"title": "Virus"},
        files={"file": ("virus.exe", b"MZ", "application/octet-stream")},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "UNSUPPORTED_FILE_TYPE"


async def test_upload_rejects_broken_pdf(client: AsyncClient, course: dict[str, Any]) -> None:
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=course["headers"],
        data={"title": "Buzuq"},
        files={"file": ("buzuq.pdf", b"not a pdf", "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_PDF"


async def test_pptx_is_converted_in_background(
    app: FastAPI, client: AsyncClient, course: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(convert, "convert_to_pdf", fake_converter(pages=4))
    uploaded = await upload_pptx(client, course)
    assert uploaded["status"] == "processing"
    await app.state.jobs.drain()
    [material] = await lecture_materials(client, course)
    assert (material["status"], material["page_count"]) == ("ready", 4)


async def test_conversion_retries_transient_failures(
    app: FastAPI, client: AsyncClient, course: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    attempts: list[int] = []

    async def flaky(source: Path, out_dir: Path, *, soffice: str, timeout: int) -> Path:
        attempts.append(1)
        if len(attempts) < 3:
            raise convert.ConversionError("CONVERSION_FAILED")
        return await fake_converter(1)(source, out_dir, soffice=soffice, timeout=timeout)

    monkeypatch.setattr(convert, "convert_to_pdf", flaky)
    await upload_pptx(client, course)
    await app.state.jobs.drain()
    [material] = await lecture_materials(client, course)
    assert material["status"] == "ready"
    assert len(attempts) == 3


async def test_missing_libreoffice_fails_then_retry_succeeds(
    app: FastAPI, client: AsyncClient, course: dict[str, Any], monkeypatch: pytest.MonkeyPatch
) -> None:
    async def missing(source: Path, out_dir: Path, *, soffice: str, timeout: int) -> Path:
        raise convert.ConversionError("LIBREOFFICE_NOT_FOUND")

    monkeypatch.setattr(convert, "convert_to_pdf", missing)
    uploaded = await upload_pptx(client, course)
    await app.state.jobs.drain()
    [failed] = await lecture_materials(client, course)
    assert (failed["status"], failed["error"]) == ("failed", "LIBREOFFICE_NOT_FOUND")

    monkeypatch.setattr(convert, "convert_to_pdf", fake_converter(pages=2))
    retried = await client.post(
        f"/api/teach/materials/{uploaded['id']}/retry", headers=course["headers"]
    )
    assert retried.status_code == 200
    assert retried.json()["status"] == "processing"
    await app.state.jobs.drain()
    [ready] = await lecture_materials(client, course)
    assert (ready["status"], ready["error"]) == ("ready", None)


async def test_retry_requires_failed_status(client: AsyncClient, course: dict[str, Any]) -> None:
    material = await add_ready_pdf(client, course["headers"], course["lecture_id"])
    response = await client.post(
        f"/api/teach/materials/{material['id']}/retry", headers=course["headers"]
    )
    assert response.status_code == 400
    assert response.json()["code"] == "MATERIAL_NOT_FAILED"


async def test_delete_material_removes_files(
    client: AsyncClient, course: dict[str, Any], settings: Settings
) -> None:
    material = await add_ready_pdf(client, course["headers"], course["lecture_id"])
    media = Path(settings.media_root) / "materials"
    assert len(list(media.iterdir())) == 1
    response = await client.delete(
        f"/api/teach/materials/{material['id']}", headers=course["headers"]
    )
    assert response.status_code == 204
    assert list(media.iterdir()) == []
    assert await lecture_materials(client, course) == []


async def test_unassigned_teacher_cannot_upload(
    client: AsyncClient, db: AsyncSession, settings: Settings, course: dict[str, Any]
) -> None:
    other = await make_user(db, email="boshqa@mail.uz", role=Role.teacher)
    response = await client.post(
        f"/api/teach/steps/{course['lecture_id']}/materials",
        headers=auth_headers(other, settings),
        data={"title": "Bayon"},
        files={"file": ("a.pdf", make_pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "NOT_SUBJECT_TEACHER"
```

- [ ] **Step 4: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_convert.py tests/test_materials.py -q`
Expected: FAIL — `ImportError: cannot import name 'convert' from 'app.learning'`

- [ ] **Step 5: `backend/app/learning/convert.py`**

```python
import asyncio
import shutil
import subprocess
from pathlib import Path

import pymupdf


class ConversionError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def _resolve_soffice(soffice: str) -> str | None:
    found = shutil.which(soffice)
    if found:
        return found
    return soffice if Path(soffice).is_file() else None


async def convert_to_pdf(source: Path, out_dir: Path, *, soffice: str, timeout: int) -> Path:
    """LibreOffice (headless) yordamida PPT/PPTX/DOC/DOCX faylni PDF'ga aylantiradi."""
    executable = _resolve_soffice(soffice)
    if executable is None:
        raise ConversionError("LIBREOFFICE_NOT_FOUND")
    command = [
        executable,
        "--headless",
        "--norestore",
        "--convert-to",
        "pdf",
        "--outdir",
        str(out_dir),
        str(source),
    ]
    try:
        # Windows'da ham ishonchli ishlashi uchun subprocess alohida thread'da ishga tushiriladi.
        result = await asyncio.to_thread(
            subprocess.run, command, capture_output=True, timeout=timeout, check=False
        )
    except subprocess.TimeoutExpired as exc:
        raise ConversionError("CONVERSION_TIMEOUT") from exc
    output = out_dir / f"{source.stem}.pdf"
    if result.returncode != 0 or not output.is_file():
        raise ConversionError("CONVERSION_FAILED")
    return output


def count_pages(pdf: Path) -> int:
    try:
        with pymupdf.open(pdf) as document:
            if not document.is_pdf:
                raise ConversionError("INVALID_PDF")
            return int(document.page_count)
    except ConversionError:
        raise
    except Exception as exc:
        raise ConversionError("INVALID_PDF") from exc
```

- [ ] **Step 6: `backend/app/learning/materials.py`**

```python
import tempfile
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.config import Settings
from app.core.errors import AppError
from app.core.jobs import JobContext, JobRunner, job
from app.core.storage import Storage
from app.learning import convert, editing
from app.learning.models import FILE_STEP_KINDS, Material, MaterialStatus, Step

ALLOWED_MATERIAL_EXT = frozenset({".pdf", ".ppt", ".pptx", ".doc", ".docx"})
CONVERT_JOB = "convert_material"
MAX_CONVERSION_ATTEMPTS = 3


async def add_material(
    db: AsyncSession,
    *,
    step: Step,
    title: str,
    upload: UploadFile,
    user: User,
    storage: Storage,
    settings: Settings,
    jobs: JobRunner,
) -> Material:
    if step.kind not in FILE_STEP_KINDS:
        raise AppError(400, "STEP_DOES_NOT_ACCEPT_FILES", "Bu bosqichga fayl yuklanmaydi")
    rel, original_name = await storage.save_upload(
        upload,
        "materials",
        allowed_ext=ALLOWED_MATERIAL_EXT,
        max_bytes=settings.max_material_mb * 1024 * 1024,
    )
    material = Material(
        step_id=step.id,
        title=title.strip(),
        original_file=rel,
        original_name=original_name,
        uploaded_by=user.id,
    )
    if rel.endswith(".pdf"):
        try:
            material.page_count = convert.count_pages(storage.path(rel))
        except convert.ConversionError as exc:
            storage.delete(rel)
            raise AppError(400, "INVALID_PDF", "PDF fayl buzilgan yoki o'qib bo'lmaydi") from exc
        material.pdf_file = rel
        material.status = MaterialStatus.ready
    else:
        material.status = MaterialStatus.processing
    db.add(material)
    await db.commit()
    if material.status == MaterialStatus.processing:
        await jobs.enqueue(CONVERT_JOB, material_id=material.id)
    return material


async def ensure_can_edit_material(db: AsyncSession, user: User, material_id: int) -> Material:
    material = await db.get(Material, material_id)
    if material is None:
        raise AppError(404, "MATERIAL_NOT_FOUND", "Material topilmadi")
    await editing.ensure_can_edit_step(db, user, material.step_id)
    return material


async def delete_material(db: AsyncSession, material: Material, storage: Storage) -> None:
    paths = {material.original_file, material.pdf_file}
    await db.delete(material)
    await db.commit()
    for path in paths:
        storage.delete(path)


async def retry_material(db: AsyncSession, material: Material, jobs: JobRunner) -> Material:
    if material.status != MaterialStatus.failed:
        raise AppError(
            400, "MATERIAL_NOT_FAILED", "Faqat xato bilan tugagan materialni qayta ishlash mumkin"
        )
    material.status = MaterialStatus.processing
    material.error = None
    await db.commit()
    await jobs.enqueue(CONVERT_JOB, material_id=material.id)
    return material


@job(CONVERT_JOB)
async def convert_material_job(ctx: JobContext, material_id: int) -> None:
    async with ctx.sessionmaker() as db:
        material = await db.get(Material, material_id)
        if material is None or material.status != MaterialStatus.processing:
            return
        source = ctx.storage.path(material.original_file)
        error = "CONVERSION_FAILED"
        for _ in range(MAX_CONVERSION_ATTEMPTS):
            try:
                with tempfile.TemporaryDirectory() as tmp:
                    pdf = await convert.convert_to_pdf(
                        source,
                        Path(tmp),
                        soffice=ctx.settings.soffice_path,
                        timeout=ctx.settings.conversion_timeout_seconds,
                    )
                    page_count = convert.count_pages(pdf)
                    rel = ctx.storage.import_file(pdf, "materials", ".pdf")
            except convert.ConversionError as exc:
                error = exc.code
                if exc.code == "LIBREOFFICE_NOT_FOUND":
                    break
                continue
            material.pdf_file = rel
            material.page_count = page_count
            material.status = MaterialStatus.ready
            material.error = None
            await db.commit()
            return
        material.status = MaterialStatus.failed
        material.error = error
        await db.commit()
```

- [ ] **Step 7: `backend/app/learning/teach_materials_router.py`**

```python
from typing import Annotated

from fastapi import APIRouter, Form, Response, UploadFile

from app.auth.deps import StaffUser
from app.core.deps import AppSettings, AppStorage, DbSession, Jobs
from app.learning import editing, materials
from app.learning.models import Material
from app.learning.schemas import MaterialOut

router = APIRouter(prefix="/teach", tags=["teach"])


@router.post("/steps/{step_id}/materials", response_model=MaterialOut, status_code=201)
async def upload_material(
    step_id: int,
    title: Annotated[str, Form(min_length=1, max_length=200)],
    file: UploadFile,
    user: StaffUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
    jobs: Jobs,
) -> Material:
    step, _topic = await editing.ensure_can_edit_step(db, user, step_id)
    return await materials.add_material(
        db,
        step=step,
        title=title,
        upload=file,
        user=user,
        storage=storage,
        settings=settings,
        jobs=jobs,
    )


@router.delete("/materials/{material_id}", status_code=204)
async def delete_material(
    material_id: int, user: StaffUser, db: DbSession, storage: AppStorage
) -> Response:
    material = await materials.ensure_can_edit_material(db, user, material_id)
    await materials.delete_material(db, material, storage)
    return Response(status_code=204)


@router.post("/materials/{material_id}/retry", response_model=MaterialOut)
async def retry_material(material_id: int, user: StaffUser, db: DbSession, jobs: Jobs) -> Material:
    material = await materials.ensure_can_edit_material(db, user, material_id)
    return await materials.retry_material(db, material, jobs)
```

- [ ] **Step 8: `backend/app/api.py` ni yangilash**

```python
from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router
from app.learning.teach_materials_router import router as teach_materials_router
from app.learning.teach_router import router as teach_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_subjects_router)
api_router.include_router(teach_router)
api_router.include_router(teach_materials_router)
```

- [ ] **Step 9: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `91 passed`

- [ ] **Step 10: Commit**

```bash
cd .. && git add backend/app/learning backend/app/api.py backend/tests/factories.py backend/tests/test_convert.py backend/tests/test_materials.py
git commit -m "feat(teach): material upload with background PPT/DOC to PDF conversion"
```

---

### Task 14: O'qituvchi — glossariy va adabiyotlar API

**Files:**
- Create: `backend/app/learning/topic_items.py`, `backend/app/learning/teach_items_router.py`
- Modify: `backend/app/api.py`
- Create: `backend/tests/test_topic_items.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_topic_items.py`**

```python
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from tests.factories import auth_headers, make_subject, make_topic, make_user


@pytest.fixture
async def topic_ctx(db: AsyncSession, settings: Settings) -> dict[str, Any]:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    subject = await make_subject(db, teachers=[teacher])
    topic = await make_topic(db, subject)
    other_topic = await make_topic(db, subject, title="2-mavzu")
    return {
        "headers": auth_headers(teacher, settings),
        "base": f"/api/teach/topics/{topic.id}",
        "other_base": f"/api/teach/topics/{other_topic.id}",
    }


async def test_glossary_crud(client: AsyncClient, topic_ctx: dict[str, Any]) -> None:
    headers, base = topic_ctx["headers"], topic_ctx["base"]
    first = await client.post(
        f"{base}/glossary", headers=headers, json={"term": "Kasb", "definition": "Mehnat turi"}
    )
    second = await client.post(
        f"{base}/glossary", headers=headers, json={"term": "Texnika", "definition": "Asboblar"}
    )
    assert first.status_code == 201, first.text
    assert (first.json()["order"], second.json()["order"]) == (1, 2)

    term_id = first.json()["id"]
    updated = await client.patch(
        f"{base}/glossary/{term_id}", headers=headers, json={"definition": "Faoliyat turi"}
    )
    assert updated.json()["definition"] == "Faoliyat turi"
    assert updated.json()["term"] == "Kasb"

    deleted = await client.delete(f"{base}/glossary/{term_id}", headers=headers)
    assert deleted.status_code == 204
    listed = await client.get(f"{base}/glossary", headers=headers)
    assert [t["term"] for t in listed.json()] == ["Texnika"]


async def test_glossary_term_of_other_topic_is_404(
    client: AsyncClient, topic_ctx: dict[str, Any]
) -> None:
    headers = topic_ctx["headers"]
    created = await client.post(
        f"{topic_ctx['base']}/glossary", headers=headers, json={"term": "A", "definition": "B"}
    )
    response = await client.patch(
        f"{topic_ctx['other_base']}/glossary/{created.json()['id']}",
        headers=headers,
        json={"term": "X"},
    )
    assert response.status_code == 404
    assert response.json()["code"] == "GLOSSARY_TERM_NOT_FOUND"


async def test_literature_crud_and_validation(
    client: AsyncClient, topic_ctx: dict[str, Any]
) -> None:
    headers, base = topic_ctx["headers"], topic_ctx["base"]
    created = await client.post(
        f"{base}/literature",
        headers=headers,
        json={"title": "Kasb-hunar ta'limi", "author": "Ismoilov R.", "year": 2021,
              "url": "https://lex.uz/doc"},
    )  # fmt: skip
    assert created.status_code == 201, created.text
    item_id = created.json()["id"]

    bad_year = await client.post(
        f"{base}/literature", headers=headers, json={"title": "Eski", "year": 1500}
    )
    assert bad_year.status_code == 422
    bad_url = await client.post(
        f"{base}/literature", headers=headers, json={"title": "X", "url": "ftp://x"}
    )
    assert bad_url.status_code == 422

    cleared = await client.patch(f"{base}/literature/{item_id}", headers=headers, json={"url": None})
    assert cleared.json()["url"] is None
    assert cleared.json()["title"] == "Kasb-hunar ta'limi"

    missing = await client.delete(f"{base}/literature/9999", headers=headers)
    assert missing.status_code == 404
    assert missing.json()["code"] == "LITERATURE_NOT_FOUND"


async def test_students_cannot_edit_glossary(
    client: AsyncClient, db: AsyncSession, settings: Settings, topic_ctx: dict[str, Any]
) -> None:
    student = await make_user(db, email="talaba@mail.uz")
    response = await client.post(
        f"{topic_ctx['base']}/glossary",
        headers=auth_headers(student, settings),
        json={"term": "A", "definition": "B"},
    )
    assert response.status_code == 403
```

- [ ] **Step 2: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_topic_items.py -q`
Expected: FAIL — `/glossary` uchun `404`

- [ ] **Step 3: `backend/app/learning/topic_items.py`**

```python
from typing import TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.learning.editing import apply_update
from app.learning.models import GlossaryTerm, LiteratureItem
from app.learning.schemas import GlossaryIn, GlossaryUpdate, LiteratureIn, LiteratureUpdate

ItemT = TypeVar("ItemT", GlossaryTerm, LiteratureItem)

_LITERATURE_NULLABLE = frozenset({"year", "url"})


async def _next_order(db: AsyncSession, model: type[ItemT], topic_id: int) -> int:
    current = await db.scalar(select(func.max(model.order)).where(model.topic_id == topic_id))
    return (current or 0) + 1


async def _get_owned(
    db: AsyncSession, model: type[ItemT], topic_id: int, item_id: int, code: str
) -> ItemT:
    item = await db.get(model, item_id)
    if item is None or item.topic_id != topic_id:
        raise AppError(404, code, "Element topilmadi")
    return item


async def list_glossary(db: AsyncSession, topic_id: int) -> list[GlossaryTerm]:
    return list(
        await db.scalars(
            select(GlossaryTerm)
            .where(GlossaryTerm.topic_id == topic_id)
            .order_by(GlossaryTerm.order, GlossaryTerm.id)
        )
    )


async def add_glossary_term(db: AsyncSession, topic_id: int, data: GlossaryIn) -> GlossaryTerm:
    term = GlossaryTerm(
        topic_id=topic_id,
        term=data.term.strip(),
        definition=data.definition.strip(),
        order=await _next_order(db, GlossaryTerm, topic_id),
    )
    db.add(term)
    await db.commit()
    return term


async def get_glossary_term(db: AsyncSession, topic_id: int, term_id: int) -> GlossaryTerm:
    return await _get_owned(db, GlossaryTerm, topic_id, term_id, "GLOSSARY_TERM_NOT_FOUND")


async def update_glossary_term(
    db: AsyncSession, term: GlossaryTerm, data: GlossaryUpdate
) -> GlossaryTerm:
    apply_update(term, data.model_dump(exclude_unset=True), frozenset())
    await db.commit()
    return term


async def list_literature(db: AsyncSession, topic_id: int) -> list[LiteratureItem]:
    return list(
        await db.scalars(
            select(LiteratureItem)
            .where(LiteratureItem.topic_id == topic_id)
            .order_by(LiteratureItem.order, LiteratureItem.id)
        )
    )


async def add_literature(db: AsyncSession, topic_id: int, data: LiteratureIn) -> LiteratureItem:
    item = LiteratureItem(
        topic_id=topic_id,
        title=data.title.strip(),
        author=data.author.strip(),
        year=data.year,
        url=data.url,
        order=await _next_order(db, LiteratureItem, topic_id),
    )
    db.add(item)
    await db.commit()
    return item


async def get_literature_item(db: AsyncSession, topic_id: int, item_id: int) -> LiteratureItem:
    return await _get_owned(db, LiteratureItem, topic_id, item_id, "LITERATURE_NOT_FOUND")


async def update_literature_item(
    db: AsyncSession, item: LiteratureItem, data: LiteratureUpdate
) -> LiteratureItem:
    apply_update(item, data.model_dump(exclude_unset=True), _LITERATURE_NULLABLE)
    await db.commit()
    return item


async def delete_item(db: AsyncSession, item: GlossaryTerm | LiteratureItem) -> None:
    await db.delete(item)
    await db.commit()
```

- [ ] **Step 4: `backend/app/learning/teach_items_router.py`**

```python
from fastapi import APIRouter, Response

from app.auth.deps import StaffUser
from app.core.deps import DbSession
from app.learning import editing, topic_items
from app.learning.models import GlossaryTerm, LiteratureItem
from app.learning.schemas import (
    GlossaryIn,
    GlossaryOut,
    GlossaryUpdate,
    LiteratureIn,
    LiteratureOut,
    LiteratureUpdate,
)

router = APIRouter(prefix="/teach/topics/{topic_id}", tags=["teach"])


@router.get("/glossary", response_model=list[GlossaryOut])
async def list_glossary(topic_id: int, user: StaffUser, db: DbSession) -> list[GlossaryTerm]:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return await topic_items.list_glossary(db, topic_id)


@router.post("/glossary", response_model=GlossaryOut, status_code=201)
async def add_glossary_term(
    topic_id: int, data: GlossaryIn, user: StaffUser, db: DbSession
) -> GlossaryTerm:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return await topic_items.add_glossary_term(db, topic_id, data)


@router.patch("/glossary/{term_id}", response_model=GlossaryOut)
async def update_glossary_term(
    topic_id: int, term_id: int, data: GlossaryUpdate, user: StaffUser, db: DbSession
) -> GlossaryTerm:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    term = await topic_items.get_glossary_term(db, topic_id, term_id)
    return await topic_items.update_glossary_term(db, term, data)


@router.delete("/glossary/{term_id}", status_code=204)
async def delete_glossary_term(
    topic_id: int, term_id: int, user: StaffUser, db: DbSession
) -> Response:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    await topic_items.delete_item(db, await topic_items.get_glossary_term(db, topic_id, term_id))
    return Response(status_code=204)


@router.get("/literature", response_model=list[LiteratureOut])
async def list_literature(topic_id: int, user: StaffUser, db: DbSession) -> list[LiteratureItem]:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return await topic_items.list_literature(db, topic_id)


@router.post("/literature", response_model=LiteratureOut, status_code=201)
async def add_literature(
    topic_id: int, data: LiteratureIn, user: StaffUser, db: DbSession
) -> LiteratureItem:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return await topic_items.add_literature(db, topic_id, data)


@router.patch("/literature/{item_id}", response_model=LiteratureOut)
async def update_literature(
    topic_id: int, item_id: int, data: LiteratureUpdate, user: StaffUser, db: DbSession
) -> LiteratureItem:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    item = await topic_items.get_literature_item(db, topic_id, item_id)
    return await topic_items.update_literature_item(db, item, data)


@router.delete("/literature/{item_id}", status_code=204)
async def delete_literature(
    topic_id: int, item_id: int, user: StaffUser, db: DbSession
) -> Response:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    await topic_items.delete_item(db, await topic_items.get_literature_item(db, topic_id, item_id))
    return Response(status_code=204)
```

- [ ] **Step 5: `backend/app/api.py` ni yangilash**

```python
from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router
from app.learning.teach_items_router import router as teach_items_router
from app.learning.teach_materials_router import router as teach_materials_router
from app.learning.teach_router import router as teach_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_subjects_router)
api_router.include_router(teach_router)
api_router.include_router(teach_materials_router)
api_router.include_router(teach_items_router)
```

- [ ] **Step 6: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `95 passed`

- [ ] **Step 7: Commit**

```bash
cd .. && git add backend/app/learning/topic_items.py backend/app/learning/teach_items_router.py backend/app/api.py backend/tests/test_topic_items.py
git commit -m "feat(teach): glossary and literature CRUD for topics"
```

---

### Task 15: Talaba — fanlar, mavzular, bosqich kontenti va bosqichni tugatish

**Files:**
- Create: `backend/app/learning/student_schemas.py`, `backend/app/learning/content.py`, `backend/app/learning/progress.py`, `backend/app/learning/router.py`
- Modify: `backend/app/api.py`, `backend/tests/factories.py`
- Create: `backend/tests/test_student_learning.py`

- [ ] **Step 1: `backend/tests/factories.py` oxiriga `build_course` qo'shish**

Importlarga qo'shing:

```python
from dataclasses import dataclass
```

Fayl oxiriga qo'shing:

```python
@dataclass
class Course:
    teacher: User
    student: User
    subject: Subject
    topic1: Topic
    topic2: Topic
    hidden_topic: Topic
    teacher_headers: dict[str, str]
    student_headers: dict[str, str]
    material_ids: dict[str, int]


async def build_course(client: AsyncClient, db: AsyncSession, settings: Settings) -> Course:
    """Nashr qilingan fan: topic1 (bayon PDF + glossariy), topic2 (bayon PDF),
    hidden_topic (nashr qilinmagan, bayon PDF). Talaba uchun kontentli bosqichlar soni: 3."""
    teacher = await make_user(
        db, email="ustoz@mail.uz", role=Role.teacher, full_name="Nozima Hamdamova"
    )
    student = await make_user(db, email="talaba@mail.uz", full_name="Dilnoza Karimova")
    subject = await make_subject(db, teachers=[teacher])
    topic1 = await make_topic(db, subject, title="1-mavzu")
    topic2 = await make_topic(db, subject, title="2-mavzu")
    hidden = await make_topic(db, subject, title="Qoralama mavzu", published=False)
    teacher_headers = auth_headers(teacher, settings)

    material_ids: dict[str, int] = {}
    for key, topic in (("topic1", topic1), ("topic2", topic2), ("hidden", hidden)):
        lecture = await step_of(db, topic, StepKind.lecture)
        material = await add_ready_pdf(client, teacher_headers, lecture.id)
        material_ids[key] = int(str(material["id"]))

    response = await client.post(
        f"/api/teach/topics/{topic1.id}/glossary",
        headers=teacher_headers,
        json={"term": "Kasb", "definition": "Mehnat faoliyati turi"},
    )
    assert response.status_code == 201, response.text

    return Course(
        teacher=teacher,
        student=student,
        subject=subject,
        topic1=topic1,
        topic2=topic2,
        hidden_topic=hidden,
        teacher_headers=teacher_headers,
        student_headers=auth_headers(student, settings),
        material_ids=material_ids,
    )
```

- [ ] **Step 2: Failing testlar — `backend/tests/test_student_learning.py`**

```python
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, UserStatus
from app.core.config import Settings
from app.learning.models import Material, MaterialStatus, StepKind
from tests.factories import auth_headers, build_course, make_subject, make_user, step_of


async def test_subject_list_shows_published_subjects_with_progress(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    await make_subject(db, title="Yashirin fan", published=False)
    response = await client.get("/api/subjects", headers=course.student_headers)
    assert response.status_code == 200
    cards = response.json()
    assert [c["slug"] for c in cards] == [course.subject.slug]
    assert cards[0]["topic_count"] == 2
    assert cards[0]["progress"] == {"completed": 0, "total": 3}


async def test_unpublished_subject_visible_only_to_its_teacher(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    teacher = await make_user(db, email="ustoz@mail.uz", role=Role.teacher)
    student = await make_user(db, email="talaba@mail.uz")
    hidden = await make_subject(db, title="Yashirin fan", published=False, teachers=[teacher])
    url = f"/api/subjects/{hidden.slug}"

    denied = await client.get(url, headers=auth_headers(student, settings))
    assert denied.status_code == 404
    assert denied.json()["code"] == "SUBJECT_NOT_FOUND"
    allowed = await client.get(url, headers=auth_headers(teacher, settings))
    assert allowed.status_code == 200


async def test_subject_detail_lists_published_topics_for_students(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    url = f"/api/subjects/{course.subject.slug}"
    student_view = (await client.get(url, headers=course.student_headers)).json()
    assert [t["title"] for t in student_view["topics"]] == ["1-mavzu", "2-mavzu"]
    assert student_view["topics"][0]["progress"] == {"completed": 0, "total": 2}
    teacher_view = (await client.get(url, headers=course.teacher_headers)).json()
    assert len(teacher_view["topics"]) == 3


async def test_topic_detail_marks_steps_with_content(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    response = await client.get(f"/api/topics/{course.topic1.id}", headers=course.student_headers)
    assert response.status_code == 200
    body = response.json()
    assert [s["kind"] for s in body["steps"]] == [
        "review", "lecture", "presentation", "practice", "task", "glossary", "literature",
    ]  # fmt: skip
    assert {s["kind"] for s in body["steps"] if s["has_content"]} == {"lecture", "glossary"}
    assert all(s["status"] is None for s in body["steps"])
    assert body["progress"] == {"completed": 0, "total": 2}
    assert body["subject"]["slug"] == course.subject.slug


async def test_hidden_topic_is_404_for_students_only(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    url = f"/api/topics/{course.hidden_topic.id}"
    denied = await client.get(url, headers=course.student_headers)
    assert denied.status_code == 404
    assert denied.json()["code"] == "TOPIC_NOT_FOUND"
    assert (await client.get(url, headers=course.teacher_headers)).status_code == 200


async def test_step_content_lists_ready_materials_and_starts_progress(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    db.add(
        Material(
            step_id=lecture.id,
            title="Konvertatsiyada",
            original_file="materials/x.pptx",
            original_name="x.pptx",
            status=MaterialStatus.processing,
        )
    )
    await db.commit()

    response = await client.get(f"/api/steps/{lecture.id}", headers=course.student_headers)
    assert response.status_code == 200
    body = response.json()
    material_id = course.material_ids["topic1"]
    assert body["status"] == "in_progress"
    assert body["materials"] == [
        {
            "id": material_id,
            "title": "Mavzu bayoni",
            "page_count": 2,
            "file_url": f"/api/materials/{material_id}/file",
        }
    ]


async def test_glossary_step_returns_terms(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    glossary = await step_of(db, course.topic1, StepKind.glossary)
    body = (await client.get(f"/api/steps/{glossary.id}", headers=course.student_headers)).json()
    assert [t["term"] for t in body["glossary"]] == ["Kasb"]
    assert body["materials"] == []


async def test_completing_steps_updates_topic_progress(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    url = f"/api/steps/{lecture.id}/complete"
    first = await client.post(url, headers=course.student_headers)
    assert first.status_code == 200
    assert first.json()["status"] == "completed"
    assert (await client.post(url, headers=course.student_headers)).status_code == 200

    topic = await client.get(f"/api/topics/{course.topic1.id}", headers=course.student_headers)
    assert topic.json()["progress"] == {"completed": 1, "total": 2}


async def test_steps_without_self_completion_are_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    literature = await step_of(db, course.topic1, StepKind.literature)

    not_completable = await client.post(
        f"/api/steps/{review.id}/complete", headers=course.student_headers
    )
    assert not_completable.status_code == 400
    assert not_completable.json()["code"] == "STEP_NOT_COMPLETABLE"
    empty = await client.post(
        f"/api/steps/{literature.id}/complete", headers=course.student_headers
    )
    assert empty.status_code == 400
    assert empty.json()["code"] == "STEP_EMPTY"


async def test_pending_users_cannot_browse(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    pending = await make_user(db, email="kutish@mail.uz", status=UserStatus.pending)
    response = await client.get("/api/subjects", headers=auth_headers(pending, settings))
    assert response.status_code == 403
    assert response.json()["code"] == "ACCOUNT_PENDING"
```

- [ ] **Step 3: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_student_learning.py -q`
Expected: FAIL — `/api/subjects` uchun `404`

- [ ] **Step 4: `backend/app/learning/student_schemas.py`**

```python
from pydantic import BaseModel

from app.learning.models import ProgressStatus, StepKind
from app.learning.schemas import GlossaryOut, LiteratureOut


class ProgressOut(BaseModel):
    completed: int
    total: int


class SubjectCard(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    cover: str | None
    topic_count: int
    progress: ProgressOut


class TopicCard(BaseModel):
    id: int
    title: str
    summary: str
    order: int
    progress: ProgressOut


class SubjectDetailOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    cover: str | None
    topics: list[TopicCard]


class SubjectRef(BaseModel):
    id: int
    title: str
    slug: str


class StepBrief(BaseModel):
    id: int
    kind: StepKind
    order: int
    has_content: bool
    status: ProgressStatus | None


class TopicDetailOut(BaseModel):
    id: int
    title: str
    summary: str
    subject: SubjectRef
    steps: list[StepBrief]
    progress: ProgressOut


class MaterialView(BaseModel):
    id: int
    title: str
    page_count: int | None
    file_url: str


class StepContentOut(BaseModel):
    id: int
    topic_id: int
    kind: StepKind
    order: int
    has_content: bool
    status: ProgressStatus | None
    materials: list[MaterialView]
    glossary: list[GlossaryOut]
    literature: list[LiteratureOut]


class ContinueOut(BaseModel):
    subject_id: int
    subject_slug: str
    subject_title: str
    topic_id: int
    topic_title: str
    step_id: int
    step_kind: StepKind


class SubjectProgressOut(BaseModel):
    subject_id: int
    subject_title: str
    subject_slug: str
    progress: ProgressOut
```

- [ ] **Step 5: `backend/app/learning/content.py`**

```python
from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.learning.models import (
    FILE_STEP_KINDS,
    GlossaryTerm,
    LiteratureItem,
    Material,
    MaterialStatus,
    ProgressStatus,
    Step,
    StepKind,
    StepProgress,
)


@dataclass(frozen=True)
class StepInfo:
    id: int
    topic_id: int
    kind: StepKind
    order: int
    has_content: bool


async def load_step_infos(
    db: AsyncSession, topic_ids: Sequence[int]
) -> dict[int, list[StepInfo]]:
    """Har bir mavzu uchun bosqichlar ro'yxati (tartib bo'yicha) va ularda kontent bor-yo'qligi."""
    result: dict[int, list[StepInfo]] = {topic_id: [] for topic_id in topic_ids}
    if not topic_ids:
        return result
    steps = (
        await db.execute(
            select(Step.id, Step.topic_id, Step.kind, Step.order)
            .where(Step.topic_id.in_(topic_ids))
            .order_by(Step.topic_id, Step.order)
        )
    ).all()
    step_ids = [row.id for row in steps]
    ready_steps = set(
        await db.scalars(
            select(Material.step_id)
            .where(Material.step_id.in_(step_ids), Material.status == MaterialStatus.ready)
            .distinct()
        )
    )
    glossary_topics = set(
        await db.scalars(
            select(GlossaryTerm.topic_id).where(GlossaryTerm.topic_id.in_(topic_ids)).distinct()
        )
    )
    literature_topics = set(
        await db.scalars(
            select(LiteratureItem.topic_id)
            .where(LiteratureItem.topic_id.in_(topic_ids))
            .distinct()
        )
    )
    for row in steps:
        kind = StepKind(row.kind)
        if kind in FILE_STEP_KINDS:
            has_content = row.id in ready_steps
        elif kind == StepKind.glossary:
            has_content = row.topic_id in glossary_topics
        elif kind == StepKind.literature:
            has_content = row.topic_id in literature_topics
        else:
            # review / practice / task: faoliyatlar va vazifalar 2-bosqichda qo'shiladi.
            has_content = False
        result[row.topic_id].append(StepInfo(row.id, row.topic_id, kind, row.order, has_content))
    return result


async def load_progress(
    db: AsyncSession, user_id: int, step_ids: Sequence[int]
) -> dict[int, ProgressStatus]:
    if not step_ids:
        return {}
    rows = await db.execute(
        select(StepProgress.step_id, StepProgress.status).where(
            StepProgress.user_id == user_id, StepProgress.step_id.in_(step_ids)
        )
    )
    return {row.step_id: ProgressStatus(row.status) for row in rows}


def count_progress(
    infos: Sequence[StepInfo], progress: dict[int, ProgressStatus]
) -> tuple[int, int]:
    """(tugatilgan, jami) — faqat kontenti bor bosqichlar hisobga olinadi."""
    with_content = [info for info in infos if info.has_content]
    completed = sum(1 for info in with_content if progress.get(info.id) == ProgressStatus.completed)
    return completed, len(with_content)


def all_step_ids(infos: dict[int, list[StepInfo]]) -> list[int]:
    return [info.id for topic_infos in infos.values() for info in topic_infos]
```

- [ ] **Step 6: `backend/app/learning/progress.py`**

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.errors import AppError
from app.core.types import utcnow
from app.learning import editing, topic_items
from app.learning.content import all_step_ids, count_progress, load_progress, load_step_infos
from app.learning.models import (
    FILE_STEP_KINDS,
    SELF_COMPLETE_STEP_KINDS,
    Material,
    MaterialStatus,
    ProgressStatus,
    StepKind,
    StepProgress,
    Subject,
    Topic,
)
from app.learning.schemas import GlossaryOut, LiteratureOut
from app.learning.student_schemas import (
    MaterialView,
    ProgressOut,
    StepBrief,
    StepContentOut,
    SubjectCard,
    SubjectDetailOut,
    SubjectRef,
    TopicCard,
    TopicDetailOut,
)


async def published_subjects(db: AsyncSession) -> list[Subject]:
    return list(
        await db.scalars(
            select(Subject).where(Subject.is_published.is_(True)).order_by(Subject.order, Subject.id)
        )
    )


async def published_topics(db: AsyncSession, subject_ids: list[int]) -> list[Topic]:
    if not subject_ids:
        return []
    return list(
        await db.scalars(
            select(Topic)
            .where(Topic.subject_id.in_(subject_ids), Topic.is_published.is_(True))
            .order_by(Topic.order, Topic.id)
        )
    )


async def get_visible_topic(db: AsyncSession, user: User, topic_id: int) -> tuple[Topic, Subject]:
    """Mavzu talabaga ko'rinadi, agar mavzu ham, fan ham nashr qilingan bo'lsa.
    Fanga biriktirilgan o'qituvchi va admin esa nashr qilinmaganini ham ko'radi (preview)."""
    topic = await db.get(Topic, topic_id)
    if topic is not None:
        subject = await db.get(Subject, topic.subject_id)
        if subject is not None and (
            (topic.is_published and subject.is_published)
            or await editing.can_edit_subject(db, user, subject.id)
        ):
            return topic, subject
    raise AppError(404, "TOPIC_NOT_FOUND", "Mavzu topilmadi")


async def list_subject_cards(db: AsyncSession, user: User) -> list[SubjectCard]:
    subjects = await published_subjects(db)
    topics = await published_topics(db, [s.id for s in subjects])
    infos = await load_step_infos(db, [t.id for t in topics])
    progress = await load_progress(db, user.id, all_step_ids(infos))
    cards = []
    for subject in subjects:
        subject_topics = [t for t in topics if t.subject_id == subject.id]
        completed = total = 0
        for topic in subject_topics:
            done, count = count_progress(infos[topic.id], progress)
            completed += done
            total += count
        cards.append(
            SubjectCard(
                id=subject.id,
                title=subject.title,
                slug=subject.slug,
                description=subject.description,
                cover=subject.cover,
                topic_count=len(subject_topics),
                progress=ProgressOut(completed=completed, total=total),
            )
        )
    return cards


async def subject_detail(db: AsyncSession, user: User, slug: str) -> SubjectDetailOut:
    subject = await db.scalar(select(Subject).where(Subject.slug == slug))
    can_edit = subject is not None and await editing.can_edit_subject(db, user, subject.id)
    if subject is None or (not subject.is_published and not can_edit):
        raise AppError(404, "SUBJECT_NOT_FOUND", "Fan topilmadi")
    stmt = select(Topic).where(Topic.subject_id == subject.id).order_by(Topic.order, Topic.id)
    if not can_edit:
        stmt = stmt.where(Topic.is_published.is_(True))
    topics = list(await db.scalars(stmt))
    infos = await load_step_infos(db, [t.id for t in topics])
    progress = await load_progress(db, user.id, all_step_ids(infos))
    cards = []
    for topic in topics:
        done, total = count_progress(infos[topic.id], progress)
        cards.append(
            TopicCard(
                id=topic.id,
                title=topic.title,
                summary=topic.summary,
                order=topic.order,
                progress=ProgressOut(completed=done, total=total),
            )
        )
    return SubjectDetailOut(
        id=subject.id,
        title=subject.title,
        slug=subject.slug,
        description=subject.description,
        cover=subject.cover,
        topics=cards,
    )


async def topic_detail(db: AsyncSession, user: User, topic_id: int) -> TopicDetailOut:
    topic, subject = await get_visible_topic(db, user, topic_id)
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    progress = await load_progress(db, user.id, [info.id for info in infos])
    done, total = count_progress(infos, progress)
    return TopicDetailOut(
        id=topic.id,
        title=topic.title,
        summary=topic.summary,
        subject=SubjectRef(id=subject.id, title=subject.title, slug=subject.slug),
        steps=[
            StepBrief(
                id=info.id,
                kind=info.kind,
                order=info.order,
                has_content=info.has_content,
                status=progress.get(info.id),
            )
            for info in infos
        ],
        progress=ProgressOut(completed=done, total=total),
    )


async def _progress_row(db: AsyncSession, user_id: int, step_id: int) -> StepProgress | None:
    return await db.scalar(
        select(StepProgress).where(StepProgress.user_id == user_id, StepProgress.step_id == step_id)
    )


async def step_content(db: AsyncSession, user: User, step_id: int) -> StepContentOut:
    step = await editing.get_step(db, step_id)
    topic, _ = await get_visible_topic(db, user, step.topic_id)
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    info = next(i for i in infos if i.id == step.id)

    row = await _progress_row(db, user.id, step.id)
    if row is None:
        row = StepProgress(user_id=user.id, step_id=step.id, status=ProgressStatus.in_progress)
        db.add(row)
    else:
        row.updated_at = utcnow()  # "davom ettirish" uchun oxirgi ochilgan bosqich
    await db.commit()

    materials: list[MaterialView] = []
    if step.kind in FILE_STEP_KINDS:
        ready = await db.scalars(
            select(Material)
            .where(Material.step_id == step.id, Material.status == MaterialStatus.ready)
            .order_by(Material.id)
        )
        materials = [
            MaterialView(
                id=m.id,
                title=m.title,
                page_count=m.page_count,
                file_url=f"/api/materials/{m.id}/file",
            )
            for m in ready
        ]
    glossary = (
        [GlossaryOut.model_validate(t) for t in await topic_items.list_glossary(db, topic.id)]
        if step.kind == StepKind.glossary
        else []
    )
    literature = (
        [LiteratureOut.model_validate(i) for i in await topic_items.list_literature(db, topic.id)]
        if step.kind == StepKind.literature
        else []
    )
    return StepContentOut(
        id=step.id,
        topic_id=topic.id,
        kind=step.kind,
        order=step.order,
        has_content=info.has_content,
        status=row.status,
        materials=materials,
        glossary=glossary,
        literature=literature,
    )


async def complete_step(db: AsyncSession, user: User, step_id: int) -> StepBrief:
    step = await editing.get_step(db, step_id)
    topic, _ = await get_visible_topic(db, user, step.topic_id)
    if step.kind not in SELF_COMPLETE_STEP_KINDS:
        raise AppError(400, "STEP_NOT_COMPLETABLE", "Bu bosqich topshiriq orqali yakunlanadi")
    infos = (await load_step_infos(db, [topic.id]))[topic.id]
    if not next(i for i in infos if i.id == step.id).has_content:
        raise AppError(400, "STEP_EMPTY", "Bu bosqichda hali material yo'q")

    row = await _progress_row(db, user.id, step.id)
    if row is None:
        row = StepProgress(user_id=user.id, step_id=step.id, status=ProgressStatus.in_progress)
        db.add(row)
    if row.status != ProgressStatus.completed:
        row.status = ProgressStatus.completed
        row.completed_at = utcnow()
    row.updated_at = utcnow()
    await db.commit()
    return StepBrief(
        id=step.id,
        kind=step.kind,
        order=step.order,
        has_content=True,
        status=ProgressStatus.completed,
    )
```

- [ ] **Step 7: `backend/app/learning/router.py`**

```python
from fastapi import APIRouter

from app.auth.deps import ActiveUser
from app.core.deps import DbSession
from app.learning import progress
from app.learning.student_schemas import (
    StepBrief,
    StepContentOut,
    SubjectCard,
    SubjectDetailOut,
    TopicDetailOut,
)

router = APIRouter(tags=["learning"])


@router.get("/subjects", response_model=list[SubjectCard])
async def list_subjects(user: ActiveUser, db: DbSession) -> list[SubjectCard]:
    return await progress.list_subject_cards(db, user)


@router.get("/subjects/{slug}", response_model=SubjectDetailOut)
async def get_subject(slug: str, user: ActiveUser, db: DbSession) -> SubjectDetailOut:
    return await progress.subject_detail(db, user, slug)


@router.get("/topics/{topic_id}", response_model=TopicDetailOut)
async def get_topic(topic_id: int, user: ActiveUser, db: DbSession) -> TopicDetailOut:
    return await progress.topic_detail(db, user, topic_id)


@router.get("/steps/{step_id}", response_model=StepContentOut)
async def get_step(step_id: int, user: ActiveUser, db: DbSession) -> StepContentOut:
    return await progress.step_content(db, user, step_id)


@router.post("/steps/{step_id}/complete", response_model=StepBrief)
async def complete_step(step_id: int, user: ActiveUser, db: DbSession) -> StepBrief:
    return await progress.complete_step(db, user, step_id)
```

- [ ] **Step 8: `backend/app/api.py` ni yangilash**

```python
from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router
from app.learning.router import router as learning_router
from app.learning.teach_items_router import router as teach_items_router
from app.learning.teach_materials_router import router as teach_materials_router
from app.learning.teach_router import router as teach_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_subjects_router)
api_router.include_router(teach_router)
api_router.include_router(teach_materials_router)
api_router.include_router(teach_items_router)
api_router.include_router(learning_router)
```

- [ ] **Step 9: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `105 passed`

- [ ] **Step 10: Commit**

```bash
cd .. && git add backend/app/learning backend/app/api.py backend/tests/factories.py backend/tests/test_student_learning.py
git commit -m "feat(learning): student subject/topic/step views and step completion"
```

---

### Task 16: Talaba — davom ettirish, progress xulosasi, PDF faylni berish

**Files:**
- Create: `backend/app/learning/resume.py`, `backend/app/learning/progress_router.py`
- Modify: `backend/app/api.py`
- Create: `backend/tests/test_resume.py`

- [ ] **Step 1: Failing testlar — `backend/tests/test_resume.py`**

```python
from typing import Any

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.learning.models import StepKind
from tests.factories import Course, auth_headers, build_course, make_user, step_of


async def complete(client: AsyncClient, course: Course, step_id: int) -> None:
    response = await client.post(f"/api/steps/{step_id}/complete", headers=course.student_headers)
    assert response.status_code == 200, response.text


async def continue_target(client: AsyncClient, course: Course) -> Any:
    response = await client.get("/api/me/continue", headers=course.student_headers)
    assert response.status_code == 200, response.text
    return response.json()


async def test_continue_walks_through_content_steps(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    t1_lecture = await step_of(db, course.topic1, StepKind.lecture)
    t1_glossary = await step_of(db, course.topic1, StepKind.glossary)
    t2_lecture = await step_of(db, course.topic2, StepKind.lecture)

    first = await continue_target(client, course)
    assert first["step_id"] == t1_lecture.id
    assert first["subject_slug"] == course.subject.slug

    await complete(client, course, t1_lecture.id)
    assert (await continue_target(client, course))["step_id"] == t1_glossary.id

    await complete(client, course, t1_glossary.id)
    nxt = await continue_target(client, course)
    assert (nxt["step_id"], nxt["topic_title"], nxt["step_kind"]) == (
        t2_lecture.id,
        "2-mavzu",
        "lecture",
    )

    await complete(client, course, t2_lecture.id)
    assert await continue_target(client, course) is None


async def test_continue_prefers_last_opened_topic(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    t2_lecture = await step_of(db, course.topic2, StepKind.lecture)
    opened = await client.get(f"/api/steps/{t2_lecture.id}", headers=course.student_headers)
    assert opened.status_code == 200
    assert (await continue_target(client, course))["step_id"] == t2_lecture.id


async def test_continue_is_null_without_content(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    student = await make_user(db)
    response = await client.get("/api/me/continue", headers=auth_headers(student, settings))
    assert response.status_code == 200
    assert response.json() is None


async def test_progress_summary(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    await complete(client, course, (await step_of(db, course.topic1, StepKind.lecture)).id)
    response = await client.get("/api/me/progress", headers=course.student_headers)
    assert response.json() == [
        {
            "subject_id": course.subject.id,
            "subject_title": course.subject.title,
            "subject_slug": course.subject.slug,
            "progress": {"completed": 1, "total": 3},
        }
    ]


async def test_material_file_is_served_to_students(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    response = await client.get(
        f"/api/materials/{course.material_ids['topic1']}/file", headers=course.student_headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"


async def test_hidden_topic_material_is_404_for_students(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    url = f"/api/materials/{course.material_ids['hidden']}/file"
    denied = await client.get(url, headers=course.student_headers)
    assert denied.status_code == 404
    assert denied.json()["code"] == "TOPIC_NOT_FOUND"
    assert (await client.get(url, headers=course.teacher_headers)).status_code == 200


async def test_unknown_material_is_404(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    response = await client.get("/api/materials/9999/file", headers=course.student_headers)
    assert response.status_code == 404
    assert response.json()["code"] == "MATERIAL_NOT_FOUND"


async def test_material_file_uses_accel_redirect_in_prod_mode(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    settings.media_accel_redirect = True
    response = await client.get(
        f"/api/materials/{course.material_ids['topic1']}/file", headers=course.student_headers
    )
    assert response.status_code == 200
    accel = response.headers["x-accel-redirect"]
    assert accel.startswith("/protected-media/materials/") and accel.endswith(".pdf")
    assert response.content == b""
```

- [ ] **Step 2: Testlar xato berishini tekshirish**

Run: `uv run pytest tests/test_resume.py -q`
Expected: FAIL — `/api/me/continue` uchun `404`

- [ ] **Step 3: `backend/app/learning/resume.py`**

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.errors import AppError
from app.learning import progress
from app.learning.content import all_step_ids, load_progress, load_step_infos
from app.learning.models import Material, MaterialStatus, ProgressStatus, Step, StepProgress
from app.learning.student_schemas import ContinueOut, SubjectProgressOut


async def continue_target(db: AsyncSession, user: User) -> ContinueOut | None:
    """Oxirgi ochilgan mavzudan boshlab birinchi tugatilmagan, kontentli bosqichni topadi.
    Oxiriga yetsa boshidan aylanib qidiradi. Hammasi tugagan bo'lsa None qaytaradi."""
    subjects = await progress.published_subjects(db)
    subject_by_id = {s.id: s for s in subjects}
    topics = await progress.published_topics(db, list(subject_by_id))
    if not topics:
        return None
    subject_rank = {s.id: index for index, s in enumerate(subjects)}
    topics.sort(key=lambda t: (subject_rank[t.subject_id], t.order, t.id))

    infos = await load_step_infos(db, [t.id for t in topics])
    step_ids = all_step_ids(infos)
    status = await load_progress(db, user.id, step_ids)
    last_step_id = await db.scalar(
        select(StepProgress.step_id)
        .where(StepProgress.user_id == user.id, StepProgress.step_id.in_(step_ids))
        .order_by(StepProgress.updated_at.desc(), StepProgress.id.desc())
        .limit(1)
    )
    start = 0
    if last_step_id is not None:
        start = next(
            index
            for index, topic in enumerate(topics)
            if any(info.id == last_step_id for info in infos[topic.id])
        )

    for topic in topics[start:] + topics[:start]:
        for info in infos[topic.id]:
            if info.has_content and status.get(info.id) != ProgressStatus.completed:
                subject = subject_by_id[topic.subject_id]
                return ContinueOut(
                    subject_id=subject.id,
                    subject_slug=subject.slug,
                    subject_title=subject.title,
                    topic_id=topic.id,
                    topic_title=topic.title,
                    step_id=info.id,
                    step_kind=info.kind,
                )
    return None


async def progress_summary(db: AsyncSession, user: User) -> list[SubjectProgressOut]:
    return [
        SubjectProgressOut(
            subject_id=card.id,
            subject_title=card.title,
            subject_slug=card.slug,
            progress=card.progress,
        )
        for card in await progress.list_subject_cards(db, user)
    ]


async def material_for_viewer(db: AsyncSession, user: User, material_id: int) -> Material:
    material = await db.get(Material, material_id)
    if material is None or material.status != MaterialStatus.ready or material.pdf_file is None:
        raise AppError(404, "MATERIAL_NOT_FOUND", "Material topilmadi")
    step = await db.get(Step, material.step_id)
    if step is None:
        raise AppError(404, "MATERIAL_NOT_FOUND", "Material topilmadi")
    await progress.get_visible_topic(db, user, step.topic_id)
    return material
```

- [ ] **Step 4: `backend/app/learning/progress_router.py`**

```python
from fastapi import APIRouter, Response
from fastapi.responses import FileResponse

from app.auth.deps import ActiveUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.learning import resume
from app.learning.student_schemas import ContinueOut, SubjectProgressOut

router = APIRouter(tags=["learning"])


@router.get("/me/continue", response_model=ContinueOut | None)
async def continue_learning(user: ActiveUser, db: DbSession) -> ContinueOut | None:
    return await resume.continue_target(db, user)


@router.get("/me/progress", response_model=list[SubjectProgressOut])
async def my_progress(user: ActiveUser, db: DbSession) -> list[SubjectProgressOut]:
    return await resume.progress_summary(db, user)


@router.get("/materials/{material_id}/file", response_class=Response)
async def material_file(
    material_id: int,
    user: ActiveUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Response:
    material = await resume.material_for_viewer(db, user, material_id)
    pdf_file = material.pdf_file or ""
    if settings.media_accel_redirect:
        # Prod: ruxsat API'da tekshiriladi, faylni nginx o'zi beradi (internal location).
        return Response(
            media_type="application/pdf",
            headers={"X-Accel-Redirect": f"/protected-media/{pdf_file}"},
        )
    return FileResponse(
        storage.path(pdf_file),
        media_type="application/pdf",
        filename=f"{material.title}.pdf",
        content_disposition_type="inline",
    )
```

- [ ] **Step 5: `backend/app/api.py` ni yangilash (yakuniy)**

```python
from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router
from app.learning.progress_router import router as progress_router
from app.learning.router import router as learning_router
from app.learning.teach_items_router import router as teach_items_router
from app.learning.teach_materials_router import router as teach_materials_router
from app.learning.teach_router import router as teach_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_subjects_router)
api_router.include_router(teach_router)
api_router.include_router(teach_materials_router)
api_router.include_router(teach_items_router)
api_router.include_router(learning_router)
api_router.include_router(progress_router)
```

- [ ] **Step 6: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `113 passed`

- [ ] **Step 7: Commit**

```bash
cd .. && git add backend/app/learning/resume.py backend/app/learning/progress_router.py backend/app/api.py backend/tests/test_resume.py
git commit -m "feat(learning): continue-learning target, progress summary and protected PDF serving"
```

---

### Task 17: Alembic migratsiyalari

**Files:**
- Create: `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/script.py.mako`, `backend/alembic/versions/` (autogenerate)
- Create: `backend/tests/test_migrations.py`

- [ ] **Step 1: Failing test — `backend/tests/test_migrations.py`**

```python
from pathlib import Path

import sqlalchemy as sa
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext

import app.models_registry  # noqa: F401
from app.core.db import Base

BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_migrations_build_the_same_schema_as_models(tmp_path: Path) -> None:
    db_path = (tmp_path / "migrated.db").as_posix()
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")

    command.upgrade(config, "head")

    engine = sa.create_engine(f"sqlite:///{db_path}")
    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"compare_type": False})
        diff = compare_metadata(context, Base.metadata)
    engine.dispose()
    assert diff == []
```

- [ ] **Step 2: Test xato berishini tekshirish**

Run: `uv run pytest tests/test_migrations.py -q`
Expected: FAIL — `alembic.ini` topilmadi (`CommandError` yoki `FileNotFoundError`)

- [ ] **Step 3: `backend/alembic.ini`**

```ini
[alembic]
script_location = %(here)s/alembic
prepend_sys_path = .
# sqlalchemy.url bo'sh: env.py URL'ni Settings'dan (DATABASE_URL) oladi.

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARNING
handlers = console
qualname =

[logger_sqlalchemy]
level = WARNING
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 4: `backend/alembic/env.py`**

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection

import app.models_registry  # noqa: F401
from app.core.config import get_settings
from app.core.db import Base, make_engine

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def database_url() -> str:
    return config.get_main_option("sqlalchemy.url") or get_settings().database_url


def run_migrations_offline() -> None:
    url = database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=url.startswith("sqlite"),
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=connection.dialect.name == "sqlite",
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    engine = make_engine(database_url())
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 5: `backend/alembic/script.py.mako`**

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

import app.core.types
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: str | None = ${repr(down_revision)}
branch_labels: str | Sequence[str] | None = ${repr(branch_labels)}
depends_on: str | Sequence[str] | None = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 6: Boshlang'ich migratsiyani yaratish**

Run:
```bash
mkdir -p alembic/versions
rm -f dev.db
uv run alembic revision --autogenerate -m "initial schema"
```
Expected: `Detected added table 'users'`, `'refresh_sessions'`, `'subjects'`, `'topics'`, `'subject_teachers'`, `'steps'`, `'materials'`, `'glossary_terms'`, `'literature'`, `'step_progress'` va `Generating .../alembic/versions/<rev>_initial_schema.py ... done`.

Yaratilgan faylni ochib tekshiring: `UTCDateTime` ustunlari `app.core.types.UTCDateTime()` ko'rinishida bo'lishi kerak. Fayl boshida `import app.core.types` bo'lishi shart (shablondan keladi).

- [ ] **Step 7: Migratsiyani lokal bazaga qo'llash**

Run: `uv run alembic upgrade head`
Expected: `Running upgrade  -> <rev>, initial schema`

- [ ] **Step 8: Testlar o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `114 passed`

- [ ] **Step 9: Commit**

```bash
cd .. && git add backend/alembic.ini backend/alembic backend/tests/test_migrations.py
git commit -m "feat(backend): alembic setup with initial schema migration"
```

---

### Task 18: Lint, tip tekshiruvi, CI (SQLite + PostgreSQL) va README

**Files:**
- Create: `.github/workflows/ci.yml`, `backend/README.md`
- Modify: ruff va mypy topgan joylar (`backend/app/**`, `backend/tests/**`)

- [ ] **Step 1: Kodni formatlash va lint xatolarini tuzatish**

Run:
```bash
uv run ruff format .
uv run ruff check . --fix
uv run ruff check .
```
Expected: oxirgi buyruq `All checks passed!` chiqaradi. Agar `--fix` hal qilolmagan xatolar qolsa, ularni qo'lda tuzating: `E501` uchun qatorni bo'ling, `B008` va boshqalar uchun kodni o'zgartiring. Xatolarni `noqa` bilan yashirmang.

- [ ] **Step 2: Tip tekshiruvi**

Run: `uv run mypy app`
Expected: `Success: no issues found`. Topilgan har bir xatoni tuzating: aniq tip qo'shing yoki `Optional` holatini tekshiring. `type: ignore` faqat Task 4'dagi `request.app.state` qaytaruvchilar uchun ruxsat etiladi.

- [ ] **Step 3: Testlar hali ham o'tishini tekshirish**

Run: `uv run pytest -q`
Expected: `114 passed`

- [ ] **Step 4: `.github/workflows/ci.yml` (repo ildizida)**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: texnologiya_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      PG_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/texnologiya_test
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
      - run: uv python install 3.12
      - run: uv sync --frozen
      - run: uv run ruff format --check .
      - run: uv run ruff check .
      - run: uv run mypy app
      - name: Tests (SQLite)
        run: uv run pytest -q
      - name: Migrations (PostgreSQL)
        run: uv run alembic upgrade head
        env:
          DATABASE_URL: ${{ env.PG_URL }}
      - name: Tests (PostgreSQL)
        run: uv run pytest -q
        env:
          TEST_DATABASE_URL: ${{ env.PG_URL }}
```

- [ ] **Step 5: `backend/README.md`**

````markdown
# Texnologiya platformasi — backend

FastAPI + SQLAlchemy 2. Lokal ishlab chiqish uchun Docker, PostgreSQL yoki Redis kerak emas: baza SQLite, fon ishlari shu jarayon ichida bajariladi.

## O'rnatish

```bash
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run python -m app.cli create-admin --email admin@example.uz --password "kuchli-parol-123" --name "Administrator"
```

## Ishga tushirish

```bash
uv run uvicorn app.main:create_app --factory --reload
```

API hujjatlari: http://localhost:8000/api/docs

## Testlar va tekshiruvlar

```bash
uv run pytest -q
uv run ruff check .
uv run mypy app
```

PostgreSQL'da test qilish uchun: `TEST_DATABASE_URL=postgresql+asyncpg://... uv run pytest -q`

## PPT/DOC → PDF

Taqdimot va Word fayllar LibreOffice orqali PDF'ga aylantiriladi. LibreOffice o'rnatilmagan bo'lsa, PDF yuklash ishlayveradi. PPT/DOC materiallar esa `failed` (`LIBREOFFICE_NOT_FOUND`) holatiga tushadi. LibreOffice'ni o'rnatgach, `.env` fayliga quyidagini yozing:

```
SOFFICE_PATH=C:/Program Files/LibreOffice/program/soffice.exe
```

So'ng o'qituvchi panelidagi "Qayta urinish" tugmasini bosing (`POST /api/teach/materials/{id}/retry`).

## Yangi migratsiya

```bash
uv run alembic revision --autogenerate -m "o'zgarish tavsifi"
uv run alembic upgrade head
```
````

- [ ] **Step 6: Serverni qo'lda tekshirish**

Run (alohida terminalda): `uv run uvicorn app.main:create_app --factory --port 8000`

Keyin:
```bash
curl -s http://localhost:8000/api/health
```
Expected: `{"status":"ok"}`. Shuningdek, http://localhost:8000/api/docs sahifasida barcha endpointlar guruhlari ko'rinadi: auth, admin, teach, learning. Serverni to'xtating.

- [ ] **Step 7: Commit**

```bash
cd .. && git add .github/workflows/ci.yml backend
git commit -m "chore(backend): lint/type fixes, CI with SQLite and PostgreSQL, README"
```

---

## Spec qamrovi (1A)

| Spec talabi | Task |
|---|---|
| Ro'yxatdan o'tish (`pending`), kirish, refresh, chiqish, `/me`, til, parol | 5, 6, 7 |
| Admin: tasdiqlash navbati, rol/holat, bloklash, vaqtinchalik parol | 8 |
| Birinchi admin CLI orqali, standart parol yo'q | 9 |
| Refresh rotatsiyasi, httpOnly cookie, hash saqlash, sessiyalarni bekor qilish | 5, 6, 7, 8 |
| Login rate limit | 3, 5 |
| Yagona xato formati, `request_id`, prod'da `/docs` o'chiq | 1, 2 |
| Fanlar, slug, o'qituvchi biriktirish | 10, 11 |
| Mavzular, avtomatik 7 bosqich, tartiblash, ruxsatlar | 10, 12 |
| Materiallar: tur/hajm tekshiruvi, UUID nom, PPT→PDF fon ishi, 3 urinish, `failed` + retry | 4, 13 |
| Glossariy, adabiyotlar | 14 |
| Talaba: fanlar, mavzular, bosqich kontenti, tugatish qoidalari, kontentsiz bosqich progressga kirmaydi | 15 |
| Davom ettirish, progress xulosasi, himoyalangan fayl (FileResponse / X-Accel-Redirect) | 16 |
| Ikki bazaga mos sxema, Alembic | 2, 10, 17 |
| CI: lint, mypy, SQLite + PostgreSQL testlari | 18 |

**1A'ga kirmaydi:**
- Frontend, i18n va E2E testlar — 1B-rejada.
- Docker Compose, arq/Redis runner, nginx — 4-bosqichda.
