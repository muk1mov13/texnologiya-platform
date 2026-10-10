# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A rebuild of the Bukhara State Pedagogical Institute's "Metodik ta'minot" learning platform (subject → topic → 7 steps; students, teachers, admins). The full design spec is `docs/superpowers/specs/2026-10-08-texnologiya-platform-design.md`; the phase roadmap (phases 0–4, status, next step) is `docs/superpowers/roadmap.md`; phase plans live in `docs/superpowers/plans/` (1A backend, 1B frontend). Phase 1 (backend in `backend/`, React + Vite frontend in `frontend/`) is built. The `deploy/` directory (Docker Compose, nginx, arq worker) described in the spec hasn't been created yet.

Code comments, docstrings, user-facing error messages and docs are written in **Uzbek (Latin script)**. Keep new ones in Uzbek to match.

**Change log:** every change (commits, merges, PRs, repo or infra actions) must be recorded in `CHANGELOG.md` (Uzbek, newest first, dated sections with short commit hashes). Update it in the same commit or right after, then commit.

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

Frontend commands run from `frontend/` (Node >=22.22.2):

```bash
npm install
npm run dev                               # http://localhost:5173, proxies /api → localhost:8000
npm test                                  # Vitest + RTL + MSW
npx vitest run src/api/client.test.ts -t "refresh"   # single test
npm run lint && npm run typecheck && npm run build
npm run e2e                               # Playwright; starts its own backend on :8001 with a fresh SQLite DB
npm run gen:api                           # regenerate src/api/schema.gen.ts from the backend OpenAPI (needs uv)
```

CI (`.github/workflows/ci.yml`) has three jobs. `backend` runs ruff format, ruff check, mypy, pytest on SQLite, then on PostgreSQL 16 runs `alembic upgrade head`, `alembic check` (migration drift) and pytest again. `frontend` runs lint, typecheck, Vitest and build. `e2e` (after both) checks that `npm run gen:api` leaves `schema.gen.ts` unchanged, then runs Playwright. To test against Postgres locally, set `TEST_DATABASE_URL=postgresql+asyncpg://...`.

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

**Auth.** Access tokens are short-lived JWTs sent as Bearer tokens. Refresh tokens are rotated and stored hashed in `refresh_sessions`; they travel in an httpOnly cookie scoped to `/api/auth`. Reusing a revoked refresh token revokes all of the user's sessions (`REFRESH_REUSED`), except within `REFRESH_REUSE_GRACE_SECONDS` (default 30 s) of its revocation, where only that request gets 401 `REFRESH_ROTATED` (concurrent tabs, interrupted reload). New registrations start as `pending` until an admin approves them. Settings refuse to load in prod with the default `JWT_SECRET` or with `COOKIE_SECURE=false`.

**Tests.** `tests/conftest.py` provides the `settings`, `app` (runs drop_all/create_all, then drains jobs on teardown), `client` (httpx ASGI) and `db` fixtures. `tests/factories.py` has `make_user`, `auth_headers`, `make_subject`, `make_topic`, `step_of`, `make_pdf_bytes`, `add_ready_pdf` and `build_course`. pytest-asyncio runs in `auto` mode, so test functions don't need decorators. Ruff uses line length 100 with rules E/F/I/B/UP/ASYNC. mypy uses the pydantic plugin with `check_untyped_defs`.

## Architecture (frontend)

- **Auth:** the access token lives only in memory (`src/api/client.ts`). The refresh token is the backend's httpOnly cookie. On load, `SessionGate` restores the session via `POST /api/auth/refresh`. On a 401 with `INVALID_TOKEN`/`NOT_AUTHENTICATED`, the client does one single-flight refresh (serialised across tabs with Web Locks) and retries the request once. The current user is the TanStack Query `['session']` entry (`User | null`).
- **Routing:** route guards live in `src/app/guards.tsx`. `RequireAuth roles=[...]` sends pending users to `/pending` and users with the wrong role to `homePathFor(user)`. `RedirectIfAuthed` covers `/login` and `/register`.
- **Data states:** pages render queries through `QueryState` (`src/components/ui/QueryState.tsx`): data first, then spinner, then `ErrorState` (retry only for 5xx/network errors).
- **Errors:** every API error is an `ApiError` carrying the backend `code`. User-facing text comes from `errors.<CODE>` in i18n via `errorText()`. Mutations show a global error toast unless `meta: { silent: true }` is set; silent mutations render a `FormError` inline instead.
- **API types:** `src/api/types.ts` is hand-written and used by the code. `src/api/types.contract.ts` checks it against the generated `schema.gen.ts` at type level, so after a backend schema change run `npm run gen:api` and fix whatever `typecheck` reports. Never edit `schema.gen.ts` by hand.
- **i18n:** never hard-code UI text. Add every key to both `src/i18n/uz.json` and `ru.json`; `i18n.test.ts` enforces this.
- **Lint rule:** files exporting components must not export anything else (react-refresh). Put zod schemas in `schemas.ts` and helpers in `.ts` files.
- **Tests:** `src/test/render.tsx` (`renderRoute`/`renderRoutes` with a memory router, session user and Toaster) and `src/test/fixtures.ts`. Mock HTTP with `server.use(http.get(...))` from `msw/http`; an unhandled request fails the test. `PdfViewer` is mocked in unit tests; real PDF rendering is covered by E2E. Vitest runs with `maxWorkers: 2` (more workers exhaust RAM on the dev machine).

## Execution Constraints (Token & Subagent Control)

- DO NOT spawn background subagents or use subagent-driven workflows.
- Execute only ONE task at a time as requested by the user.
- Stop immediately after finishing the single task and await user approval before touching anything else.
- Do not run continuous or looping test-fix cycles. If a test fails twice, stop and report the error.
