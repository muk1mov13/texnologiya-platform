# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A rebuild of the Bukhara State Pedagogical Institute's "Metodik ta'minot" learning platform (subject → topic → 7 steps; students, teachers, admins). The full design spec is `docs/superpowers/specs/2026-10-08-texnologiya-platform-design.md`; the phase roadmap (phases 0–4, status, next step) is `docs/superpowers/roadmap.md`; phase plans live in `docs/superpowers/plans/` (1A backend, 1B frontend, 2A backend, 2B frontend, 3A backend, 3B frontend, 4A backend, 4B frontend). Phase 1 (backend in `backend/`, React + Vite frontend in `frontend/`) is built. Phase 2 (assessment + gamification) has a mini-spec (`docs/superpowers/specs/2026-10-11-phase-2-assessment-design.md`); its backend (2A) and frontend (2B) are built and merged into `main`, but the Vitest and E2E tests for 2B were deliberately deferred and have not been run yet. Phase 3 (AI) has a mini-spec (`docs/superpowers/specs/2026-10-13-phase-3-ai-design.md`); its backend (3A) and frontend (3B) are built on `main` (tests for both deferred to the end of the project). Phase 4 (library, CMS, public site, deploy) has a mini-spec (`docs/superpowers/specs/2026-10-14-phase-4-design.md`); its backend (4A) and frontend (4B) are built on `main` (tests deferred), the deploy part (4C) is not written yet. The `deploy/` directory (Docker Compose, nginx, arq worker) described in the spec hasn't been created yet.

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
uv run python -m app.cli weekly-report [--week-start YYYY-MM-DD] [--subject ID]   # weekly AI report (default: last Mon–Sun)
uv run python -m app.cli seed-demo [--force]   # demo news, FAQ and site settings for the public site (idempotent)
uv run python -m app.cli import-resources --path "../resource/Platforma materiallari" [--dry-run] [--force]   # import the ready-made course files (needs LibreOffice only for .doc text, DOC/DOCX curricula or materials without a PDF)

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
- `syllabus.py`: the subject's curriculum (`Subject.syllabus_pdf`/`syllabus_name`), stored only as PDF; DOC/DOCX is converted inside the request.
- `resource_parse.py` and `resource_import.py`: the `import-resources` CLI. `resource/` (gitignored) holds `<subject>/<N section>/<topic folder>/<N) file>`; the section name gives `Topic.lesson_type` (`lecture|practical|seminar|lab`), a `dastur` folder holds the curriculum. Files are identified by their `N)` prefix: 1 crossword (→ `review`), 2 lecture text (→ `lecture` material + topic title), 3 quiz with an answer key (`Javoblar: 1–a; …` or a line of bare `1–B 2–A` pairs) (→ `practice`), 4 task, 5 glossary, 6 literature, 7 game slides (→ `presentation`). Text is always read from DOC/DOCX; a `2)`/`7)` PDF next to the original becomes the material as-is (no LibreOffice), and a PDF in `dastur` wins over DOC/DOCX. Other materials are converted one by one (no job queue); topics are matched by (subject, lesson_type, title), so re-running skips them unless `--force`.

`app/assessment/` (phase 2) follows the same split:
- `activities.py`: quiz, yes/no and crossword editing. An activity is saved whole: its items are replaced and the crossword grid is rebuilt by `crossword.py`, which holds pure, deterministic functions.
- `attempts.py`: grading, plus completing `review`/`practice` steps. Quiz options are shown to each student in their own order (`options.py: option_order(user_id, question_id, n)`, deterministic, never stored); the student view and `grade()` both use it, so answers are indexes in the shown order and the saved attempt `result` keeps that order. The DB keeps the teacher's order.
- `tasks.py` and `review.py`: submissions and grading.
- `views.py` and `reports.py`: student and teacher views.

Student-facing schemas live in `assessment/view_schemas.py` and never contain correct answers. `learning.student_schemas` imports them, and `assessment.schemas` imports `learning.student_schemas`. Keep that direction to avoid an import cycle.

`app/gamification/` imports no other module:
- `rules.py` holds the XP values and badge definitions as code.
- `service.award()` writes an `xp_events` row inside a savepoint. The unique constraint makes it idempotent, so a repeated event gives no XP. It does not commit; the caller commits.
- `sync_badges()` runs in the app lifespan and in the test `app` fixture.

`app/library/` and `app/cms/` (phase 4) hold the public site content:
- `library`: `folders.py` (tree per section `metodik|huquqiy`, non-empty folder → 409), `documents.py`, `books.py` (teachers upload, admin approves; an admin's upload is approved at once). Routers: public `/api/library` (no auth, including file downloads), `/api/teach/books`, `/api/admin/library`, `/api/admin/books`.
- `cms`: `news.py` (auto slug, `published_at` NULL = draft / future = scheduled, `views` incremented without touching `updated_at`), `faq.py`, `site.py` (whitelisted keys `contacts`/`socials`/`about`), `contact.py` (public form rate-limited by `app.state.contact_limiter` + honeypot), `seo.py` (`/api/seo/sitemap.xml`, `/api/seo/robots.txt`, built from `PUBLIC_BASE_URL`).
- Uploads go through `core/files.py: save_checked()` (magic bytes incl. webp, size limit); multipart text fields use `core/forms.py`. PDF documents and approved PDF books are indexed for the tutor (`index_library` job, `doc_chunks.subject_id`/`topic_id` NULL); deleting or un-approving removes their chunks.

`app/ai/` (phase 3) wraps the LLM provider:
- `services.build_ai()` puts an `AiServices` (llm, embedder, vectors, model names, `configured`) on `app.state.ai`. Routes get it through the `Ai` alias in `core/deps.py`, jobs through `JobContext.ai`. Without a key for the primary text provider (or without embeddings), `configured` is false and AI endpoints return 503 `AI_DISABLED` and the rest of the site works. Admins can also switch AI off at runtime (`ai_settings` row, `require_ai()`).
- `providers.py`: `GeminiProvider` (`google-genai`, `GEMINI_*` settings, global `TokenBucket` on `GEMINI_RPM`, retries on 429/5xx, then `ProviderBusy`), `OpenAICompatProvider` (any OpenAI-compatible `/chat/completions` API: Groq, Cerebras, OpenRouter; `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL_CHAT`/`_FAST`, `LLM_RPM`; text only), `TeiEmbeddingProvider` (local HuggingFace text-embeddings-inference container, `TEI_URL`/`TEI_MODEL`, default `intfloat/multilingual-e5-base` with `query: `/`passage: ` prefixes, 768 dims) and `FakeProvider` (`AI_PROVIDER=fake`: deterministic hash embeddings and canned JSON, no network; use it for local smoke checks and tests). `AI_PROVIDER=compat|gemini` picks the primary text provider; if the other one has a key too, `llm` is a `FallbackProvider(primary, other)`: on `ProviderBusy` text generation moves to the other provider (models mapped chat→chat, fast→fast); a stream switches only before its first chunk. The embedder is chosen separately (`EMBEDDING_PROVIDER=gemini|tei`). Chunks store `embedding_model`, so changing the model marks old chunks stale; the admin AI page reindexes them. e5 similarities are compressed, so `AI_MIN_SIMILARITY`/`AI_HINT_SIMILARITY` need recalibrating with `tei`.
- `vectors.py`: `VectorStore` with two dialects chosen from the engine: `SqliteVectorStore` (float32 BLOB + numpy dot product) and `PgVectorStore` (pgvector, HNSW index created only on PostgreSQL). Embeddings are L2-normalised; `EMBEDDING_DIM` is a constant in `constants.py`, changing it needs a migration.
- `indexing.py`: jobs `index_material`, `index_topic_glossary`, `index_topic_questions`, `reindex_all`. Hooks: a material that becomes `ready` is indexed (`learning/materials.py`), deleting a material deletes its `doc_chunks` by hand (`source_id` is not a FK), glossary edits and activity/task edits re-enqueue their topic. Question chunks (`activity`/`task`) never contain correct answers and are used only to detect hint mode, never as tutor context.
- `tutor.py` (SSE tutor, `ai_usage` daily limit in `usage.py`), `drafts.py` (draft → teacher approves → real unpublished activity/glossary/task), `grading.py` (AI suggestion for submissions, teacher-only fields), `reports.py` (weekly report, `weekly-report` CLI). The startup lifespan marks interrupted `generating` drafts and `pending` AI checks as `failed`.
- Prompts never include a user's name, email, phone or file name, and logs never include prompt or answer text.

Every topic gets exactly one `Step` for each `StepKind`, in a fixed order (unique on `topic_id, kind`). Only `lecture`/`presentation` steps accept files, and only lecture/presentation/glossary/literature can be self-completed. `review`/`practice` steps complete once every published activity has an attempt; a `task` step completes when the student submits. Steps are never locked. Topic progress counts only steps that have content.

**New models** must be imported in `app/models_registry.py`. Alembic autogenerate and the test `create_all` both rely on that import. Constraint names come from `NAMING_CONVENTION` in `app/core/db.py`. Alembic runs with `render_as_batch` on SQLite and disables foreign keys during migrations (see `alembic/env.py`) so table rebuilds don't cascade-delete rows. `tests/test_migrations.py` checks that the migrations produce the same schema as the models, so always generate a migration when you change a model.

**Errors.** Raise `AppError(status, "UPPER_SNAKE_CODE", "Uzbek message", details)`. Every error response, including validation errors (422 `VALIDATION_ERROR`), HTTP errors and unhandled 500s, has the shape `{code, message, details}`. 500 responses include the `X-Request-ID` set by `app/core/middleware.py`.

**Auth.** Access tokens are short-lived JWTs sent as Bearer tokens. Refresh tokens are rotated and stored hashed in `refresh_sessions`; they travel in an httpOnly cookie scoped to `/api/auth`. Reusing a revoked refresh token revokes all of the user's sessions (`REFRESH_REUSED`), except within `REFRESH_REUSE_GRACE_SECONDS` (default 30 s) of its revocation, where only that request gets 401 `REFRESH_ROTATED` (concurrent tabs, interrupted reload). New registrations start as `pending` until an admin approves them. Settings refuse to load in prod with the default `JWT_SECRET` or with `COOKIE_SECURE=false`.

**Tests.** `tests/conftest.py` provides the `settings`, `app` (runs drop_all/create_all, then drains jobs on teardown), `client` (httpx ASGI) and `db` fixtures. `tests/factories.py` has `make_user`, `auth_headers`, `make_subject`, `make_topic`, `step_of`, `make_pdf_bytes`, `add_ready_pdf` and `build_course`. pytest-asyncio runs in `auto` mode, so test functions don't need decorators. Ruff uses line length 100 with rules E/F/I/B/UP/ASYNC. mypy uses the pydantic plugin with `check_untyped_defs`.

## Architecture (frontend)

- **Auth:** the access token lives only in memory (`src/api/client.ts`). The refresh token is the backend's httpOnly cookie. On load, `SessionGate` restores the session via `POST /api/auth/refresh`. On a 401 with `INVALID_TOKEN`/`NOT_AUTHENTICATED`, the client does one single-flight refresh (serialised across tabs with Web Locks) and retries the request once. The current user is the TanStack Query `['session']` entry (`User | null`).
- **Routing:** route guards live in `src/app/guards.tsx`. `RequireAuth roles=[...]` sends pending users to `/pending` and users with the wrong role to `homePathFor(user)`. `RedirectIfAuthed` covers `/login` and `/register`.
- **Data states:** pages render queries through `QueryState` (`src/components/ui/QueryState.tsx`): data first, then spinner, then `ErrorState` (retry only for 5xx/network errors).
- **Errors:** every API error is an `ApiError` carrying the backend `code`. User-facing text comes from `errors.<CODE>` in i18n via `errorText()`. Mutations show a global error toast unless `meta: { silent: true }` is set; silent mutations render a `FormError` inline instead.
- **Assessment (phase 2):** student hooks live in `src/api/assessment.ts`, teacher hooks in `src/api/teachAssessment.ts`. Mutations that return `rewards` call `announceRewards()` (`src/lib/rewards.ts`), which shows "+N XP" and new-badge toasts. UI lives in `features/student/assessment/` (activity players, crossword, task step) and `features/teach/assessment/` (activity editors, task form, zod schemas), plus the pages `ResultsPage`, `AttemptDetailPage`, `ReviewQueuePage`, `ReviewDetailPage` and `StatsPage`. Protected files (submissions) are downloaded with `useProtectedDownload` from `src/lib/download.ts`. `src/test/server.ts` has default empty handlers for `/api/me/dashboard`, `/api/teach/summary` and `/api/ai/usage` (AI disabled).
- **AI (phase 3):** hooks live in `src/api/ai.ts` (usage, conversations, `streamChat`), `src/api/teachAi.ts` (drafts, AI check, weekly reports) and `src/api/adminAi.ts`. The tutor streams over SSE with `apiStream()` (same 401/refresh path as `apiFetch`) and `readSse()` from `src/lib/sse.ts`; chat state lives in `features/student/tutor/useTutorChat.ts`. Every AI element hides itself when `useAiUsage().data.enabled` is false, and AI queries pass `enabled` so nothing is requested then. AI drafts are edited with the existing editors through an injected saver (`features/teach/assessment/saver.ts`: `ActivityEditor saver`, `TaskForm draft`, exported `GlossaryForm`). UI: `features/student/tutor/` (`TutorPanel`, `TutorDock` in the player), `TutorPage` (`/app/tutor`), `features/teach/ai/` (drafts), `AiSuggestionCard`, `WeeklyReport`, `features/admin/AdminAiPage` (`/admin/ai`).
- **Public site and CMS (phase 4):** hooks live in `src/api/library.ts` (public folder tree, book catalog, teacher "my books"), `src/api/cms.ts` (news, FAQ, site settings, contact form) and `src/api/adminCms.ts` (admin library, books, news, FAQ, messages, site); admin changes also invalidate the public caches. Library files and covers are public URLs (`<a href download>`, `<img>`); admin-only files (pending book, draft news cover) go through `useProtectedDownload`/`apiBuffer`. `PublicLayout` has the public nav (`paths.ts: PUBLIC_NAV`, routes match backend `seo.py: STATIC_PATHS`), `MobileMenu` (☰ below `lg`, also used by `AppLayout`) and `SiteFooter`. Admins see one "Boshqaruv" link; `/admin/*` pages render inside their own `AdminShell` (not `AppLayout`): a dark collapsible sidebar with grouped `ADMIN_NAV` on `md+` (collapsed state in `localStorage`), a slide-in drawer on phones, and a breadcrumb topbar. Markdown is rendered only through `components/ui/Markdown.tsx` (`react-markdown`, `skipHtml`). Public pages set title/description/OG with `usePageMeta()`. Dates and sizes go through `lib/format.ts` (`formatDate`/`formatDateTime` build Uzbek month names by hand, since some ICU builds print "M10").
- **Motion (public site):** animations use `motion` through `LazyMotion strict` in `main.tsx` (features load as a separate chunk from `lib/motionFeatures.ts`), so always use `m.*`, never `motion.*`. `MotionConfig reducedMotion="user"` covers the whole app; CSS keyframe animations add `motion-reduce:animate-none`. Shared variants live in `lib/motion.ts`, scroll reveals use `components/motion/Reveal.tsx`, icons are inline SVG via `components/icons/Icon.tsx`. The home page is built from section components in `features/public/home/`; on `/` `PublicLayout` drops its container so sections can be full width.
- **API types:** `src/api/types.ts` is hand-written and used by the code. `src/api/types.contract.ts` checks it against the generated `schema.gen.ts` at type level, so after a backend schema change run `npm run gen:api` and fix whatever `typecheck` reports. Never edit `schema.gen.ts` by hand.
- **i18n:** never hard-code UI text. Add every key to both `src/i18n/uz.json` and `ru.json`; `i18n.test.ts` enforces this.
- **Lint rule:** files exporting components must not export anything else (react-refresh). Put zod schemas in `schemas.ts` and helpers in `.ts` files.
- **Tests:** `src/test/render.tsx` (`renderRoute`/`renderRoutes` with a memory router, session user and Toaster) and `src/test/fixtures.ts`. Mock HTTP with `server.use(http.get(...))` from `msw/http`; an unhandled request fails the test. `PdfViewer` is mocked in unit tests; real PDF rendering is covered by E2E. Vitest runs with `maxWorkers: 2` (more workers exhaust RAM on the dev machine).

## Execution Constraints (Token & Subagent Control)

- DO NOT spawn background subagents or use subagent-driven workflows.
- Work through a plan in batches of 3–5 tasks. Stop and ask for approval at the end of each batch, not after every task.
- One commit per task, with its `CHANGELOG.md` entry in the same commit (no separate "add hash" commits; the hash lives in git log).
- Keep reports short: what was done, how it was verified, what the next batch is.
- Do not run continuous or looping test-fix cycles. If a test fails twice, stop and report the error.
