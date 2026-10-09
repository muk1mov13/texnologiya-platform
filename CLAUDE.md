# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A rebuild of the Bukhara State Pedagogical Institute's "Metodik ta'minot" learning platform (subject → topic → 7 steps; students, teachers, admins). The full design spec is `docs/superpowers/specs/2026-10-08-texnologiya-platform-design.md`; the current phase plan is `docs/superpowers/plans/2026-10-09-phase-1a-backend.md`. Only Phase 1A (backend) exists so far. The `frontend/` (React + Vite) and `deploy/` (Docker Compose, nginx, arq worker) directories described in the spec haven't been created yet.

Code comments, docstrings, user-facing error messages and docs are written in **Uzbek (Latin script)**. Keep new ones in Uzbek to match.

## Commands

All backend commands run from `backend/` and use `uv`:

```bash
uv sync                                   # install (CI uses: uv sync --frozen)
cp .env.example .env
uv run alembic upgrade head
uv run python -m app.cli create-admin --email admin@example.uz --name "Administrator"   # password from --password, ADMIN_PASSWORD, or prompt
uv run uvicorn app.main:create_app --factory --reload   # API docs: http://localhost:8000/api/docs (disabled when ENV=prod)

uv run pytest -q                          # all tests
uv run pytest tests/test_materials.py -q  # one file
uv run pytest tests/test_materials.py::test_name -q     # one test
uv run ruff format --check .
uv run ruff check .
uv run mypy app

uv run alembic revision --autogenerate -m "description"   # new migration
```

CI (`.github/workflows/ci.yml`) runs ruff format, ruff check, mypy, pytest on SQLite, then on PostgreSQL 16 runs `alembic upgrade head`, `alembic check` (migration drift) and pytest again. To test against Postgres locally, set `TEST_DATABASE_URL=postgresql+asyncpg://...`.

Local development needs no Docker, PostgreSQL or Redis. PPT/DOC → PDF conversion needs LibreOffice (`SOFFICE_PATH` in `.env`). Without it, those materials go to `failed` with `LIBREOFFICE_NOT_FOUND`, while PDF uploads still work.

## Architecture (backend)

**App factory and state.** `app/main.py:create_app(settings)` builds everything and stores it on `app.state`: engine, sessionmaker, `Storage`, the job runner and the login rate limiter. Nothing is a module-level global. Routes reach these through the `Annotated` dependency aliases in `app/core/deps.py` (`DbSession`, `AppSettings`, `AppStorage`, `Jobs`, `LoginLimiter`). Auth aliases live in `app/auth/deps.py`: `CurrentUser`, `ActiveUser` (rejects pending users), `StaffUser` (teacher or admin) and `AdminUser`. Tests build the app with their own `Settings`, so any new shared resource should follow the same pattern.

**Dev/prod swappable pieces.** The code is written so local and production setups differ only in configuration:
- The DB is SQLite (aiosqlite) locally and PostgreSQL in CI and prod. All code must work on both. Use `BigIntPK`, `UTCDateTime` (rejects naive datetimes) and `str_enum()` (enums stored as VARCHAR) from `app/core/types.py`, never the raw SQLAlchemy types. `make_engine` turns on `PRAGMA foreign_keys=ON` for SQLite.
- Background jobs go through the `JobRunner` protocol (`app/core/jobs.py`). Register a job with the `@job("name")` decorator; it is called as `func(ctx: JobContext, **kwargs)`. Locally `InlineJobRunner` runs jobs as in-process asyncio tasks. Prod will use an arq worker with the same `enqueue()` signature. Because inline jobs aren't persisted, the startup lifespan marks any `processing` materials as `failed`/`INTERRUPTED`.
- Rate limiting uses `InMemoryRateLimiter` for now; Redis comes later.

**Modules.** `app/auth/` and `app/learning/` each have `models.py`, `schemas.py` and routers. Routers are kept thin: they check permissions, call module functions and return. In `learning`, the logic is split by area instead of living in one `service.py`:
- `editing.py`: subject and topic CRUD, slugify, and the permission checks `ensure_can_edit_subject` / `ensure_can_edit_step` (teachers may only edit subjects they're assigned to via `subject_teachers`; admins may edit any).
- `materials.py` and `convert.py`: the upload pipeline. Files are saved through `Storage` (UUID names, path-escape guard, size limit) and then checked against magic bytes. A PDF is marked `ready` right away. Other formats are enqueued as the `convert_material` job (LibreOffice → PyMuPDF page count, up to 3 attempts). The job uses short-lived DB sessions and re-checks the status before writing the result, so concurrent deletes are safe.
- `topic_items.py`: glossary and literature items.
- `progress.py`, `content.py` and `resume.py`: the student-facing views, step completion and the "continue where you left off" feature.

Every topic gets exactly one `Step` for each `StepKind`, in a fixed order (unique on `topic_id, kind`). Only `lecture`/`presentation` steps accept files, and only lecture/presentation/glossary/literature can be self-completed in Phase 1. Steps are never locked. Topic progress counts only steps that have content.

**New models** must be imported in `app/models_registry.py`. Alembic autogenerate and the test `create_all` both rely on that import. Constraint names come from `NAMING_CONVENTION` in `app/core/db.py`. Alembic runs with `render_as_batch` on SQLite and disables foreign keys during migrations (see `alembic/env.py`) so table rebuilds don't cascade-delete rows. `tests/test_migrations.py` checks that the migrations produce the same schema as the models, so always generate a migration when you change a model.

**Errors.** Raise `AppError(status, "UPPER_SNAKE_CODE", "Uzbek message", details)`. Every error response, including validation errors (422 `VALIDATION_ERROR`), HTTP errors and unhandled 500s, has the shape `{code, message, details}`. 500 responses include the `X-Request-ID` set by `app/core/middleware.py`.

**Auth.** Access tokens are short-lived JWTs sent as Bearer tokens. Refresh tokens are rotated and stored hashed in `refresh_sessions`; they travel in an httpOnly cookie scoped to `/api/auth`. New registrations start as `pending` until an admin approves them. Settings refuse to load in prod with the default `JWT_SECRET` or with `COOKIE_SECURE=false`.

**Tests.** `tests/conftest.py` provides the `settings`, `app` (runs drop_all/create_all, then drains jobs on teardown), `client` (httpx ASGI) and `db` fixtures. `tests/factories.py` has `make_user`, `auth_headers`, `make_subject`, `make_topic`, `step_of`, `make_pdf_bytes`, `add_ready_pdf` and `build_course`. pytest-asyncio runs in `auto` mode, so test functions don't need decorators. Ruff uses line length 100 with rules E/F/I/B/UP/ASYNC. mypy uses the pydantic plugin with `check_untyped_defs`.
